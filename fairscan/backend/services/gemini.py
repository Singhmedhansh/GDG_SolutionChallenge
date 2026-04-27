import os
import json
import asyncio
import logging
from typing import Optional, List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# We use the recommended text generation model
MODEL_NAME = 'gemini-2.5-flash'


def scan_job_posting_for_bias(job_description: str) -> dict:
    """Prompt Gemini to identify bias signals in a job description."""
    if not api_key:
        return {
            "bias_flags": [],
            "overall_risk": "low",
            "suggestions": ["Gemini API key is not configured. Cannot scan job description."],
            "rewritten_job": job_description
        }
        
    prompt = f"""
    You are an expert HR fairness auditor.
    Review the following job description for hidden bias regarding age, gender, language barriers, accessibility issues, cultural bias, or socioeconomic bias.
    
    Job Description:
    {job_description}
    
    You must return a JSON object with EXACTLY the following structure:
    {{
        "bias_flags": [
            {{
                "type": "Gender Bias" or "Age Bias" or "Accessibility" etc.,
                "severity": "high", "medium", or "low",
                "example": "the biased phrase or quote from the text",
                "explanation": "Why this is biased and how it impacts applicants"
            }}
        ],
        "overall_risk": "high", "medium", or "low",
        "suggestions": [
            "Actionable suggestion 1",
            "Actionable suggestion 2"
        ]
    }}
    
    Ensure the output is strictly valid JSON without markdown wrapping formatting (no ```json).
    If no biases are found, return empty bias_flags, overall_risk "low", and positive suggestions.
    """
    
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        text_resp = response.text.strip()
        if text_resp.startswith('```json'):
            text_resp = text_resp[7:]
        if text_resp.endswith('```'):
            text_resp = text_resp[:-3]
            
        data = json.loads(text_resp)
        # Verify structure
        return {
            "bias_flags": data.get("bias_flags", []),
            "overall_risk": data.get("overall_risk", "low"),
            "suggestions": data.get("suggestions", []),
        }
    except Exception as e:
        print(f"Error scanning job posting with Gemini: {e}")
        return {
            "bias_flags": [],
            "overall_risk": "unknown",
            "suggestions": ["Failed to analyze job posting due to a backend error."]
        }


def rewrite_job_for_fairness(job_description: str, bias_flags: list) -> str:
    """Prompt Gemini to rewrite job posting removing detected biases."""
    if not api_key:
        return job_description
        
    flags_text = json.dumps(bias_flags, indent=2)
    prompt = f"""
    You are an expert HR copywriter focused on inclusive language.
    Please rewrite the following job description to remove the identified biases, while keeping the core role requirements and intent intact.
    
    Identified Biases:
    {flags_text}
    
    Original Job Description:
    {job_description}
    
    Return ONLY the rewritten job description text. Do not include any meta-commentary, introductory text, or markdown code blocks around the text. 
    Ensure it flows naturally and uses inclusive, neutral language.
    """
    
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error rewriting job posting with Gemini: {e}")
        return job_description


# ── Helpers: format structured findings for the prompt ───
def _format_attribute_findings(report_data: dict) -> str:
    lines = []
    for a in report_data.get("protectedAttributes", []) or []:
        groups = ", ".join(
            f"{g.get('group')}={g.get('approvalRate')}%"
            for g in (a.get("groupStats") or [])
        )
        lines.append(
            f"- {a.get('attribute')}: {a.get('metric')} "
            f"(severity={a.get('severity')}, biasDetected={a.get('biasDetected')}). "
            f"Group approval rates: {groups}"
        )
    return "\n".join(lines) if lines else "(none)"


def _format_proxy_findings(report_data: dict) -> str:
    lines = []
    for p in report_data.get("flaggedProxies", []) or []:
        lines.append(
            f"- {p.get('column')} ↔ {p.get('protectedAttribute')} "
            f"({p.get('metric')}={p.get('value')}, {p.get('strength')})"
        )
    return "\n".join(lines) if lines else "(none)"


