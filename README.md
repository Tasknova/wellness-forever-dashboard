# Wellness Forever — AI Intelligence Hub

A complete showcase of Tasknova's 4-layer intelligence architecture applied to Wellness Forever, India's 300+ store pharmacy chain. Two components: a live-feeling intelligence dashboard and a synthetic knowledge base that turns Claude into a domain-expert AI brain.

## What's Inside

| File | What It Is |
|------|-----------|
| `wf-intelligence-dashboard.html` | Multi-layer intelligence dashboard — open in any browser |
| `wf-synthetic-brain.md` | ~1,900-line knowledge base for Claude Q&A |
| `README.md` | This file |

## Quick Start

### 1. View the Dashboard

Open `wf-intelligence-dashboard.html` in any modern browser. No server needed — it's a single self-contained HTML file with no external dependencies (except Google Fonts, which degrade gracefully).

### 2. Talk to the AI Brain

The synthetic brain turns Claude into a Tasknova AI with deep institutional memory of Wellness Forever. To use it:

**Option A — Claude.ai (Web/App)**
1. Go to [claude.ai](https://claude.ai)
2. Start a new conversation
3. Attach `wf-synthetic-brain.md` as a file
4. Ask questions naturally — the AI will respond as the Tasknova intelligence system

**Option B — Claude Code (CLI)**
```bash
cat wf-synthetic-brain.md | claude "What's our situation with Cipla?"
```

**Option C — Claude API**
```python
import anthropic

client = anthropic.Anthropic()

with open("wf-synthetic-brain.md") as f:
    brain = f.read()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": f"{brain}\n\n---\n\nQuestion: What's our biggest vendor risk right now?"
    }]
)
print(response.content[0].text)
```

### 3. Example Questions to Ask the Brain

**Vendor Intelligence**
- "What's our situation with Cipla going into FY27 negotiations?"
- "Which vendor is our biggest risk and why?"
- "Compare Cipla vs Sun Pharma — who's the better partner?"
- "What leverage do we have in the Cipla FY27 negotiation?"

**Account Health**
- "How's the Fortis relationship? What should I do this week?"
- "What's the TCS opportunity worth and how do we capture it?"
- "Which accounts are at churn risk?"

**Operations**
- "Are we ready for monsoon season?"
- "Why do we keep running out of antibiotics?"
- "Which stores should we close?"

**Strategy**
- "What are the top 3 things that move the needle for IPO readiness?"
- "How do we fight MedPlus in Pune?"
- "Where's our biggest revenue leakage?"
- "Summarize our vendor strategy in one paragraph"

**Cross-Layer (the impressive ones)**
- "Connect the dots between Mankind's reliability issues and our TCS account"
- "If Cipla's Patalganga plant goes down during monsoon, what happens?"
- "What's the relationship between our vendor consolidation plan and IPO margins?"

## Dashboard Sections

1. **Intelligence Architecture** — 4-layer system diagram with cross-layer flow
2. **Account Memory** — Apollo, Fortis, LifeCare, TCS with churn risk and interaction timelines
3. **Vendor Memory** — 6-vendor scorecard table + detailed Cipla/Sun Pharma profiles
4. **Cross-Layer Insights** — 3 signal chains showing trigger → evidence → action → impact
5. **Revenue Intelligence** — 7-layer leakage framework with waterfall chart (₹162.9Cr total)
6. **Demand Intelligence** — Seasonal patterns, co-purchase data, anomaly alerts
7. **AI Brain Showcase** — Memory network visualization, neural scan bars, terminal-style chat demo
8. **Intervention Engine** — 7 ranked actions with predicted ROI and urgency
9. **CTA** — Data requirements and activation prompt

## Technical Details

- **Dashboard:** Pure HTML/CSS, no JavaScript frameworks. Google Fonts (Inter). Responsive at 768px.
- **Brain:** Structured markdown (~1,900 lines). All data synthetic but calibrated to real company scale (INR 847Cr revenue), real vendor names (Cipla, Sun Pharma, Dr. Reddy's), real drug names (Azithromycin, Metformin, Atorvastatin).
- **Design system:** Navy/blue/green/red/amber palette. CSS variables, sticky nav, fade-up animations, dark-mode AI brain section.

## Key Data Points (All Synthetic)

| Metric | Value |
|--------|-------|
| WF Revenue (FY26E) | INR 847 Cr |
| Stores | 312 |
| Top Vendor (Cipla) | INR 53.4 Cr, Score 8.24/10 |
| Worst Vendor (Mankind) | INR 10.9 Cr, Score 6.74/10, Under Review |
| Highest Risk Account | Fortis Healthcare, 41% churn risk |
| Best Growth Account | TCS Corporate, 9.2/10 satisfaction |
| Total Revenue Leakage | INR 162.9 Cr (19.22%) |
| Stockout Rate | 4.2% (target <3%) |

---

Built by **Tasknova Insight Framework** — April 2026

---

## RAG Backend (Supabase + Gemini + Groq)

This repo now includes a backend API for retrieval-augmented Q&A over `wf-synthetic-brain.md`.

### Stack

- **Embeddings:** Gemini `text-embedding-004`
- **LLM:** Groq `llama-3.3-70b-versatile`
- **Vector DB:** Supabase Postgres + `pgvector`

### Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill all placeholders.

3. Apply the SQL migration in `supabase/migrations/20260427_create_wf_rag.sql` to your Supabase project.

4. Start the backend:

```bash
npm run dev
```

### API Endpoints

- `GET /health`
    - Service status and configured model names

- `POST /ingest`
    - Ingests/chunks/embeds `wf-synthetic-brain.md`
    - Body (optional): `{ "forceReindex": true }`

- `POST /ask`
    - Answers questions using retrieval + Groq generation
    - Body: `{ "question": "What's our biggest vendor risk?" }`

### Notes

- If `APP_API_KEY` is set in `.env`, requests must include `x-api-key`.
- Service uses `SUPABASE_SERVICE_ROLE_KEY` for ingestion and retrieval RPC calls.
- Retrieval relies on SQL function `match_wf_brain_chunks` created by the migration.
