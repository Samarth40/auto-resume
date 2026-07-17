# ResumeAI — Smart ATS Resume Optimizer

An AI-powered web app that optimizes a **predefined master LaTeX resume** against any Job Description — then regenerates and compiles the resume as a fresh PDF.

> **The user never uploads a resume.** The master resume lives at `/templates/resume.tex` and is the single source of truth. The AI may only **rewrite, reorder, and rephrase** existing content — it can **never invent** skills, projects, companies, or achievements. *Truthfulness > ATS score.*

---

## Features

- **ATS Match Score** — animated circular gauge, before/after comparison
- **Keyword analysis** — matched & missing keywords vs the JD
- **Skills Coverage** — % of required/preferred/language/framework demands covered
- **Section-wise ATS Score** — summary / skills / experience / projects / achievements
- **Project Relevance Score** — each project ranked against the role
- **Skill Gap Analysis** — missing skills ranked critical → nice-to-have, with honest suggestions
- **Keyword Heatmap** — keyword × section frequency grid
- **AI Suggestions** & **Changes Made** — every edit with before/after + reasoning
- **Compare view** — original vs optimized LaTeX with modified lines highlighted
- **PDF Preview** + **Download PDF / TEX**
- **Version History** — every optimization run saved on the server
- **Dark mode**, responsive UI, Framer Motion animations, toast notifications

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · Vite · Tailwind CSS · shadcn-style components · Framer Motion · sonner |
| Backend | Node.js · Express |
| AI | OpenAI API (model configurable, default `gpt-5.5`) with a **deterministic mock mode** when no key is set |
| PDF | `pdflatex` (MiKTeX / TeX Live) |

## Project Structure

```
auto_resume/
├── templates/
│   └── resume.tex              # master resume — source of truth (never modified)
├── generated/
│   ├── optimized_resume.tex    # spliced output
│   ├── optimized_resume.pdf    # compiled output
│   └── versions/               # version history
├── server/
│   ├── index.js                # Express app
│   ├── config.js               # env + paths
│   ├── routes/api.js           # /analyze /optimize /download /versions /health
│   ├── parser/
│   │   ├── latexParser.js      # LaTeX → structured sections (index-preserving)
│   │   └── latexModifier.js    # splices optimized content back, formatting untouched
│   ├── services/
│   │   ├── aiService.js        # OpenAI calls + response normalization
│   │   ├── mockAiService.js    # offline deterministic fallback
│   │   ├── pdfCompiler.js      # pdflatex runner (2-pass, timeout, cleanup)
│   │   └── versionStore.js     # version history persistence
│   ├── prompts/                # ALL prompts live here — nothing hardcoded
│   │   ├── analyze.system.txt
│   │   ├── analyze.user.txt
│   │   ├── optimize.system.txt
│   │   └── optimize.user.txt
│   └── utils/                  # promptLoader, extractJson, heatmap
└── client/                     # React app (pages, components, ui kit, hooks, lib)
```

## Getting Started

### Prerequisites

- **Node.js ≥ 18**
- **pdflatex** (optional but recommended) — [MiKTeX](https://miktex.org/download) on Windows, or TeX Live. Without it the app still works and produces the optimized `.tex` (compile it on [Overleaf](https://overleaf.com)).
- **OpenAI API key** (optional) — without one the app runs in **mock mode**: real keyword extraction + conservative rule-based rewrites, fully offline.

### Install & Run

```bash
# 1. install everything
npm install
npm run install:all

# 2. configure the server
cp server/.env.example server/.env
#    → put your OPENAI_API_KEY in server/.env (or leave empty for mock mode)

# 3. run both apps (server :5050 + client :5173)
npm run dev
```

Open **http://localhost:5173**, paste a job description, and click **Analyze** or **Optimize**.

### Environment Variables (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5050` | API port |
| `OPENAI_API_KEY` | *(empty)* | Empty → mock mode |
| `OPENAI_MODEL` | `gpt-5.5` | Any chat-completions model |
| `OPENAI_BASE_URL` | *(empty)* | Optional proxy/Azure/OpenRouter base URL |
| `PDFLATEX_PATH` | `pdflatex` | Full path if not on PATH |
| `PDFLATEX_TIMEOUT_MS` | `60000` | Compile timeout |

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/resume` | Parsed master resume + raw tex |
| `POST` | `/api/analyze` | `{ jobDescription }` → analysis + heatmap |
| `POST` | `/api/optimize` | `{ jobDescription, analysis? }` → optimization, diff sources, PDF status |
| `GET` | `/api/download/pdf` | Download `optimized_resume.pdf` |
| `GET` | `/api/download/tex` | Download `optimized_resume.tex` |
| `GET` | `/api/preview/pdf` | Inline PDF for the preview iframe |
| `GET` | `/api/versions` | Version history |
| `GET` | `/api/versions/:id` | One saved version (tex + result) |
| `GET` | `/api/health` | Mode, model, pdflatex availability |

## How the safety rules are enforced

1. **Prompt level** — system prompts (in `/server/prompts/`) forbid inventing anything; truthfulness explicitly outranks score.
2. **Code level** — `latexModifier.js` only splices into Summary, Skills, Project bullets, and Activity bullets. Education, certifications, contact info, dates, company/project names are **structurally unreachable**.
3. **Skills sanitizer** — optimized skill groups are validated against the original: unknown skills are dropped, dropped originals are re-appended. The AI cannot add or lose a skill.
4. **Formatting** — the modifier performs index-based splices on the original source, so the preamble, fonts, margins, spacing, and commands are byte-for-byte identical.

## What the AI may / may not change

| ✅ May optimize | ❌ Never touches |
|---|---|
| Professional summary | Education |
| Skills ordering & grouping | Dates |
| Project descriptions (bullets) | Company names |
| Achievement wording | Project & certification names |
| Technical keywords & action verbs | CGPA / contact info |

## Replacing the resume

Swap `/templates/resume.tex` with any resume using the same command conventions (`\section`, `\resumeSubheading`, `\resumeProjectHeading`, `\resumeItem`, `\textbf{Category:} skills` lines) and everything keeps working.
