# Sploy Project Context: Goals, Vision, and Execution Guide

## 1) Product Vision

Sploy is an AI-powered decision intelligence system for non-technical business teams.

It does not stop at charts or query answers. It should:

- identify what changed,
- explain why it changed (ranked root causes),
- recommend what to do next,
- estimate likely impact,
- and monitor outcomes continuously.

Core promise: **replace dashboard hunting with decision clarity**.

---

## 2) Problem We Are Solving

Teams already have dashboards, but still fail at fast, confident decisions because:

- insights are descriptive but not diagnostic ("what" without "why"),
- analysts are bottlenecks for every non-trivial question,
- data is fragmented across tools and definitions are inconsistent,
- trust is weak due to unclear lineage and quality issues,
- insights rarely convert into operational action.

The project should optimize for **decision velocity and reliability**, not report generation.

---

## 3) Market Signal and Pain Points (Web + Community Research)

### 3.1 Signal from AI analytics tool landscape

Competitor ecosystem is crowded across categories:

- chat-with-data tools,
- NL-to-SQL tools inside cloud platforms,
- BI copilots/search analytics,
- notebook-first analyst tools.

Observed gap across many tools: strong query/visual capability, weaker autonomous diagnosis and action orchestration.

### 3.2 Signal from Reddit analytics discussions

From the referenced thread and discussion context (`old.reddit` mirror of `r/analytics` post `1rcbz3f`), recurring pain points include:

1. **Tool fragmentation**
   - Teams still jump across Excel, AI chat, BI, and collaboration tools.
   - Workflow handoffs cause context loss and repeated manual work.

2. **"Dashboard ≠ answer"**
   - Users repeatedly ask for interpretation and root-cause support, not just visual output.

3. **Data volume and stack mismatch**
   - For larger datasets (example: scanner/retail datasets), users still need warehouse-first workflows.
   - Spreadsheet-centric tools break down at scale.

4. **Weak semantics/accuracy concerns**
   - Community comments explicitly call out metric inconsistency and need for better semantic layers.

5. **Post-dashboard operational gap**
   - Teams still return to Excel/manual prep even after building dashboards.
   - "Insight to action" remains under-solved.

6. **Need for explainable reasoning**
   - Users value step-by-step logic and transparent query reasoning to build trust.

---

## 4) Positioning (How We Should Describe Sploy)

Do not position as:

- "another BI dashboard,"
- "chat with your CSV,"
- or generic "AI data analyst."

Position as:

**AI decision engine for business teams.**

Messaging frame:

- "Find what is going wrong, why it is happening, and what to do next."
- "From metric change to recommended action in minutes."

---

## 5) Ideal Customer Profile (ICP) and Initial Wedge

### 5.1 ICP

- SMBs and growth-stage companies,
- operations, product, marketing, finance teams,
- limited dedicated analytics bandwidth,
- frequent weekly decision cycles,
- moderate data maturity (warehouse + spreadsheets + SaaS tools).

### 5.2 Initial vertical wedge (recommended)

Start with one high-frequency decision domain to avoid generic positioning. Candidate wedges:

- SaaS metrics (MRR, churn, activation),
- logistics/ops metrics (if aligned with TMS background),
- e-commerce conversion and retention.

### 5.3 Why wedge first

- faster metric standardization,
- clearer ROI story,
- reusable templates and prompts,
- stronger differentiation versus horizontal chat analytics tools.

---

## 6) Product Principles (Must Not Be Violated)

1. **Decision-first, not dashboard-first**
2. **Trust over novelty**
3. **Actionability over verbosity**
4. **Proactive intelligence over reactive querying**
5. **Semantic consistency over ad-hoc metric definitions**
6. **Human approval over unsafe autonomous execution (early stages)**

---

## 7) Core Product Capabilities

### 7.1 Must-have foundation (MVP-critical)

- Connect core data sources (warehouse/db + spreadsheet uploads + key SaaS APIs)
- Natural language question interface
- Verified query generation and execution
- Root-cause decomposition with ranked drivers
- Recommended actions tied to each diagnosis
- Basic confidence and evidence display

### 7.2 Trust layer (mandatory for adoption)

- SQL transparency and explanation
- Data lineage visibility
- confidence scoring,
- data quality checks before/alongside analysis,
- metric dictionary with canonical definitions.

### 7.3 Proactive layer (retention driver)

