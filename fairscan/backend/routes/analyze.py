from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import json
import pandas as pd
import io
import logging
from math import sqrt
from datetime import datetime
from scipy.stats import chi2_contingency

GEMINI_TIMEOUT_SECONDS = 15
MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB safety cap

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Response Models ──────────────────────────────────────
class GroupStat(BaseModel):
    group: str
    approvalRate: float

class AttributeResult(BaseModel):
    attribute: str
    groupStats: List[GroupStat]
    biasDetected: bool
    metric: str
    severity: str

class DatasetInfo(BaseModel):
    fileName: str
    totalRows: int
    totalColumns: int
    scannedAt: str

class AnalyzeResponse(BaseModel):
    fairnessScore: float
    status: str
    decisionColumn: str
    datasetInfo: DatasetInfo
    protectedAttributes: List[AttributeResult]
    flaggedProxies: List[Dict[str, Any]]
    recommendations: List[str]
    geminiSummary: Optional[str] = None

class DebiasResponse(BaseModel):
    original_fairness_score: float
    debiased_fairness_score: float
    improvement_percent: float
    debiased_model: str
    explanation: str
    inference_instructions: str

class JobPostingRequest(BaseModel):
    job_description: str

class BiasFlag(BaseModel):
    type: str
    severity: str
    example: str
    explanation: str

class JobPostingResponse(BaseModel):
    bias_flags: List[BiasFlag]
    overall_risk: str
    suggestions: List[str]
    rewritten_job: str


# ── Helper: Read CSV from UploadFile ─────────────────────
async def read_csv_upload(file: UploadFile) -> pd.DataFrame:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit.")
    try:
        return pd.read_csv(io.BytesIO(raw))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")


def _parse_string_list(value: str, field_name: str) -> List[str]:
    """Accept either JSON array or comma-separated strings from a form field."""
    if not value:
        return []
    value = value.strip()
    if value.startswith("["):
        try:
            parsed = json.loads(value)
            if not isinstance(parsed, list):
                raise ValueError
            return [str(v) for v in parsed]
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid JSON for {field_name}.")
    return [item.strip() for item in value.split(",") if item.strip()]


# ── Helper: Cramér's V (Bergsma 2013 bias-corrected) ─────
def _cramers_v(a: pd.Series, b: pd.Series) -> float:
    table = pd.crosstab(a, b)
    if table.size == 0:
        return float("nan")
    n = int(table.to_numpy().sum())
    if n == 0:
        return float("nan")
    r, k = table.shape
    if min(r, k) < 2:
        return 0.0
    chi2 = chi2_contingency(table, correction=False)[0]
    phi2 = chi2 / n
    phi2_corr = max(0.0, phi2 - ((k - 1) * (r - 1)) / (n - 1))
    k_corr = k - ((k - 1) ** 2) / (n - 1)
    r_corr = r - ((r - 1) ** 2) / (n - 1)
    denom = min(k_corr - 1, r_corr - 1)
    if denom <= 0:
        return 0.0
    return sqrt(phi2_corr / denom)


# ── Helper: Detect Proxy Columns ─────────────────────────
PROXY_THRESHOLD = 0.3
PROXY_STRONG = 0.5


def detect_proxies(
    df: pd.DataFrame, protected: List[str], decision: str
) -> List[Dict[str, Any]]:
    flagged: List[Dict[str, Any]] = []
    non_protected = [c for c in df.columns if c not in protected and c != decision]
    for col in non_protected:
        best: Dict[str, Any] = None
        for prot in protected:
            try:
                if (
                    pd.api.types.is_numeric_dtype(df[prot])
                    and pd.api.types.is_numeric_dtype(df[col])
                ):
                    raw = df[prot].corr(df[col])
                    value = abs(raw) if pd.notna(raw) else float("nan")
                    metric = "pearson"
                else:
                    value = _cramers_v(df[prot], df[col])
                    metric = "cramers_v"
                if pd.notna(value) and value > PROXY_THRESHOLD:
                    candidate = {
                        "column": col,
                        "protectedAttribute": prot,
                        "metric": metric,
                        "value": round(float(value), 4),
                        "strength": "strong" if value >= PROXY_STRONG else "moderate",
                    }
                    if best is None or candidate["value"] > best["value"]:
                        best = candidate
            except Exception as e:
                logger.warning(
                    "proxy check failed for %s vs %s: %s", prot, col, e
                )
                continue
        if best is not None:
            flagged.append(best)
    return flagged


