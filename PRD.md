# FairScan — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Last Updated:** 2026-04-18  
> **Competition:** Google Solutions Challenge 2026 (GDG × Hack2Skill)  
> **Problem Statement:** "Unbiased AI Decision" — Ensuring Fairness and Detecting Bias in Automated Systems  
> **Tagline:** *"Grammarly for AI Fairness"*  
> **GitHub:** https://github.com/Singhmedhansh/fairscan

---

## 1. Product Overview

FairScan is an AI-powered bias detection and audit tool for hiring datasets. It scans CSV datasets for hidden discrimination — across protected attributes like gender, age, and race — before automated AI decisions impact real people.

### 1.1 Core Value Proposition
- Detects **demographic parity gaps** in hiring outcomes across protected groups
- Identifies **proxy columns** that appear neutral but encode protected attributes
- Generates a **plain-English AI-powered fairness report** with actionable recommendations
- Provides **explainability** — showing which features most influence biased outcomes

### 1.2 Who Uses It
| User | Use Case |
|------|----------|
| HR Teams | Audit existing hiring datasets before deploying ML models |
| Data Scientists | Validate training data for fairness compliance |
| Compliance Officers | Demonstrate due diligence on equitable AI |
| Researchers | Analyze bias trends in labor market datasets |

---

## 2. Team & Development Schedule

| Engineer | Role | Days |
|----------|------|------|
| Medhansh Singh (`Singhmedhansh`) | Frontend Engineer | Days 1–5, Day 10 polish |
| Tanmay Angarkar (`angarkartanmay-ops`) | Backend Engineer | Days 6–10 |
| Teammate 3 | ML/Explainability | Days 11–15 (pending) |

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Framer Motion |
| Backend | Python FastAPI |
| AI | Google Gemini API (`gemini-1.5-flash`) |
| Analysis | pandas + scikit-learn |
| Styling | Inline styles (no Tailwind on components) |
| Routing | react-router-dom v6 |
| Icons | lucide-react |
| CSV Parsing | PapaParse |
| Table | @tanstack/react-table |
| Dropzone | react-dropzone |
| Dropdowns | react-select@5.8.0 |
| Notifications | react-hot-toast |
| Progress | react-circular-progressbar |
| Charts | Custom SVG bars (Recharts replaced due to React 19 conflict) |

### 3.1 Critical Dependency Rules
- Always use `--legacy-peer-deps` for npm installs
- react-select pinned to `5.8.0`
- Recharts is **NOT** used for charts (React 19 conflict) — use custom SVG progress bars
- react-countup replaced with custom `StatPill` hook

---

## 4. Design System

### 4.1 Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#f8fafc` | Page background |
| Card | `#ffffff` | Card backgrounds |
| Border | `#e2e8f0` | Card/input borders |
| Primary | `#2563eb` | Buttons, links, accents |
| Primary BG | `#eff6ff` | Badge backgrounds |
| Primary Border | `#bfdbfe` | Badge borders |
| Danger | `#ef4444` | High bias, errors |
| Warning | `#f59e0b` | Medium bias, amber alerts |
| Success | `#10b981` | No bias, success states |
| Text Heading | `#0f172a` | h1, h2, body |
| Text Muted | `#64748b` | Descriptions, labels |

### 4.2 Typography
- **Body/Headings:** `Inter` (Google Fonts) — weights 400, 500, 600, 700, 800
- **Labels/Badges/Code:** `IBM Plex Mono` (Google Fonts) — weights 400, 600

### 4.3 Navbar
- Frosted glass: `backdrop-filter: blur(12px)`, `background: rgba(255,255,255,0.75)`
- Sticky, height ~60px
- IBM Plex Mono font

### 4.4 Cards
- `border: 1px solid #e2e8f0`, `border-radius: 12px`
- `box-shadow: 0 1px 2px rgba(15,23,42,0.04)`

---

## 5. Application Pages

### 5.1 Landing Page (`/`)
**Purpose:** Marketing/hero page that converts visitors to users

**Sections:**
1. **Hero** — Animated badge, headline ("Detect Hidden Bias. / Build Fairer AI."), subheading, CTA buttons (Upload Dataset → `/analyze`, View Demo Report → `/report`), stat pills, scroll hint
2. **How It Works** — 3 cards: Upload Dataset / Detect Bias / Fix & Export with hover lift effects
3. **Trust Bar** — Technology stack display
4. **Footer** — Competition attribution

**Key Components:**
- `StatPill` — custom counter animation (no library), counts up on mount
- All sections use Framer Motion `useInView` stagger animations
- `react-hot-toast` notification before navigating to `/analyze`

---

### 5.2 Analysis Page (`/analyze`)
**Purpose:** 3-step wizard for CSV upload and scan configuration