- "What changed since yesterday/week?"
- anomaly and threshold alerts,
- prioritized risk/opportunity feed,
- recurring AI decision briefings.

### 7.4 Action layer (outcome driver)

- Push approved recommendations to Slack/Jira/other systems
- Track whether suggested actions were executed
- Measure downstream impact and learn from outcomes

---

## 8) Differentiation Strategy

Sploy should win on the integrated chain:

**Detect -> Diagnose -> Decide -> Dispatch -> Measure**

Most competitors are strongest in only one or two links:

- detect/query,
- or visualize/report,
- but not full-loop decision execution with trust controls.

Strategic moat candidates:

- reliable root-cause ranking quality,
- semantic metric layer + business context memory,
- action recommendation quality + outcome feedback loop,
- vertical playbooks and templates.

---

## 9) What Not to Build Early (Anti-Goals)

- custom drag-and-drop dashboard builder,
- broad AutoML platform ambitions,
- generic assistant without domain constraints,
- overbuilt infrastructure before product signal,
- autonomous external actions without approval/audit.

If a feature does not improve decision speed, trust, or execution rate, deprioritize it.

---

## 10) MVP That Can Monetize

Ship one narrow, high-value flow end-to-end:

1. Connect PostgreSQL/Supabase (plus one warehouse connector)
2. Ask plain-language business question
3. Return:
   - direct answer,
   - ranked root causes,
   - supporting chart/table,
   - recommended action with impact estimate
4. Optional one-click push to Slack/Jira
5. Track impact outcome

Success criterion: teams use it repeatedly for weekly operational decisions.

---

## 11) Success Metrics (North Star + Supporting)

Primary:

- **Decision Lead Time** (question -> action created)
- **Insight Activation Rate** (% insights converted to tracked actions)

Secondary:

- Root-cause acceptance rate
- Confidence-adjusted answer acceptance rate
- Weekly active decision makers
- Outcome lift from executed recommendations
- Retention at 30/90 days

---

## 12) Pricing Hypothesis

Initial motion:

- low-friction entry plan for SMB teams,
- team tier priced on seats + monitored metrics or decision volume,
- optional premium for governance/automation integrations.

Value narrative:

- "Replace repetitive analyst cycles for a fraction of the cost,"
- but emphasize business outcome, not headcount replacement.

---

## 13) Risks and Mitigations

1. **Hallucinated or low-confidence conclusions**
   - Mitigate with evidence traces, confidence gates, and fallback language.

2. **Data quality issues**
   - Add pre-analysis quality checks and visible warnings.

3. **Metric definition drift**
   - Enforce semantic layer and versioned metric definitions.

4. **Low trust from business users**
   - Show query logic, assumptions, and lineage by default.

5. **Feature sprawl**
   - Keep strict wedge scope and outcome-based roadmap gating.

---

## 14) 90-Day Build Priorities

### Phase 1 (Weeks 1-4): Trustworthy Q&A + core diagnosis

- Data connectors (at least 2 core sources)
- NL-to-query with validation
- basic root-cause engine and explanation UI

### Phase 2 (Weeks 5-8): Decision recommendation + workflow hooks

- action recommendation templates,
- Slack/Jira integration for action dispatch,
- basic impact estimation.

### Phase 3 (Weeks 9-12): Proactive monitoring + learning loop

- scheduled decision briefs,
- anomaly alerts,
- outcome tracking and recommendation feedback.

---

## 15) Context for AI Agents and Assistants Working on Sploy

When an AI agent contributes to this project, it should default to:

1. **Decision-centric framing**
   - Every feature proposal must answer: how does this improve decision speed, confidence, or execution?

2. **Evidence-first outputs**
   - Provide clear rationale, assumptions, confidence, and source traceability.

3. **No vanity dashboarding**
   - Visuals are support artifacts, not the product core.

4. **Guardrail-aware generation**
   - Never return high-confidence recommendations without sufficient evidence checks.

5. **Actionability requirement**
   - Each insight should include suggested next step and expected impact range where possible.

6. **Minimal viable complexity**
   - Prefer the smallest implementation that enables the full Detect->Diagnose->Decide loop.

---

## 16) Working Definition of "Done" for Sploy Features

A feature is "done" only if it:

- is understandable by non-technical operators,
- provides traceable evidence,
- can be acted upon in workflow tools,
- and can be measured for business impact after execution.

If those are missing, the feature is incomplete regardless of UI polish.