# ── Helper: Analyze One Attribute ────────────────────────
def analyze_attribute(df: pd.DataFrame, attribute: str, decision: str) -> AttributeResult:
    try:
        groups = df[attribute].unique()
        group_stats = []
        approval_rates = []

        decision_col = df[decision].astype(str).str.lower()
        positive_values = {"yes", "1", "true", "hired", "approved", "accepted"}
        binary_decision = decision_col.isin(positive_values).astype(int)

        for group in groups:
            mask = df[attribute].astype(str).str.lower() == str(group).lower()
            group_df = binary_decision[mask]
            if len(group_df) == 0:
                continue
            rate = round(group_df.mean() * 100, 1)
            approval_rates.append(rate)
            group_stats.append(GroupStat(group=str(group), approvalRate=rate))

        if len(approval_rates) < 2:
            return AttributeResult(
                attribute=attribute,
                groupStats=group_stats,
                biasDetected=False,
                metric="Insufficient data",
                severity="none"
            )

        dpd = round((max(approval_rates) - min(approval_rates)) / 100, 2)
        bias_detected = dpd > 0.1

        if dpd > 0.3:
            severity = "high"
        elif dpd > 0.15:
            severity = "medium"
        else:
            severity = "low" if bias_detected else "none"

        return AttributeResult(
            attribute=attribute,
            groupStats=group_stats,
            biasDetected=bias_detected,
            metric=f"Demographic Parity Difference: {dpd}",
            severity=severity
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing {attribute}: {str(e)}")


# ── Helper: Calculate Fairness Score ─────────────────────
def calculate_fairness_score(results: List[AttributeResult]) -> float:
    if not results:
        return 100.0
    penalties = []
    for r in results:
        try:
            dpd = float(r.metric.split(": ")[1])
            penalty = min(dpd * 100, 40)
            penalties.append(penalty)
        except Exception:
            continue
    if not penalties:
        return 100.0
    avg_penalty = sum(penalties) / len(penalties)
    score = max(0, round(100 - avg_penalty, 1))
    return score


# ── Helper: Generate Recommendations ─────────────────────
def generate_recommendations(
    results: List[AttributeResult],
    proxies: List[Dict[str, Any]]
) -> List[str]:
    recs = []
    for r in results:
        if r.biasDetected:
            recs.append(
                f"Re-examine the '{r.attribute}' column — "
                f"a {r.metric.split(': ')[1]} disparity was detected across groups."
            )
    for proxy in proxies:
        column = proxy.get("column", "unknown") if isinstance(proxy, dict) else str(proxy)
        recs.append(
            f"Remove or re-weight '{column}' — "
            f"it correlates with protected attributes and may encode indirect bias."
        )
    if any(r.severity == "high" for r in results):
        recs.append(
            "Apply fairness constraints during model retraining "
            "to enforce demographic parity across high-severity attributes."
        )
    recs.append(
        "Collect more balanced training samples across all protected groups "
        "to reduce systemic bias in future model versions."
    )
    return recs


# ── /analyze: multipart upload ────────────────────────────
@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(..., description="CSV dataset"),
    decisionColumn: str = Form(...),
    protectedAttributes: str = Form(..., description="JSON array or comma-separated column names"),
    fileName: Optional[str] = Form(None),
):
    df = await read_csv_upload(file)
    protected_list = _parse_string_list(protectedAttributes, "protectedAttributes")
    display_name = fileName or file.filename or "uploaded.csv"

    missing = [c for c in [decisionColumn] + protected_list if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Columns not found in dataset: {missing}"
        )

    attribute_results = [
        analyze_attribute(df, attr, decisionColumn) for attr in protected_list
    ]

    proxies = detect_proxies(df, protected_list, decisionColumn)
    score = calculate_fairness_score(attribute_results)

    dataset_info = DatasetInfo(
        fileName=display_name,
        totalRows=len(df),
        totalColumns=len(df.columns),
        scannedAt=datetime.utcnow().isoformat() + "Z",
    )
    report_data = {
        "fairnessScore": score,
        "status": "biased" if score < 75 else "fair",
        "decisionColumn": decisionColumn,
        "datasetInfo": dataset_info.model_dump(),
        "protectedAttributes": [r.model_dump() for r in attribute_results],
        "flaggedProxies": proxies,
    }

    gemini_summary: Optional[str] = None
    gemini_recs: Optional[List[str]] = None
    try:
        from services.gemini import (
            generate_bias_summary,
            generate_bias_recommendations,
        )

        async def _summary():
            return await asyncio.wait_for(
                generate_bias_summary(report_data),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )

        async def _recs():
            return await asyncio.wait_for(
                generate_bias_recommendations(report_data),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )

        summary_result, recs_result = await asyncio.gather(
            _summary(), _recs(), return_exceptions=True
        )

        if isinstance(summary_result, Exception):
            logger.warning("gemini summary failed: %s", summary_result)
        else:
            gemini_summary = summary_result

        if isinstance(recs_result, Exception):
            logger.warning("gemini recommendations failed: %s", recs_result)
        else:
            gemini_recs = recs_result
    except Exception as e:
        logger.warning("gemini integration unavailable: %s", e)

    recommendations = gemini_recs if gemini_recs else generate_recommendations(attribute_results, proxies)

    return AnalyzeResponse(
        fairnessScore=score,
        status="biased" if score < 75 else "fair",
        decisionColumn=decisionColumn,
        datasetInfo=dataset_info,
        protectedAttributes=attribute_results,
        flaggedProxies=proxies,
        recommendations=recommendations,
        geminiSummary=gemini_summary,
    )


