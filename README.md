<div align="center">

# 🔍 FairScan

### *"Grammarly for AI Fairness"*

**An AI-powered bias detection and audit tool for hiring datasets**

[![Google Solutions Challenge 2026](https://img.shields.io/badge/Google%20Solutions%20Challenge-2026-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/community/gdsc-solution-challenge)
[![GDG × Hack2Skill](https://img.shields.io/badge/GDG%20×%20Hack2Skill-Competition-34A853?style=for-the-badge)](https://hack2skill.com)
[![Version](https://img.shields.io/badge/Version-1.0.0-blueviolet?style=for-the-badge)](https://github.com/Singhmedhansh/GDG_SolutionChallenge)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Problem Statement:** Unbiased AI Decision — Ensuring Fairness and Detecting Bias in Automated Systems

[🚀 Try FairScan](#-getting-started) · [📖 API Docs](#-api-reference) · [🎯 Demo Dataset](#-test-dataset)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [UN SDG Alignment](#-un-sdg-alignment)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Application Pages](#-application-pages)
- [Backend Architecture](#-backend-architecture)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Test Dataset](#-test-dataset)
- [Team](#-team)

---

## 🌟 Overview

**FairScan** is a full-stack AI fairness auditing platform built for the **Google Solutions Challenge 2026**. It scans hiring datasets for hidden discrimination across protected attributes like **gender**, **age**, and **race** — before automated AI decisions impact real people.

FairScan acts as an early-warning system for HR teams, data scientists, and compliance officers who need to validate their datasets before feeding them into ML pipelines.

### Core Value Proposition

| Capability | Description |
|---|---|
| 🔎 **Bias Detection** | Detects demographic parity gaps across protected groups |
| 🕵️ **Proxy Column Discovery** | Identifies neutral-looking columns that secretly encode protected attributes |
| 🤖 **AI-Powered Reports** | Generates plain-English fairness summaries with actionable recommendations via Gemini |
| 📊 **Explainability** | Shows which features most influence biased outcomes |
| ✍️ **Job Posting Scanner** | Scans and rewrites job descriptions to remove discriminatory language |
| ⚖️ **Debiasing Engine** | Applies fairness constraints (Demographic Parity, Equalized Odds) to ML models |

---

## 🌍 UN SDG Alignment

FairScan directly addresses three United Nations Sustainable Development Goals:

| SDG | Goal | FairScan's Contribution |
|---|---|---|
| ⚙️ **SDG 8** | Decent Work & Economic Growth | Ensures fair hiring practices by removing algorithmic discrimination |
| 🤝 **SDG 10** | Reduced Inequalities | Actively detects and mitigates discrimination across protected groups |
| ⚖️ **SDG 16** | Peace, Justice & Strong Institutions | Creates accountable, transparent, and explainable automated decision systems |

---

## ✨ Key Features

### 1. Dataset Bias Scanner (`/analyze` → `/report`)
- Upload any CSV hiring dataset via **drag-and-drop**
- Select your decision column (e.g., `hired`) and protected attributes (e.g., `gender`, `age`)
- Receive a complete audit report including:
  - **Fairness Score** (0–100)
  - **Demographic Parity Difference** per attribute
  - **Group approval rates** with visual breakdowns
  - **Proxy column detection** (columns correlated with protected attributes)
  - **Top influencing features** per bias dimension
  - **AI-generated summary and recommendations** via Google Gemini

### 2. Job Posting Bias Scanner (`/jobposting`)
- Paste any job description
- Gemini scans for: Gender Bias, Age Bias, Accessibility issues, Cultural Bias, Socioeconomic Bias
- Each flag shows severity, the biased phrase, and an explanation
- Gemini automatically **rewrites the job posting** with inclusive language

### 3. Model Debiasing Engine (`/debias`)
- Upload a trained ML model (base64-encoded)
- Choose a fairness constraint:
  - **Demographic Parity** — equalize positive prediction rates
  - **Equalized Odds** — equalize true/false positive rates
  - **Fairness Penalty** — penalize unfair predictions during training
- Receive a debiased model + before/after fairness score comparison

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI Framework |
| Vite | 8 | Build Tool & Dev Server |
| Framer Motion | 12 | Page transitions & animations |
| react-router-dom | 6.8.0 | Client-side routing |
| react-dropzone | 14 | Drag-and-drop file upload |
| PapaParse | 5 | CSV parsing in the browser |
| @tanstack/react-table | 8 | Data preview table |
| react-select | 5.8.0 | Multi-select dropdowns |
| react-circular-progressbar | 2 | Fairness score gauge |
| react-hot-toast | 2 | Toast notifications |
| lucide-react | latest | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Runtime |
| FastAPI | latest | REST API Framework |
| Uvicorn | latest | ASGI Server |
| pandas | latest | Data manipulation & bias calculation |
| scikit-learn | latest | Feature correlation & ML model support |
| google-generativeai | latest | Gemini API integration |
| python-dotenv | latest | Environment variable management |
| fairlearn | latest | Post-processing fairness constraints |

### AI / ML
| Technology | Purpose |
|---|---|
| Google Gemini 1.5 Flash | AI-powered analysis, explanations, and job rewriting |
| Demographic Parity Difference | Core fairness metric |
| Pearson Correlation | Proxy column detection |
| Feature Influence Score | Explainability (corr × corr product) |

---

## 📁 Project Structure

```
fairscan/                          ← Project Root (Frontend)
├── public/
│   └── demo_hiring.csv            ← Sample test dataset
├── src/
│   ├── components/
│   │   └── Navbar.jsx             ← Frosted glass sticky navigation bar
│   ├── context/
│   │   └── ResultsContext.jsx     ← Passes real API results to ReportPage
│   ├── data/
│   │   └── mockResults.js         ← Fallback mock data for demo mode
│   ├── pages/
│   │   ├── LandingPage.jsx        ← Hero, How It Works, Trust Bar
│   │   ├── AnalysisPage.jsx       ← 3-step wizard: Upload → Configure → Scan
│   │   ├── ReportPage.jsx         ← Full audit report with AI insights
│   │   ├── JobPostingPage.jsx     ← Job description bias scanner & rewriter
│   │   ├── DebiasPage.jsx         ← Model debiasing interface
│   │   └── AboutPage.jsx          ← Team, SDG alignment, tech stack
│   ├── services/
│   │   └── api.js                 ← Fetch calls to FastAPI backend
│   └── App.jsx                    ← BrowserRouter + AnimatedRoutes + ResultsProvider
├── index.html
├── package.json
└── vite.config.js

fairscan/backend/                  ← Backend (FastAPI)
├── main.py                        ← FastAPI app entry point + CORS config
├── requirements.txt               ← Python dependencies
├── .env                           ← GEMINI_API_KEY (never commit!)
├── routes/
│   └── analyze.py                 ← All API endpoints
└── services/
    ├── gemini.py                  ← Gemini AI integration (scan + rewrite)
    └── debiasing.py               ← Fairlearn-based model debiasing
```

---

## 📱 Application Pages

### 🏠 Landing Page (`/`)
The marketing entry point for FairScan. Features an animated hero section with scrolling statistics, a "How It Works" 3-step explainer, and a technology trust bar. Built with Framer Motion stagger animations and custom `StatPill` counter components.

**Key CTAs:**
- **Upload Dataset** → navigates to `/analyze`
- **View Demo Report** → navigates to `/report` with mock data

---

### 📤 Analysis Page (`/analyze`)
A 3-step wizard for dataset upload and scan configuration.

**Step 1 — Upload File:**
- Drag-and-drop CSV upload (react-dropzone) with 3 visual states
- Client-side CSV parsing with PapaParse
- Instant file metadata display (name, size, row count)

**Step 2 — Configure:**
- Live preview of the first 5 CSV rows (@tanstack/react-table)
- Decision column selector (e.g., `hired`)
- Multi-select for protected attributes (e.g., `gender`, `age`)

**Step 3 — Run Scan:**
- Summary card with all selected options
- Sends base64-encoded CSV to backend via `POST /api/analyze`
- Results stored in `ResultsContext` → auto-navigates to `/report`

---

### 📊 Report Page (`/report`)
The full bias audit dashboard, displayed after a successful scan.

**Sections:**
1. **Summary Row** — Fairness Score gauge, Protected Attributes count, Proxy Columns flagged
2. **Gemini AI Summary** — Plain-English analysis banner
3. **Bias Breakdown** — Per-attribute cards with:
   - Bias status badge (Bias Detected / Fair)
   - Custom SVG approval rate bars per demographic group
   - Top contributing features table
   - Group breakdown table (Total / Approved / Rejected / Rate)
4. **Flagged Proxy Columns** — Column names and explanations
5. **Recommendations** — Numbered, lightbulb-annotated action items
6. **Footer Actions** — Download JSON report / Analyze another dataset

---

### ✍️ Job Posting Page (`/jobposting`)
Paste any job description and Gemini will:
1. Identify bias signals (type, severity, example phrase, explanation)
2. Display an overall risk level (High / Medium / Low)
3. Provide actionable suggestions for improvement
4. Auto-generate a **fully rewritten, inclusive version** of the posting

---

### ⚖️ Debias Page (`/debias`)
Upload a trained ML model and dataset, choose a fairness constraint, and receive a debiased model with before/after fairness score comparison.

**Supported Constraints:**
- `demographic_parity` — Equalize positive prediction rates across groups
- `equalized_odds` — Equalize true positive and false positive rates
- `fairness_penalty` — Apply penalty weight during model retraining

---

### ℹ️ About Page (`/about`)
Displays the problem statement, UN SDG alignment, full tech stack, and team card profiles.

---

## 🔧 Backend Architecture

### Bias Calculation Pipeline

```
CSV Upload (base64)
        ↓
  Decode → DataFrame
        ↓
  Normalize decision column
  (yes/1/true/hired/approved/accepted → 1)
        ↓
  Per-attribute: compute Demographic Parity Difference (DPD)
  DPD = (max_approval_rate - min_approval_rate) / 100
        ↓
  Severity thresholds:
  DPD > 0.30 → high
  DPD > 0.15 → medium
  DPD > 0.10 → low
  DPD ≤ 0.10 → none
        ↓
  Proxy column detection via Pearson correlation (threshold > 0.3)
        ↓
  Overall fairness score = 100 - avg_penalty
  (penalty = DPD × 100, capped at 40 per attribute)
        ↓
  Gemini enrichment: summaries, explanations, recommendations
        ↓
  JSON response
```

### Explainability Layer
- **Feature Influence Score** = `corr(feature, protected_attr) × corr(feature, decision)`
- Top 3 features per attribute are surfaced in the report
- **Group Statistics**: per-group counts (Total / Approved / Rejected / Rate)

### CORS Configuration
- Frontend: `http://localhost:5173` and `http://localhost:5174`
- Backend: `http://localhost:8000`

---

## 📡 API Reference

### `POST /api/analyze`
Scans a CSV dataset for hiring bias.

**Request:**
```json
{
  "fileName": "hiring_data.csv",
  "csvData": "<base64-encoded CSV string>",
  "decisionColumn": "hired",
  "protectedAttributes": ["gender", "age"]
}
```

**Response:**
```json
{
  "fairnessScore": 42.0,
  "status": "biased",
  "decisionColumn": "hired",
  "datasetInfo": {
    "fileName": "hiring_data.csv",
    "totalRows": 1200,
    "totalColumns": 8,
    "scannedAt": "2026-04-18T10:00:00Z"
  },
  "protectedAttributes": [
    {
      "attribute": "gender",
      "groupStats": [
        { "group": "Male", "approvalRate": 78.0 },
        { "group": "Female", "approvalRate": 41.0 }
      ],
      "biasDetected": true,
      "metric": "Demographic Parity Difference: 0.37",
      "severity": "high"
    }
  ],
  "flaggedProxies": ["zipcode", "university_tier"],
  "recommendations": ["Re-examine the 'gender' column..."]
}
```

---

### `POST /api/scan-job-posting`
Scans a job description for biased language and returns a rewritten version.

**Request:**
```json
{
  "job_description": "We are looking for a young, energetic developer..."
}
```

**Response:**
```json
{
  "bias_flags": [
    {
      "type": "Age Bias",
      "severity": "high",
      "example": "young, energetic",
      "explanation": "Implies age preference, discouraging older applicants"
    }
  ],
  "overall_risk": "high",
  "suggestions": ["Replace age-coded language with skill-based criteria"],
  "rewritten_job": "We are looking for a motivated, passionate developer..."
}
```

---

### `POST /api/debias-model`
Applies a fairness constraint to a trained ML model.

**Request:**
```json
{
  "model_file": "<base64-encoded model>",
  "dataset_csv": "<base64-encoded CSV>",
  "protected_attributes": ["gender"],
  "fairness_metric": "demographic_parity",
  "penalty_weight": 0.5
}
```

**Response:**
```json
{
  "original_fairness_score": 42.0,
  "debiased_fairness_score": 74.0,
  "improvement_percent": 76.2,
  "debiased_model": "<base64-encoded debiased model>",
  "explanation": "Successfully applied demographic_parity constraint. Improved score by 76.2%."
}
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Python** 3.10+
- A **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

---

### 1. Clone the Repository
```bash
git clone https://github.com/Singhmedhansh/GDG_SolutionChallenge.git
cd GDG_SolutionChallenge
```

---

### 2. Start the Backend

```powershell
# Navigate to the backend directory
cd fairscan/backend

# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install google-generativeai python-dotenv fairlearn
```

Create a `.env` file in `fairscan/backend/`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the server:
```powershell
uvicorn main:app --reload
# Backend runs at: http://localhost:8000
# API Docs at: http://localhost:8000/docs
```

---

### 3. Start the Frontend

```powershell
# Navigate to root project directory
cd d:\fairscan   # or wherever you cloned the repo

# Install dependencies (always use --legacy-peer-deps)
npm install --legacy-peer-deps

# Start the dev server
npm run dev
# Frontend runs at: http://localhost:5173
```

---

### 4. Open FairScan
Visit **http://localhost:5173** in your browser. Both the frontend and the backend must be running simultaneously.

---

## 🧪 Test Dataset

A demo dataset is included at `public/demo_hiring.csv`.

**Recommended configuration:**
| Setting | Value |
|---|---|
| Decision Column | `hired` |
| Protected Attributes | `gender`, `age` |

**Expected results:**
| Metric | Value |
|---|---|
| Overall Fairness Score | ~42 / 100 |
| Gender Bias | Male: 78% approval vs Female: 41% approval |
| Age Bias | Under-35: 74% approval vs Over-35: 52% approval |
| Proxy Columns Flagged | `zipcode`, `university_tier` |

---

## ⚠️ Important Notes

- **Never commit `.env`** — it contains your Gemini API key. It is listed in `.gitignore`.
- **Always use `--legacy-peer-deps`** for all `npm install` commands (React 19 peer dependency requirement).
- **Recharts is not used** — replaced with custom SVG progress bars due to a React 19 conflict.
- **react-select is pinned to `5.8.0`** — do not upgrade without testing.
- All git commands must be run from the **project root**, not from within the `backend/` subfolder.

---

## 👥 Team

| Name | GitHub | Role |
|---|---|---|
| **Medhansh Singh** | [@Singhmedhansh](https://github.com/Singhmedhansh) | Frontend Engineer |
| **Tanmay Angarkar** | [@angarkartanmay-ops](https://github.com/angarkartanmay-ops) | Backend Engineer |

---

## 📄 License

This project is submitted as part of the **Google Solutions Challenge 2026** (GDG × Hack2Skill).  
Problem Statement: *Unbiased AI Decision — Ensuring Fairness and Detecting Bias in Automated Systems.*

---

<div align="center">
  <sub>Built with ❤️ for a fairer world · Google Solutions Challenge 2026</sub>
</div>
