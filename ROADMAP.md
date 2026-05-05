# Sploy Execution Plan (Now -> Domain/VPS/Organic Launch -> $1K MRR)

## Context Snapshot (Where You Are Now)

Based on the current product spec and codebase:

- Positioning is strong: **AI decision engine** with the Detect -> Diagnose -> Decide -> Dispatch -> Measure loop.
- UX foundation exists (auth + dashboard structure), but core value capabilities still need to be productionized.
- You are pre-launch and should optimize for:
  - one focused wedge,
  - one monetizable workflow,
  - and early trust with real users.

This plan is designed for:

1. **1-2 months** to become launch-ready (buy domain, deploy VPS, start organic marketing).
2. **2-3 months after launch** to reach first paying users and target **$1K MRR**.

## Feature Timeline (Simple View)

| Feature / Workstream | Duration | Target Window |
| --- | --- | --- |
| Wedge + ICP definition + offer statement | 1 week | Week 0-1 |
| MVP scope freeze + acceptance checklist | 1 week | Week 1-2 |
| Core analysis loop (Ask -> Diagnose -> Recommend) | 2 weeks | Week 3-4 |
| Trust layer (SQL transparency, confidence, assumptions) | 1 week | Week 4-5 |
| Connectors (DB + CSV minimum) | 1 week | Week 5-6 |
| Action dispatch (Slack/task export) + event tracking | 1 week | Week 6 |
| Domain + VPS + prod deployment hardening | 1 week | Week 7 |
| Landing page, onboarding flow, launch assets | 1 week | Week 8 |
| Organic distribution engine (X/Reddit/IG cadence) | Ongoing | Start Week 8 |
| Conversion layer (paywall triggers + case studies) | 4 weeks | Post-launch Month 2 |
| Growth loop (referrals + webinar + outbound assist) | 4 weeks | Post-launch Month 3 |

---

## Revenue Math (Target Clarity)

To hit $1K MRR quickly, keep pricing simple:

- Starter: `$49/mo`
- Team: `$149/mo`

Possible paths:

- ~7 Team customers (`7 x 149 = 1043`)
- or ~21 Starter customers (`21 x 49 = 1029`)
- or blended mix (recommended): `4 Team + 9 Starter = 1037`

Focus GTM on getting **3-5 strong design partners first**, then convert to paid.

---

## Phase 0: Weeks 0-2 (Lock Wedge + Offer + MVP Scope)

### Objectives

- Narrow to one wedge to avoid generic analytics positioning.
- Define the exact paid promise in one sentence.
- Freeze MVP scope to what can monetize.

### Deliverables

1. **Wedge decision (pick one):**
   - SaaS metrics (MRR/churn/activation) **or**
   - e-commerce conversion/retention **or**
   - ops/logistics metrics.
2. **Offer statement:**
   - "Sploy helps [ICP] detect metric changes, diagnose root causes, and ship actions in minutes."
3. **MVP success event (must be measurable):**
   - user asks question -> gets ranked causes -> creates action -> returns next week.
4. **Landing page copy v1:**
   - pain, promise, screenshots, waitlist CTA.
5. **Pricing hypothesis page (even if early-access wording):**
   - transparent "pilot pricing starts at ...".

### Exit Criteria

- You can describe the product in 10 seconds for one specific buyer.
- 10-20 target prospects contacted for interviews/demo calls.

---

## Phase 1: Weeks 3-6 (Build Trustworthy Monetizable Core)

### Objectives

- Ship the smallest end-to-end flow that creates repeat decisions.
- Make outputs trustworthy enough for business users.

### Build Priorities

1. **Core flow completeness**
   - NL question input -> validated query -> answer + ranked drivers + recommended action.
2. **Trust layer**
   - SQL/explanation visibility, confidence level, clear assumptions.
3. **Connector minimum**
   - one DB connector + CSV import (or one wedge-specific connector users already have).
4. **Action step**
   - create/export action (Slack or simple task output).
5. **Event instrumentation**
   - track ask, driver accepted, action created, weekly return usage.

### Validation Loop

- Weekly demos with 3-5 design partners.
- Log every "I don't trust this" and "this is useful" moment.
- Prioritize fixes that improve decision confidence, not UI polish.

### Exit Criteria

- At least 3 external users can complete full loop without your help.
- At least 1 team says they would pay when stable.

---

## Phase 2: Weeks 7-8 (Launch Prep: Domain + VPS + Distribution Setup)

### Objectives

- Move from dev environment to publicly accessible product.
- Prepare lightweight but credible launch assets.