# ── Bias-analysis summary ────────────────────────────────
async def generate_bias_summary(report_data: dict) -> Optional[str]:
    """3–5 sentence plain-English summary grounded in this report's specific
    findings. Returns None on any failure (caller decides how to render)."""
    if not api_key:
        logger.warning("generate_bias_summary: GEMINI_API_KEY not set")
        return None

    score = report_data.get("fairnessScore")
    decision = report_data.get("decisionColumn")
    rows = (report_data.get("datasetInfo") or {}).get("totalRows")

    prompt = f"""You are a fairness analyst summarising a bias-analysis report for a non-technical audience (HR leads, hiring managers).

Dataset: {rows} rows, decision column "{decision}".
Overall fairness score: {score}/100.

Per-attribute findings (Demographic Parity Difference):
{_format_attribute_findings(report_data)}

Hidden proxy columns flagged (correlation with a protected attribute, threshold 0.3):
{_format_proxy_findings(report_data)}

Write a 3–5 sentence plain-English summary that:
1. States the overall fairness verdict and what it means for hiring outcomes.
2. Names the most disparate group(s) with their actual approval-rate gap (use the numbers above).
3. Calls out the strongest proxy column(s) and explicitly explains why removing the protected column alone doesn't fix the bias when these proxies remain.
4. Is specific to THIS dataset — reference real column names, group names, and numeric values from the data above. No generic platitudes.

Return only the summary paragraph. No markdown, no headings, no bullet points.
"""

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = await asyncio.to_thread(model.generate_content, prompt)
        text = (response.text or "").strip()
        return text if text else None
    except Exception as e:
        logger.exception("generate_bias_summary: Gemini call failed: %s", e)
        return None


# ── Bias-analysis recommendations ────────────────────────
async def generate_bias_recommendations(
    report_data: dict,
) -> Optional[List[str]]:
    """4–6 actionable, dataset-specific recommendations as a list[str].
    Each recommendation references a specific finding (group, attribute, proxy
    column, metric value). Returns None on any failure."""
    if not api_key:
        logger.warning("generate_bias_recommendations: GEMINI_API_KEY not set")
        return None

    score = report_data.get("fairnessScore")
    decision = report_data.get("decisionColumn")
    rows = (report_data.get("datasetInfo") or {}).get("totalRows")

    prompt = f"""You are a fairness consultant advising an HR team on concrete next steps after a bias audit.

Dataset: {rows} rows, decision column "{decision}".
Overall fairness score: {score}/100.

Per-attribute findings (Demographic Parity Difference):
{_format_attribute_findings(report_data)}

Hidden proxy columns flagged (correlation with a protected attribute, threshold 0.3):
{_format_proxy_findings(report_data)}

Produce 4 to 6 actionable recommendations as a JSON array of strings. Rules:
- Each recommendation MUST reference a specific finding above (a high-DPD attribute, a flagged proxy, OR a notable group rate). Quote the exact column name, group name, metric type, or numeric value.
- Mix tactical interventions (process changes, blind review, threshold adjustments, monitoring) with strategic ones (data collection, model retraining with constraints, ongoing audits).
- Each recommendation should explain WHY, tied to the evidence — not just WHAT.
- Bad: "Re-examine the gender column."
  Good: "Implement name-blind resume review at the screening stage — Cramér's V of 0.45 between candidate_name and gender suggests names alone leak demographic signal even after the explicit gender column is removed."
- No generic advice ("ensure diversity", "promote inclusion") that doesn't reference this dataset.

Return ONLY a valid JSON array of strings. No markdown fences, no surrounding text. Example shape:
["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4"]
"""

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = await asyncio.to_thread(model.generate_content, prompt)
        text = (response.text or "").strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        recs = json.loads(text)
        if isinstance(recs, list) and all(isinstance(r, str) for r in recs):
            cleaned = [r.strip() for r in recs if r and r.strip()]
            return cleaned or None
        logger.warning(
            "generate_bias_recommendations: unexpected shape: %s", type(recs)
        )
        return None
    except Exception as e:
        logger.exception(
            "generate_bias_recommendations: Gemini call failed: %s", e
        )
        return None
