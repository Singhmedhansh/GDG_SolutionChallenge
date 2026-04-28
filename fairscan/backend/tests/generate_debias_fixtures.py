"""
Generate a deliberately biased test model + matching CSV for the Debiasing Engine.

Run from the project root:
    python fairscan/backend/tests/generate_debias_fixtures.py

Outputs:
    fairscan/backend/tests/fixtures/debias_test_model.pkl
    fairscan/backend/tests/fixtures/debias_test_data.csv

The dataset injects a strong gender bias: men get hired at ~80%, women at ~30%,
even after controlling for years_experience and interview_score. The model is
trained on this skewed data, so its raw predictions will exhibit a large
demographic-parity gap — perfect for verifying that ThresholdOptimizer /
fairness_penalty actually move the needle.
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

RNG_SEED = 42
N_ROWS = 600

OUT_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
os.makedirs(OUT_DIR, exist_ok=True)
CSV_PATH = os.path.join(OUT_DIR, "debias_test_data.csv")
MODEL_PATH = os.path.join(OUT_DIR, "debias_test_model.pkl")


def generate_dataset(n: int = N_ROWS, seed: int = RNG_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    gender = rng.choice([0, 1], size=n, p=[0.5, 0.5])  # 0 = female, 1 = male
    age = rng.integers(22, 60, size=n)
    years_experience = rng.integers(0, 25, size=n)
    interview_score = np.clip(rng.normal(70, 12, size=n), 0, 100).round(1)
    education_level = rng.choice([1, 2, 3, 4], size=n, p=[0.1, 0.45, 0.35, 0.10])

    # Hidden ground truth: a roughly fair function of merit signals only
    merit = (
        0.05 * years_experience
        + 0.03 * (interview_score - 70)
        + 0.25 * (education_level - 2)
        + rng.normal(0, 0.4, size=n)
    )

    # Inject gender bias INTO THE LABEL: men get a large unearned boost.
    # This is what makes the trained model unfair.
    biased_logit = merit + 1.6 * gender - 0.5
    p_hired = 1.0 / (1.0 + np.exp(-biased_logit))
    hired = (rng.random(n) < p_hired).astype(int)

    return pd.DataFrame({
        "gender": gender,
        "age": age,
        "years_experience": years_experience,
        "interview_score": interview_score,
        "education_level": education_level,
        "hired": hired,
    })


def main() -> None:
    df = generate_dataset()
    df.to_csv(CSV_PATH, index=False)

    feature_cols = ["gender", "age", "years_experience", "interview_score", "education_level"]
    X = df[feature_cols]
    y = df["hired"]

    # Train a vanilla LogisticRegression on the biased labels — no fairness mitigation.
    # ThresholdOptimizer requires predict_proba, which LogisticRegression provides.
    model = LogisticRegression(max_iter=1000, solver="lbfgs")
    model.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    # Quick sanity report
    preds = model.predict(X)
    male_rate = preds[df["gender"] == 1].mean()
    female_rate = preds[df["gender"] == 0].mean()
    print(f"Wrote dataset:  {CSV_PATH}  ({len(df)} rows)")
    print(f"Wrote model:    {MODEL_PATH}")
    print(f"Raw model approval rate — male:   {male_rate:.2%}")
    print(f"Raw model approval rate — female: {female_rate:.2%}")
    print(f"Demographic Parity Difference:    {abs(male_rate - female_rate):.3f}")
    print()
    print("Use these in the Debias Engine UI:")
    print("  Target column:        hired")
    print("  Protected attribute:  gender")
    print("  Metric:               demographic_parity (or equalized_odds)")


if __name__ == "__main__":
    main()
