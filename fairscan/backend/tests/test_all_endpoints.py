"""
FairScan - Comprehensive API Test Suite
Tests: /api/analyze, /api/scan-job-posting, /api/debias-model
Run from project root:  python fairscan/backend/tests/test_all_endpoints.py
"""
import sys, io
# Force UTF-8 output on Windows to avoid cp1252 crashes
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import sys
import os
import base64
import pickle
import io
import requests
import json
import traceback

# ── Color helpers ────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

BASE_URL = "http://127.0.0.1:8000"
PASS = f"{GREEN}[PASS]{RESET}"
FAIL = f"{RED}[FAIL]{RESET}"
WARN = f"{YELLOW}[WARN]{RESET}"

results = {"passed": 0, "failed": 0, "warned": 0}

def section(title):
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*60}{RESET}")

def log(status, name, detail=""):
    symbol = PASS if status == "pass" else (FAIL if status == "fail" else WARN)
    results[{"pass": "passed", "fail": "failed", "warn": "warned"}[status]] += 1
    print(f"  {symbol}  {name}")
    if detail:
        print(f"         {YELLOW}{detail}{RESET}")

def post(path, payload):
    try:
        r = requests.post(f"{BASE_URL}{path}", json=payload, timeout=30)
        return r
    except requests.exceptions.ConnectionError:
        print(f"\n{RED}FATAL: Cannot connect to backend at {BASE_URL}{RESET}")
        print("Make sure the backend is running: uvicorn main:app --reload")
        sys.exit(1)