**Step 1 — Upload File:**
- `react-dropzone` drag-and-drop zone with 3 visual states: default / drag-active / uploaded
- PapaParse for CSV parsing
- File name + size display, remove button, success badge

**Step 2 — Configure:**
- `@tanstack/react-table` preview of first 5 CSV rows
- `react-select` dropdown for decision column selection
- `react-select` multi-select for protected attributes
- Summary badge showing selected options

**Step 3 — Run Scan:**
- Summary card showing file name, row count, decision column, protected attributes
- Animated "Run Bias Scan" button with spinner
- **Real API call** via `fetch()` POST to `/api/analyze` with base64-encoded CSV
- Results stored in `ResultsContext` before navigating to `/report`

**Error Handling:**
- Toast errors for missing decision column, empty CSV, backend errors
- Backend validates decision column has recognizable binary values

---

### 5.3 Report Page (`/report`)
**Purpose:** Full bias audit report with AI-generated insights

**Sections:**
1. **Header** — Breadcrumb, title, dataset info, Download JSON button
2. **Summary Row** (3 cards):
   - Fairness Score with `react-circular-progressbar` (red <50, amber <75, green ≥75)
   - Protected Attributes count + attribute tags
   - Proxy Columns flagged count + proxy tags
3. **Gemini AI Summary Banner** — Amber card with AI-generated plain English summary
4. **Bias Breakdown** — Per-attribute cards with:
   - Bias status badge (Bias Detected / Fair)
   - Plain English Gemini explanation
   - Custom SVG progress bars showing group approval rates
   - Top Contributing Factors table
   - Group Breakdown table (Group / Total / Approved / Rejected / Rate)
5. **Flagged Proxy Columns** — List of proxy columns with explanations
6. **Recommendations** — Numbered + lightbulb icon list from Gemini
7. **Footer Actions** — Analyze Another Dataset / Download Report buttons

**Data Source Priority:**
1. `ResultsContext` (real API data)
2. `mockResults.js` (fallback)

---

### 5.4 About Page (`/about`)
**Purpose:** Information about the project and team

**Sections:**
- Problem statement explanation
- UN SDG alignment (SDG 8 — Decent Work, SDG 10 — Reduced Inequalities, SDG 16 — Peace/Justice/Institutions)
- Tech stack grid
- Team cards (3 members)
- CTA to try FairScan

---

## 6. Backend Architecture

### 6.1 API Endpoint

**`POST /api/analyze`**

**Request:**
```json
{
  "fileName": "hiring_data.csv",
  "csvData": "<base64 encoded CSV string>",
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
    "fileName": "...",
    "totalRows": 1200,
    "totalColumns": 8,
    "scannedAt": "2026-04-18T10:00:00Z"
  },
  "protectedAttributes": [
    {
      "attribute": "gender",
      "groupStats": [
        { "group": "Male", "approvalRate": 78 },
        { "group": "Female", "approvalRate": 41 }
      ],
      "biasDetected": true,
      "metric": "Demographic Parity Difference: 0.37",
      "severity": "high",
      "topInfluencingFactors": [...],
      "groupDetails": [...]
    }
  ],
  "flaggedProxies": ["zipcode", "university_tier"],
  "recommendations": ["..."],
  "attributeExplanations": { "gender": "..." },
  "overallSummary": "..."
}
```

### 6.2 Bias Calculation Logic
1. Decode base64 CSV → pandas DataFrame
2. Normalize decision column to binary (`yes/1/true/hired/approved/accepted` = positive)
3. Calculate **Demographic Parity Difference (DPD)** per protected attribute
4. DPD thresholds:
   - `> 0.3` → high severity
   - `> 0.15` → medium severity
   - `> 0.1` → low severity
   - `≤ 0.1` → none
5. Detect proxy columns via correlation (threshold > 0.3)
6. Overall fairness score = `100 - avg penalty` (penalty = `DPD × 100`, max 40)
7. Pre-validate decision column has recognizable binary values

### 6.3 Gemini Integration
- Model: `gemini-1.5-flash`
- Input: Full bias context as structured prompt
- Output JSON fields: `recommendations`, `attributeExplanations`, `overallSummary`
- Fallback: Static defaults if Gemini API fails

### 6.4 Explainability Layer
- `compute_feature_influence()` — top 3 features driving bias per attribute
  - Influence score = `corr(feature, protected_attr) × corr(feature, decision)`
- `compute_group_statistics()` — detailed counts per group (total/approved/rejected/rate)

### 6.5 File Structure
```
backend/
├── main.py              ← FastAPI app + CORS config
├── requirements.txt
├── .env                 ← GEMINI_API_KEY (never commit)
├── .gitignore
├── routes/
│   └── analyze.py       ← /api/analyze POST endpoint
└── services/
    ├── gemini.py        ← Gemini API integration
    └── explainability.py ← Feature influence + group stats
```

