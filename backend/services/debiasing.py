"""
Run three fairness strategies against one (model, dataset) pair in a single
call so the frontend can render a side-by-side tradeoff table.

Strategies:
    - raw                 : untouched model; baseline accuracy + DPD
    - demographic_parity  : fairlearn ThresholdOptimizer, constraint="demographic_parity"
    - equalized_odds      : fairlearn ThresholdOptimizer, constraint="equalized_odds"

Response shape (see run_all_methods):
    {
      "raw_model":           {"accuracy", "dpd", "fairness_score"},
      "demographic_parity":  {"accuracy", "dpd", "fairness_score", "debiased_model"},
      "equalized_odds":      {"accuracy", "dpd", "fairness_score", "debiased_model"},
      "original_fairness_score": int,
      "protected_attribute": str,
      "explanation": str,
    }

`debiased_model` is a base64-encoded pickle of the fitted postprocessor so the
frontend can offer a download per strategy.
"""
from __future__ import annotations

import base64
import io
import pickle
from typing import Any, Dict

import numpy as np
import pandas as pd
from fairlearn.metrics import demographic_parity_difference
from fairlearn.postprocessing import ThresholdOptimizer
from sklearn.metrics import accuracy_score


def _load_model(model_b64: str):
    return pickle.loads(base64.b64decode(model_b64))


def _load_dataset(csv_b64: str) -> pd.DataFrame:
    raw = base64.b64decode(csv_b64)
    return pd.read_csv(io.BytesIO(raw))


def _pickle_b64(obj: Any) -> str:
    return base64.b64encode(pickle.dumps(obj)).decode("utf-8")


def _score_from_dpd(dpd: float) -> int:
    """Map DPD (0 = fair, 1 = maximally unfair) to a 0–100 fairness score."""
    dpd = max(0.0, min(1.0, float(dpd)))
    return int(round((1.0 - dpd) * 100))


def _split_features_target(df: pd.DataFrame, protected_attribute: str):
    target_col = df.columns[-1]
    y = df[target_col]
    X = df.drop(columns=[target_col])
    sensitive = X[protected_attribute] if protected_attribute in X.columns else df[protected_attribute]
    return X, y, sensitive, target_col


def _evaluate(y_true, y_pred, sensitive) -> Dict[str, Any]:
    acc = float(accuracy_score(y_true, y_pred))
    dpd = float(demographic_parity_difference(y_true, y_pred, sensitive_features=sensitive))
    return {
        "accuracy": round(acc, 4),
        "dpd": round(dpd, 4),
        "fairness_score": _score_from_dpd(dpd),
    }


def _fit_postprocessor(model, X, y, sensitive, constraint: str) -> ThresholdOptimizer:
    optimizer = ThresholdOptimizer(
        estimator=model,
        constraints=constraint,
        prefit=True,
        predict_method="predict",
    )
    optimizer.fit(X, y, sensitive_features=sensitive)
    return optimizer


def _tradeoff_sentence(method: str, raw_acc: float, new_acc: float, raw_dpd: float, new_dpd: float) -> str:
    acc_drop_pct = max(0.0, (raw_acc - new_acc) * 100)
    dpd_drop = max(0.0, raw_dpd - new_dpd)
    if method == "raw":
        return (
            f"Untouched baseline — accuracy {raw_acc * 100:.1f}% with a "
            f"demographic-parity gap of {raw_dpd:.2f}."
        )
    if method == "demographic_parity":
        return (
            f"Demographic Parity equalizes approval rates across groups "
            f"(DPD cut by {dpd_drop:.2f}) at the cost of ~{acc_drop_pct:.1f}% accuracy."
        )
    if method == "equalized_odds":
        return (
            f"Equalized Odds balances error rates per group — usually a smaller "
            f"accuracy hit (~{acc_drop_pct:.1f}%) than Demographic Parity, with a "
            f"{dpd_drop:.2f} reduction in DPD."
        )
    return ""


def run_all_methods(
    model_b64: str,
    dataset_csv_b64: str,
    protected_attribute: str,
) -> Dict[str, Any]:
    model = _load_model(model_b64)
    df = _load_dataset(dataset_csv_b64)
    X, y, sensitive, _ = _split_features_target(df, protected_attribute)

    raw_pred = model.predict(X)
    raw_metrics = _evaluate(y, raw_pred, sensitive)

    dp_optimizer = _fit_postprocessor(model, X, y, sensitive, "demographic_parity")
    dp_pred = dp_optimizer.predict(X, sensitive_features=sensitive)
    dp_metrics = _evaluate(y, dp_pred, sensitive)
    dp_metrics["debiased_model"] = _pickle_b64(dp_optimizer)

    eo_optimizer = _fit_postprocessor(model, X, y, sensitive, "equalized_odds")
    eo_pred = eo_optimizer.predict(X, sensitive_features=sensitive)
    eo_metrics = _evaluate(y, eo_pred, sensitive)
    eo_metrics["debiased_model"] = _pickle_b64(eo_optimizer)

    raw_metrics["tradeoff"] = _tradeoff_sentence(
        "raw", raw_metrics["accuracy"], raw_metrics["accuracy"],
        raw_metrics["dpd"], raw_metrics["dpd"],
    )
    dp_metrics["tradeoff"] = _tradeoff_sentence(
        "demographic_parity", raw_metrics["accuracy"], dp_metrics["accuracy"],
        raw_metrics["dpd"], dp_metrics["dpd"],
    )
    eo_metrics["tradeoff"] = _tradeoff_sentence(
        "equalized_odds", raw_metrics["accuracy"], eo_metrics["accuracy"],
        raw_metrics["dpd"], eo_metrics["dpd"],
    )

    explanation = (
        f"Raw model: {raw_metrics['accuracy'] * 100:.1f}% accuracy, DPD {raw_metrics['dpd']:.2f}. "
        f"Demographic Parity trades {max(0.0, (raw_metrics['accuracy'] - dp_metrics['accuracy'])) * 100:.1f}% "
        f"accuracy for DPD {dp_metrics['dpd']:.2f}. Equalized Odds lands at "
        f"{eo_metrics['accuracy'] * 100:.1f}% accuracy with DPD {eo_metrics['dpd']:.2f}."
    )

    return {
        "protected_attribute": protected_attribute,
        "original_fairness_score": raw_metrics["fairness_score"],
        "raw_model": raw_metrics,
        "demographic_parity": dp_metrics,
        "equalized_odds": eo_metrics,
        "explanation": explanation,
    }
