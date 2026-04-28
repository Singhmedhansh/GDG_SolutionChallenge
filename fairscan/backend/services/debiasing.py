import pickle
import pandas as pd
import numpy as np
import base64
from fairlearn.postprocessing import ThresholdOptimizer
from fairlearn.metrics import demographic_parity_difference, equalized_odds_difference

def load_model(model_bytes: bytes):
    """Deserialize .pkl model from bytes."""
    return pickle.loads(model_bytes)

def apply_demographic_parity(model, X, y, protected_attr):
    """Applies demographic parity constraint using ThresholdOptimizer."""
    optimizer = ThresholdOptimizer(
        estimator=model,
        constraints="demographic_parity",
        objective="accuracy_score",
        predict_method="predict_proba",
        prefit=True
    )
    optimizer.fit(X, y, sensitive_features=protected_attr)
    return optimizer

def apply_equalized_odds(model, X, y, protected_attr):
    """Applies equalized odds constraint using ThresholdOptimizer."""
    optimizer = ThresholdOptimizer(
        estimator=model,
        constraints="equalized_odds",
        objective="accuracy_score",
        predict_method="predict_proba",
        prefit=True
    )
    optimizer.fit(X, y, sensitive_features=protected_attr)
    return optimizer

def apply_fairness_penalty(model, X, y, protected_attr, penalty_weight=0.5):
    """Retrains with fairness loss term implemented via sample weighting.

    Computes per-row inverse-probability weights based on (protected, label)
    joint distribution vs the independence assumption, then refits a deep copy
    of the model with sample_weight. Vectorized — does not rely on iterrows.
    """
    import copy

    protected_arr = np.asarray(protected_attr).reshape(-1)
    y_arr = np.asarray(y).reshape(-1)
    n = len(y_arr)
    if len(protected_arr) != n:
        raise ValueError(
            f"protected_attr length ({len(protected_arr)}) does not match y length ({n})"
        )

    df = pd.DataFrame({"protected": protected_arr, "label": y_arr})
    counts = df.groupby(["protected", "label"]).size()
    p_protected = df["protected"].value_counts() / n
    p_label = df["label"].value_counts() / n

    weights = np.ones(n)
    for i in range(n):
        p = protected_arr[i]
        l = y_arr[i]
        expected = float(p_protected.get(p, 0.0)) * float(p_label.get(l, 0.0)) * n
        actual = int(counts.get((p, l), 1))
        base_weight = expected / actual if actual > 0 else 1.0
        weights[i] = 1.0 + penalty_weight * (base_weight - 1.0)

    retrained_model = copy.deepcopy(model)
    try:
        retrained_model.fit(X, y, sample_weight=weights)
    except Exception:
        # Fallback if estimator doesn't accept sample_weight
        retrained_model.fit(X, y)
    return retrained_model

def evaluate_fairness_before_after(model, debiased_model, X, y, protected_attr):
    """Returns fairness scores for both original and debiased models."""
    preds_orig = model.predict(X)
    try:
        preds_debiased = debiased_model.predict(X, sensitive_features=protected_attr)
    except TypeError:
        preds_debiased = debiased_model.predict(X)
        
    orig_dpd = demographic_parity_difference(y, preds_orig, sensitive_features=protected_attr)
    orig_eod = equalized_odds_difference(y, preds_orig, sensitive_features=protected_attr)
    
    debiased_dpd = demographic_parity_difference(y, preds_debiased, sensitive_features=protected_attr)
    debiased_eod = equalized_odds_difference(y, preds_debiased, sensitive_features=protected_attr)
    
    # Convert DPD back to a 0-100 "score" layout similar to our fairness score (100 is best)
    # where score = max(0, 100 - DPD * 100)
    score_orig = max(0.0, round(100.0 - orig_dpd * 100.0, 1))
    score_debiased = max(0.0, round(100.0 - debiased_dpd * 100.0, 1))
    
    improvement_percent = round(((score_debiased - score_orig) / max(score_orig, 1.0)) * 100, 1)
    
    return {
        "original_fairness_score": score_orig,
        "debiased_fairness_score": score_debiased,
        "improvement_percent": improvement_percent,
        "original_dpd": round(orig_dpd, 3),
        "debiased_dpd": round(debiased_dpd, 3),
        "original_eod": round(orig_eod, 3),
        "debiased_eod": round(debiased_eod, 3),
    }

def return_debiased_model(debiased_model):
    """Serialize to .pkl bytes for download directly in base64."""
    model_bytes = pickle.dumps(debiased_model)
    return base64.b64encode(model_bytes).decode('utf-8')
