from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import io
import base64
from datetime import datetime

router = APIRouter()

# ── Request/Response Models ──────────────────────────────
class AnalyzeRequest(BaseModel):
    fileName: str
    csvData: str  # base64 encoded CSV string
    decisionColumn: str
    protectedAttributes: List[str]

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
    flaggedProxies: List[str]
    recommendations: List[str]


# ── Helper: Decode CSV ───────────────────────────────────
def decode_csv(csvData: str) -> pd.DataFrame:
    try:
        decoded = base64.b64decode(csvData).decode("utf-8")
        df = pd.read_csv(io.StringIO(decoded))
        return df
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV data")


# ── Helper: Detect Proxy Columns ─────────────────────────
def detect_proxies(df: pd.DataFrame, protected: List[str], decision: str) -> List[str]:
    proxies = []
    non_protected = [c for c in df.columns if c not in protected and c != decision]
    for col in non_protected:
        try:
            for prot in protected:
                if df[prot].dtype == object or df[col].dtype == object:
                    encoded_prot = pd.factorize(df[prot])[0]
                    encoded_col = pd.factorize(df[col])[0]
                    corr = abs(pd.Series(encoded_prot).corr(pd.Series(encoded_col)))
                else:
                    corr = abs(df[prot].corr(df[col]))
                if corr > 0.3:
                    proxies.append(col)
                    break
        except Exception:
            continue
    return list(set(proxies))


# ── Helper: Analyze One Attribute ────────────────────────
def analyze_attribute(df: pd.DataFrame, attribute: str, decision: str) -> AttributeResult:
    try:
        groups = df[attribute].unique()
        group_stats = []
        approval_rates = []

        # Normalize decision column to binary
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
            group_stats.append(GroupStat(
                group=str(group),
                approvalRate=rate
            ))

        if len(approval_rates) < 2:
            return AttributeResult(
                attribute=attribute,
                groupStats=group_stats,
                biasDetected=False,
                metric="Insufficient data",
                severity="none"
            )

        # Demographic Parity Difference
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
    proxies: List[str]
) -> List[str]:
    recs = []
    for r in results:
        if r.biasDetected:
            recs.append(
                f"Re-examine the '{r.attribute}' column — "
                f"a {r.metric.split(': ')[1]} disparity was detected across groups."
            )
    for proxy in proxies:
        recs.append(
            f"Remove or re-weight '{proxy}' — "
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


# ── Main Endpoint ─────────────────────────────────────────
@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    # 1. Decode CSV
    df = decode_csv(request.csvData)

    # 2. Validate columns exist
    missing = [c for c in [request.decisionColumn] + request.protectedAttributes
               if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Columns not found in dataset: {missing}"
        )

    # 3. Analyze each protected attribute
    attribute_results = [
        analyze_attribute(df, attr, request.decisionColumn)
        for attr in request.protectedAttributes
    ]

    # 4. Detect proxy columns
    proxies = detect_proxies(df, request.protectedAttributes, request.decisionColumn)

    # 5. Calculate overall fairness score
    score = calculate_fairness_score(attribute_results)

    # 6. Generate recommendations
    recs = generate_recommendations(attribute_results, proxies)

    return AnalyzeResponse(
        fairnessScore=score,
        status="biased" if score < 75 else "fair",
        decisionColumn=request.decisionColumn,
        datasetInfo=DatasetInfo(
            fileName=request.fileName,
            totalRows=len(df),
            totalColumns=len(df.columns),
            scannedAt=datetime.utcnow().isoformat() + "Z"
        ),
        protectedAttributes=attribute_results,
        flaggedProxies=proxies,
        recommendations=recs
    )