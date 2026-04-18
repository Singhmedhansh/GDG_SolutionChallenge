import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# We use the recommended text generation model
MODEL_NAME = 'gemini-1.5-flash'


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