### Infrastructure + Ops

1. Buy domain and set production subdomains (`app`, `api`, `www`).
2. Provision VPS and deploy web/api with monitoring + backups.
3. Configure:
   - SSL
   - transactional email
   - analytics + error tracking
   - basic rate limits and auth hardening
4. Add legal basics:
   - Terms, Privacy, support contact.

### Launch Assets

1. Website v1 with clear wedge messaging and CTA.
2. Demo script + 2 short walkthrough videos.
3. "How Sploy diagnoses X" content pieces for social channels.
4. Waitlist/onboarding flow connected to CRM/notion tracker.

### Exit Criteria

- Live production URL, stable onboarding, and demo-ready environment.
- You can start organic posting the same day.

---

## Organic Marketing Plan (Starts at Launch Day)

## Channels: X, Reddit, Instagram

### Messaging Rule

Always post **problem -> diagnosis -> action -> result**.
Avoid generic "AI analytics" claims.

### X (daily, high frequency)

- 1 post/day:
  - teardown of a decision problem,
  - short product clips,
  - build-in-public updates with concrete lessons.
- 3 replies/day on relevant founders/ops/analytics threads.
- CTA: "comment 'demo' / DM for pilot".

### Reddit (2-3 quality posts/week + comments)

- Participate in relevant subreddits with value-first case breakdowns.
- Post practical workflows, not promotion-heavy announcements.
- Share anonymized "before/after decision loop" examples.
- CTA softly via "if useful, happy to share the template/workflow."

### Instagram (3 reels/week)

- 30-60s screen-record mini-cases:
  - metric drops,
  - root-cause path,
  - recommended next move.
- Use founder voice + simple captions.
- Link in bio to waitlist/demo.

---

## Post-Launch Months 1-3 (Path to First Paying Users + $1K MRR)

## Month 1 After Launch

### Goals

- 30-50 activated signups
- 8-12 onboarding calls
- 3-5 design partners running weekly workflows

### Execution

- High-touch onboarding (done-with-you setup).
- Weekly decision review sessions with partners.
- Tight feedback loops on trust/accuracy problems.

## Month 2 After Launch

### Goals

- Convert first cohort to paid (target: 3-6 customers).
- Publish 2 strong case studies with quantified outcomes.

### Execution

- Introduce clear paywall trigger:
  - advanced diagnostics,
  - scheduled briefings,
  - team collaboration features.
- Launch referral ask to early happy users.

## Month 3 After Launch

### Goals

- Reach `$1K MRR` (blended pricing mix).
- Build predictable weekly top-of-funnel.

### Execution

- Double down on highest-converting channel content type.
- Add weekly webinar/live teardown.
- Start lightweight outbound to lookalike ICP accounts.

---

## Weekly KPI Dashboard (Operate by Numbers)

Track these every week:

1. New qualified signups
2. Activation rate (first full analysis completed)
3. Insight -> action conversion rate
4. Weekly active decision makers
5. Trial-to-paid conversion
6. Churn / cancellation reasons
7. MRR (new, expansion, churned)

If a KPI stalls 2 weeks in a row, pause feature work and fix that bottleneck.

---

## Practical Cadence (Founder Operating Rhythm)

- **Monday:** product quality and trust fixes from last week's user calls.
- **Tuesday-Wednesday:** build + partner onboarding.
- **Thursday:** content batch creation (X/Reddit/IG).
- **Friday:** demos, KPI review, and roadmap pruning.
- **Daily:** 60-90 min distribution block (non-negotiable).

---

## Risk Control (What Can Kill the Plan)

Top risks and controls:

1. **Too broad ICP** -> enforce one wedge for first 90 days.
2. **Low output trust** -> prioritize evidence/confidence and transparent logic.
3. **Feature sprawl** -> every task must improve decision speed, trust, or action rate.
4. **Weak distribution consistency** -> maintain daily posting + weekly demos cadence.
5. **No conversion path** -> define pricing and upgrade triggers before launch.

---

## Immediate Next 10 Days (Action List)

1. Finalize wedge + ICP one-pager.
2. Define MVP acceptance checklist for monetizable loop.
3. Recruit first 5 design partners from warm network + communities.
4. Build instrumentation for activation and action conversion.
5. Prepare landing page + waitlist + demo script.
6. Choose and buy domain, shortlist VPS setup.
7. Produce first 7 days of social content in advance.

If you execute this sequence tightly, you'll reach launch readiness in **~6-8 weeks**, then have a realistic path to **$1K MRR within 2-3 months post-launch** through focused onboarding + consistent organic distribution.