---

## 7. Frontend File Structure

```
fairscan/                ← Project root
├── public/
│   └── demo_hiring.csv  ← Test dataset
├── src/
│   ├── components/
│   │   └── Navbar.jsx   ← Frosted glass sticky navbar
│   ├── context/
│   │   └── ResultsContext.jsx ← Passes real API results to ReportPage
│   ├── data/
│   │   └── mockResults.js    ← Fallback mock data
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── AnalysisPage.jsx
│   │   ├── ReportPage.jsx
│   │   └── AboutPage.jsx
│   ├── services/
│   │   └── api.js       ← fetch() call to FastAPI
│   └── App.jsx          ← BrowserRouter + AnimatedRoutes + ResultsProvider
├── index.html
├── index.css
├── package.json
└── vite.config.js
```

---

## 8. Running the Project

### Frontend
```powershell
cd d:\fairscan
npm install --legacy-peer-deps
npm run dev
# Runs on localhost:5173
```

### Backend
```powershell
cd D:\GdG_chlg\backend   # or C:\Users\singh\Downloads\fairscan\backend
.\venv\Scripts\activate
uvicorn main:app --reload
# Runs on localhost:8000
```

### Environment Variables (backend `.env`)
```
GEMINI_API_KEY=your_gemini_key_here
```

---

## 9. Test Dataset

File: `public/demo_hiring.csv`

**Recommended selections:**
- Decision column: `hired`
- Protected attributes: `gender`, `age`

**Expected results:**
- Fairness score: ~42/100
- Gender bias: 78% male approval vs 41% female approval
- Age bias: 74% under-35 approval vs 52% over-35 approval
- Flagged proxies: `zipcode`, `university_tier`

---

## 10. Known Bugs & Fixes

| Bug | Cause | Fix |
|-----|-------|-----|
| Blank screen on startup | `import "./App.css"` after file deleted | Remove the import |
| `touch` / `mkdir -p` not working | Windows PowerShell uses different commands | Use `New-Item` and `mkdir` |
| Invalid hook call (react-router-dom) | Mismatched React versions | `npm install react-router-dom@6.8.0` |
| Recharts bar charts not rendering | React 19 + Framer Motion context conflict | Replace with custom SVG progress bars |
| react-select blank screen | React 19 peer dependency conflict | `npm install react-select@5.8.0 --legacy-peer-deps` |
| CountUp "got: object" error | JSX stored outside component | Replace with custom `StatPill` using `useEffect` counter |
| Steps array icons not rendering | JSX elements outside component scope | Move steps array inside component function |
| `npm install ERESOLVE` error | react-select@5.8.0 needs React 16-18 | `npm install --legacy-peer-deps` |
| Backend venv path conflict | venv pointed to different machine path | Delete venv, recreate with `python -m venv venv` |
| "Missing script: dev" error | Running npm from wrong folder | `cd` into inner fairscan folder first |
| Wrong bias results (0% everywhere) | Wrong decision column selected | Added backend validation + clear error message |
| Git 403 permission denied | Collaborator not added | Add `angarkartanmay-ops` as collaborator on GitHub |
| Git "not a repository" error | Running git commands from backend subfolder | Navigate to project root first |

---

## 11. Dev Workflow Rules

1. **Never commit `.env`** — contains Gemini API key
2. **Always use `--legacy-peer-deps`** for all npm installs
3. **Recharts is banned** — use custom SVG bars only
4. **react-select pinned to `5.8.0`**
5. **Steps array with JSX icons must always be inside the component function** (not at module level)
6. **All git commands must run from project root**, not backend subfolder
7. CORS is configured in FastAPI — frontend at `localhost:5173`, backend at `localhost:8000`

---

## 12. Submission Checklist

| Item | Status |
|------|--------|
| GitHub repo (public) | ✅ github.com/Singhmedhansh/fairscan |
| Live prototype | Run locally |
| Problem statement | Unbiased AI Decision |
| Solution overview | FairScan bias auditing tool |
| Demo video | ⏳ Pending |
| Project deck | ⏳ Pending |
| README | ✅ Complete |

---

## 13. UN SDG Alignment

| SDG | Relevance |
|-----|-----------|
| SDG 8 — Decent Work & Economic Growth | Fair hiring practices |
| SDG 10 — Reduced Inequalities | Detect discrimination across protected groups |
| SDG 16 — Peace, Justice & Strong Institutions | Accountable automated decision systems |

---

## 14. Pending Work (Days 11–15)

- [ ] Teammate 3: ML explainability improvements
- [ ] Demo video recording
- [ ] 5-slide project deck
- [ ] Official hackathon submission on Devfolio/Hack2Skill