# ── /debias-model: multipart upload ───────────────────────
@router.post("/debias-model", response_model=DebiasResponse)
async def debias_model_endpoint(
    model_file: UploadFile = File(..., description="Pickled scikit-learn model (.pkl)"),
    dataset_file: UploadFile = File(..., description="CSV dataset"),
    target_column: str = Form(..., description="Name of the label/target column"),
    protected_attributes: str = Form(..., description="JSON array or comma-separated column names"),
    fairness_metric: str = Form(...),
    penalty_weight: float = Form(0.5),
):
    try:
        from services.debiasing import (
            load_model, apply_demographic_parity, apply_equalized_odds,
            apply_fairness_penalty, evaluate_fairness_before_after, return_debiased_model
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="Debiasing service is not available.")

    model_bytes = await model_file.read()
    if not model_bytes:
        raise HTTPException(status_code=400, detail="Model file is empty.")
    if len(model_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Model file exceeds 50 MB limit.")
    try:
        model = load_model(model_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid model file format: {str(e)}")

    df = await read_csv_upload(dataset_file)
    protected_list = _parse_string_list(protected_attributes, "protected_attributes")
    if not protected_list:
        raise HTTPException(status_code=400, detail="At least one protected attribute is required.")

    if target_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Target column '{target_column}' not found in dataset."
        )

    missing = [c for c in protected_list if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Protected attributes not found in dataset: {missing}")

    y = df[target_column]
    X = df.drop(columns=[target_column])
    protected_attr = df[protected_list[0]]

    try:
        if fairness_metric == "demographic_parity":
            debiased_model = apply_demographic_parity(model, X, y, protected_attr)
            wraps_optimizer = True
        elif fairness_metric == "equalized_odds":
            debiased_model = apply_equalized_odds(model, X, y, protected_attr)
            wraps_optimizer = True
        else:
            debiased_model = apply_fairness_penalty(model, X, y, protected_attr, penalty_weight)
            wraps_optimizer = False
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply debiasing: {str(e)}")

    metrics = evaluate_fairness_before_after(model, debiased_model, X, y, protected_attr)
    debiased_b64 = return_debiased_model(debiased_model)

    if wraps_optimizer:
        inference_instructions = (
            "This downloaded model is a Fairlearn ThresholdOptimizer. "
            "When calling .predict() in production, you must pass the sensitive attribute "
            "via the `sensitive_features` argument — for example: "
            f"`model.predict(X, sensitive_features=df['{protected_list[0]}'])`. "
            "Calling .predict() without sensitive_features will raise an error."
        )
    else:
        inference_instructions = (
            "This downloaded model is a standard scikit-learn estimator retrained with "
            "fairness-aware sample weights. Use .predict(X) as you normally would — no "
            "sensitive_features argument is required at inference time."
        )

    return DebiasResponse(
        original_fairness_score=metrics["original_fairness_score"],
        debiased_fairness_score=metrics["debiased_fairness_score"],
        improvement_percent=metrics["improvement_percent"],
        debiased_model=debiased_b64,
        explanation=f"Successfully applied {fairness_metric} constraint. Improved score by {metrics['improvement_percent']}%.",
        inference_instructions=inference_instructions,
    )


@router.post("/scan-job-posting", response_model=JobPostingResponse)
async def scan_job_posting_endpoint(request: JobPostingRequest):
    if not request.job_description or not request.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    try:
        from services.gemini import scan_job_posting_for_bias, rewrite_job_for_fairness
    except ImportError:
        raise HTTPException(status_code=500, detail="Gemini service is not available.")

    # Run sync Gemini SDK calls off the event loop so the server doesn't block
    # for 5–10 s while a single user is being scanned.
    scan_result = await asyncio.to_thread(scan_job_posting_for_bias, request.job_description)
    if not isinstance(scan_result, dict):
        scan_result = {}

    raw_flags = scan_result.get("bias_flags") or []
    if not isinstance(raw_flags, list):
        raw_flags = []

    # Defensive: Gemini occasionally returns malformed JSON (strings instead of
    # objects, missing keys). Skip anything that isn't a dict.
    parsed_flags: List[BiasFlag] = []
    for flag in raw_flags:
        if not isinstance(flag, dict):
            continue
        parsed_flags.append(
            BiasFlag(
                type=str(flag.get("type", "Unknown")),
                severity=str(flag.get("severity", "low")),
                example=str(flag.get("example", "")),
                explanation=str(flag.get("explanation", "")),
            )
        )

    rewritten_job = request.job_description
    if raw_flags:
        try:
            rewritten = await asyncio.to_thread(
                rewrite_job_for_fairness, request.job_description, raw_flags
            )
            if isinstance(rewritten, str) and rewritten.strip():
                rewritten_job = rewritten
        except Exception as e:
            logger.warning("rewrite_job_for_fairness failed: %s", e)

    suggestions = scan_result.get("suggestions") or []
    if not isinstance(suggestions, list):
        suggestions = []
    suggestions = [str(s) for s in suggestions if s]

    return JobPostingResponse(
        bias_flags=parsed_flags,
        overall_risk=str(scan_result.get("overall_risk", "low")),
        suggestions=suggestions,
        rewritten_job=rewritten_job,
    )