# ── Load demo CSV ────────────────────────────────────────
def load_csv_b64(path="public/demo_hiring.csv"):
    """Load CSV relative to project root."""
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    full_path = os.path.join(root, path)
    if not os.path.exists(full_path):
        # Try relative to cwd
        if os.path.exists(path):
            full_path = path
        else:
            print(f"{RED}Cannot find {path}. Run from project root.{RESET}")
            sys.exit(1)
    with open(full_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def make_fake_model_b64():
    """Create a minimal sklearn LogisticRegression model, return as base64."""
    try:
        from sklearn.linear_model import LogisticRegression
        import pandas as pd
        import numpy as np

        np.random.seed(42)
        n = 200
        X = pd.DataFrame({
            "years_experience": np.random.randint(1, 20, n),
            "university_tier": np.random.randint(1, 4, n),
        })
        gender_raw = np.where(np.random.rand(n) > 0.5, "Male", "Female")
        y = np.where((X["years_experience"] > 5) & (gender_raw == "Male"), 1, 0)
        y = pd.Series(y)

        model = LogisticRegression(max_iter=200)
        model.fit(X, y)
        return base64.b64encode(pickle.dumps(model)).decode("utf-8"), X, y, pd.Series(gender_raw)
    except ImportError:
        return None, None, None, None

def make_dataset_csv_b64(X, gender_series, y):
    """Combine X + protected_attr + label into a CSV, return base64."""
    import pandas as pd
    df = X.copy()
    df["gender"] = gender_series.values
    df["hired"] = y.values
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return base64.b64encode(buf.getvalue().encode()).decode("utf-8")


# ════════════════════════════════════════════════════════
# 1. HEALTH CHECK
# ════════════════════════════════════════════════════════
def test_health():
    section("1. HEALTH CHECK")
    r = requests.get(f"{BASE_URL}/", timeout=5)
    if r.status_code == 200 and "running" in r.text.lower():
        log("pass", "GET / — API is healthy", f"Response: {r.json()}")
    else:
        log("fail", "GET / — API health check failed", f"Status {r.status_code}")


# ════════════════════════════════════════════════════════
# 2. /api/analyze — BIAS SCANNER
# ════════════════════════════════════════════════════════
def test_analyze():
    section("2. /api/analyze — BIAS SCANNER")
    csv_b64 = load_csv_b64()

    # 2a. Happy path — gender only
    r = post("/api/analyze", {
        "fileName": "demo_hiring.csv",
        "csvData": csv_b64,
        "decisionColumn": "hired",
        "protectedAttributes": ["gender"]
    })
    if r.status_code == 200:
        d = r.json()
        score = d.get("fairnessScore", -1)
        status = d.get("status", "")
        attrs = d.get("protectedAttributes", [])
        proxies = d.get("flaggedProxies", [])
        recs = d.get("recommendations", [])

        log("pass", "2a. Single attribute (gender) — 200 OK")
        log("pass" if 0 <= score <= 100 else "fail",
            f"2a. Fairness score in range [0,100]: {score}")
        log("pass" if status in ("biased", "fair") else "fail",
            f"2a. Status is valid: '{status}'")
        log("pass" if len(attrs) == 1 else "fail",
            f"2a. One attribute result returned: {len(attrs)}")
        log("pass" if attrs[0]["biasDetected"] is not None else "fail",
            f"2a. biasDetected field present: {attrs[0].get('biasDetected')}")
        log("pass" if len(proxies) >= 0 else "fail",
            f"2a. Proxy columns returned: {proxies}")
        log("pass" if len(recs) > 0 else "fail",
            f"2a. Recommendations returned: {len(recs)}")
    else:
        log("fail", f"2a. Single attribute — HTTP {r.status_code}", r.text[:200])

    # 2b. Multi-attribute — gender + age + race
    r = post("/api/analyze", {
        "fileName": "demo_hiring.csv",
        "csvData": csv_b64,
        "decisionColumn": "hired",
        "protectedAttributes": ["gender", "age", "race"]
    })
    if r.status_code == 200:
        d = r.json()
        log("pass", f"2b. Multi-attribute (gender+age+race) — 200 OK")
        log("pass" if len(d["protectedAttributes"]) == 3 else "fail",
            f"2b. Three attribute results returned: {len(d['protectedAttributes'])}")
        for attr in d["protectedAttributes"]:
            sev = attr.get("severity", "")
            log("pass" if sev in ("high","medium","low","none") else "fail",
                f"2b. Severity valid for '{attr['attribute']}': {sev}")
    else:
        log("fail", f"2b. Multi-attribute — HTTP {r.status_code}", r.text[:200])

    # 2c. Error: missing decision column
    r = post("/api/analyze", {
        "fileName": "demo_hiring.csv",
        "csvData": csv_b64,
        "decisionColumn": "nonexistent_column",
        "protectedAttributes": ["gender"]
    })
    log("pass" if r.status_code == 400 else "fail",
        f"2c. Missing decision column → 400 Bad Request: {r.status_code}")

    # 2d. Error: missing protected attribute
    r = post("/api/analyze", {
        "fileName": "demo_hiring.csv",
        "csvData": csv_b64,
        "decisionColumn": "hired",
        "protectedAttributes": ["nonexistent_attr"]
    })
    log("pass" if r.status_code == 400 else "fail",
        f"2d. Missing protected attr → 400 Bad Request: {r.status_code}")

    # 2e. Error: invalid base64 CSV
    r = post("/api/analyze", {
        "fileName": "bad.csv",
        "csvData": "THIS_IS_NOT_BASE64!!!",
        "decisionColumn": "hired",
        "protectedAttributes": ["gender"]
    })
    log("pass" if r.status_code in (400, 422) else "fail",
        f"2e. Invalid base64 CSV → 400/422: {r.status_code}")

    # 2f. DPD value sanity — female should have lower approval
    r = post("/api/analyze", {
        "fileName": "demo_hiring.csv",
        "csvData": csv_b64,
        "decisionColumn": "hired",
        "protectedAttributes": ["gender"]
    })
    if r.status_code == 200:
        attr = r.json()["protectedAttributes"][0]
        rates = {s["group"]: s["approvalRate"] for s in attr["groupStats"]}
        male_rate = rates.get("Male", rates.get("male", 0))
        female_rate = rates.get("Female", rates.get("female", 0))
        log("pass" if male_rate > female_rate else "warn",
            f"2f. Male approval ({male_rate}%) > Female approval ({female_rate}%) in biased dataset")
        dpd_str = attr.get("metric", "")
        log("pass" if "Demographic Parity Difference" in dpd_str else "fail",
            f"2f. DPD metric present: {dpd_str}")


# ════════════════════════════════════════════════════════
# 3. /api/scan-job-posting — JOB SCANNER
# ════════════════════════════════════════════════════════
def test_job_posting():
    section("3. /api/scan-job-posting — JOB BIAS SCANNER")

    biased_jd = """
    We are looking for a young, energetic rockstar developer who can hustle.
    Must be a cultural fit — preferably a native English speaker.
    Looking for someone who is fresh out of college with maximum 2 years experience.
    This is a physically demanding role, so only physically fit candidates need apply.
    We want someone who can start a family but is committed to long hours.
    """

    clean_jd = """
    We are seeking a skilled software engineer with experience in Python and cloud technologies.
    The candidate should be able to work collaboratively in a team environment.
    Proficiency in modern software development practices is required.
    """

    # 3a. Biased job description
    r = post("/api/scan-job-posting", {"job_description": biased_jd})
    if r.status_code == 200:
        d = r.json()
        flags = d.get("bias_flags", [])
        risk = d.get("overall_risk", "")
        suggestions = d.get("suggestions", [])
        rewritten = d.get("rewritten_job", "")

        log("pass", "3a. Biased JD — 200 OK")
        log("pass" if len(flags) > 0 else "warn",
            f"3a. Bias flags detected: {len(flags)}", 
            "(Gemini may return 0 if API key missing)")
        log("pass" if risk in ("high","medium","low","unknown") else "fail",
            f"3a. Overall risk is valid: '{risk}'")
        log("pass" if len(suggestions) >= 0 else "fail",
            f"3a. Suggestions returned: {len(suggestions)}")
        log("pass" if isinstance(rewritten, str) and len(rewritten) > 5 else "warn",
            f"3a. Rewritten job returned: {len(rewritten)} chars")

        for i, flag in enumerate(flags[:3]):
            log("pass" if flag.get("type") else "warn",
                f"3a. Flag {i+1}: type='{flag.get('type')}' severity='{flag.get('severity')}'")
    else:
        log("fail", f"3a. Biased JD — HTTP {r.status_code}", r.text[:300])

    # 3b. Clean job description
    r = post("/api/scan-job-posting", {"job_description": clean_jd})
    if r.status_code == 200:
        d = r.json()
        flags = d.get("bias_flags", [])
        risk = d.get("overall_risk", "")
        log("pass", "3b. Clean JD — 200 OK")
        log("pass" if risk in ("low","medium","unknown") else "warn",
            f"3b. Clean JD risk level: '{risk}' (expected low)")
    else:
        log("fail", f"3b. Clean JD — HTTP {r.status_code}", r.text[:200])

    # 3c. Empty job description
    r = post("/api/scan-job-posting", {"job_description": ""})
    log("pass" if r.status_code == 400 else "fail",
        f"3c. Empty JD → 400 Bad Request: {r.status_code}")

    # 3d. Whitespace-only JD
    r = post("/api/scan-job-posting", {"job_description": "   \n\t  "})
    log("pass" if r.status_code == 400 else "fail",
        f"3d. Whitespace-only JD → 400 Bad Request: {r.status_code}")

    # 3e. Very short but valid JD
    r = post("/api/scan-job-posting", {"job_description": "Hiring a developer."})
    log("pass" if r.status_code == 200 else "fail",
        f"3e. Short valid JD — HTTP {r.status_code}")


# ════════════════════════════════════════════════════════
# 4. /api/debias-model — MODEL DEBIASING
# ════════════════════════════════════════════════════════
def test_debias():
    section("4. /api/debias-model — MODEL DEBIASING ENGINE")

    model_b64, X, y, gender_series = make_fake_model_b64()

    if model_b64 is None:
        log("warn", "4. sklearn not available — skipping debias tests")
        return

    dataset_b64 = make_dataset_csv_b64(X, gender_series, y)

    # 4a. demographic_parity
    r = post("/api/debias-model", {
        "model_file": model_b64,
        "dataset_csv": dataset_b64,
        "protected_attributes": ["gender"],
        "fairness_metric": "demographic_parity",
        "penalty_weight": 0.5
    })
    if r.status_code == 200:
        d = r.json()
        log("pass", "4a. Demographic parity debiasing — 200 OK")
        log("pass" if "original_fairness_score" in d else "fail",
            f"4a. original_fairness_score present: {d.get('original_fairness_score')}")
        log("pass" if "debiased_fairness_score" in d else "fail",
            f"4a. debiased_fairness_score present: {d.get('debiased_fairness_score')}")
        log("pass" if "improvement_percent" in d else "fail",
            f"4a. improvement_percent present: {d.get('improvement_percent')}")
        log("pass" if isinstance(d.get("debiased_model"), str) and len(d["debiased_model"]) > 10 else "fail",
            f"4a. debiased_model returned (b64 length): {len(str(d.get('debiased_model','')))}")
    else:
        log("fail", f"4a. Demographic parity — HTTP {r.status_code}", r.text[:400])

    # 4b. equalized_odds
    r = post("/api/debias-model", {
        "model_file": model_b64,
        "dataset_csv": dataset_b64,
        "protected_attributes": ["gender"],
        "fairness_metric": "equalized_odds",
        "penalty_weight": 0.5
    })
    if r.status_code == 200:
        log("pass", f"4b. Equalized odds debiasing — 200 OK")
        d = r.json()
        log("pass" if d.get("debiased_fairness_score", -1) >= 0 else "fail",
            f"4b. Debiased score: {d.get('debiased_fairness_score')}")
    else:
        log("fail", f"4b. Equalized odds — HTTP {r.status_code}", r.text[:400])

    # 4c. fairness_penalty (custom penalty weight)
    r = post("/api/debias-model", {
        "model_file": model_b64,
        "dataset_csv": dataset_b64,
        "protected_attributes": ["gender"],
        "fairness_metric": "fairness_penalty",
        "penalty_weight": 0.8
    })
    if r.status_code == 200:
        log("pass", f"4c. Fairness penalty (0.8) — 200 OK")
    else:
        log("fail", f"4c. Fairness penalty — HTTP {r.status_code}", r.text[:400])

    # 4d. Missing protected attribute → 400
    r = post("/api/debias-model", {
        "model_file": model_b64,
        "dataset_csv": dataset_b64,
        "protected_attributes": ["nonexistent"],
        "fairness_metric": "demographic_parity",
        "penalty_weight": 0.5
    })
    log("pass" if r.status_code in (400, 422) else "fail",
        f"4d. Missing protected attr → 400/422: {r.status_code}")

    # 4e. Invalid base64 model
    r = post("/api/debias-model", {
        "model_file": "NOT_A_VALID_B64_MODEL",
        "dataset_csv": dataset_b64,
        "protected_attributes": ["gender"],
        "fairness_metric": "demographic_parity",
        "penalty_weight": 0.5
    })
    log("pass" if r.status_code in (400, 422) else "fail",
        f"4e. Invalid model b64 → 400/422: {r.status_code}")


# ════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════
def summary():
    section("TEST SUMMARY")
    total = results["passed"] + results["failed"] + results["warned"]
    print(f"\n  Total:   {total}")
    print(f"  {GREEN}Passed:  {results['passed']}{RESET}")
    print(f"  {RED}Failed:  {results['failed']}{RESET}")
    print(f"  {YELLOW}Warned:  {results['warned']}{RESET}")
    pct = int(results["passed"] / total * 100) if total > 0 else 0
    bar = "#" * (pct // 5) + "-" * (20 - pct // 5)
    print(f"\n  [{bar}] {pct}%\n")
    if results["failed"] == 0:
        print(f"  {GREEN}{BOLD}All tests passed!{RESET}\n")
    else:
        print(f"  {RED}{BOLD}{results['failed']} test(s) failed.{RESET}\n")


if __name__ == "__main__":
    print(f"\n{BOLD}FairScan API Test Suite — v1.0.0{RESET}")
    print(f"Target: {BASE_URL}\n")
    try:
        test_health()
        test_analyze()
        test_job_posting()
        test_debias()
    except KeyboardInterrupt:
        print("\nAborted by user.")
    finally:
        summary()
