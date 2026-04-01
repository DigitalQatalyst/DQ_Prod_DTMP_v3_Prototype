# Lifecycle UX Positioning Task List

## Purpose

This document converts the current Lifecycle Management positioning recommendations into an implementation task list.

It is intended to help the team strengthen Lifecycle Management as:

- DEWA's governed execution environment for transformation initiatives
- the operational complement to Portfolio Management's control-tower view
- the place where initiatives are structured, progressed, supported, escalated, and closed with evidence

## Target Story

Lifecycle Management should feel like the official system where strategic intent is translated into accountable delivery.

The user should come away with these impressions:

- this is not a generic PM dashboard
- this is where DEWA runs governed transformation initiatives
- ownership, stage progression, intervention, and evidence all matter here
- Portfolio identifies the problem; Lifecycle governs the response

## Core Positioning Statement

Lifecycle Management is DEWA's governed execution environment for transformation initiatives, where strategic intent is translated into accountable delivery, active intervention, and verified outcomes.

## Task List

### 1. Rewrite the Stage 1 hero and framing copy `[Done]`

**Goal**

Make the first impression more institutional, governance-led, and specific to DEWA's transformation operating model.

**Implementation**

- Update the hero title, subheading, stat labels, and supporting copy in `src/pages/LifecycleManagementPage.tsx`.
- Replace generic delivery language with language that emphasizes:
- governed execution
- stage-gate progression
- EA/TO oversight
- delivery accountability
- intervention when delivery is at risk
- verified outcomes
- Add a short supporting line that explicitly distinguishes Lifecycle from Portfolio.

**Suggested direction**

- Current tone: operational execution layer
- Stronger tone: governed execution layer for enterprise transformation initiatives

**Contribution to overall story**

This sharpens the user's first understanding of what Lifecycle is for and prevents it from reading as just another delivery dashboard.

### 2. Introduce a visible lifecycle journey model `[Done]`

**Goal**

Make the "lifecycle" concept explicit in the UX instead of forcing users to infer it from status labels and tabs.

**Implementation**

- Add a persistent initiative journey strip to:
- `src/pages/lifecycle/LCInitiativeDetailPage.tsx`
- `src/pages/lifecycle/LCInsightsPage.tsx`
- Define a simple visual sequence such as:
- Scoping
- Approved / Governed
- In Delivery
- At Risk / Intervention
- Stabilised
- Completed / Closed
- Use current initiative status and activity data to highlight the current stage.
- Show what the next stage requires, even if initially as static copy.

**Contribution to overall story**

This makes Lifecycle feel like a governed progression model rather than a collection of unrelated panels.

### 3. Make intervention a first-class concept `[Done]`

**Goal**

Position Lifecycle as the place where delivery friction is surfaced and routed into action, not merely reported.

**Implementation**

- Add an "Intervention" summary area to `src/pages/lifecycle/LCInsightsPage.tsx`.
- Pull together:
- open blockers
- escalated blockers
- critical/open risks
- active service requests
- overdue milestones
- Label the area with language like:
- Intervention Required
- Support Needed
- TO Attention Queue
- Add explicit CTAs for:
- request TO support
- escalate blocker
- review outstanding requests

**Contribution to overall story**

This is one of the strongest differentiators for Lifecycle. It tells the user this system exists to keep initiatives moving, not just to describe slippage.

### 4. Reframe tab and section copy around operating questions `[Done]`

**Goal**

Reduce the "dashboard tabs" feel and make each section answer a clear managerial question.

**Implementation**

- Review section labels and descriptive copy in `src/pages/lifecycle/LCInsightsPage.tsx`.
- Rewrite section descriptions so each one answers a question such as:
- Health: Is this initiative under control?
- Projects: Which delivery streams are driving the outcome?
- Budget: Are we financially on track?
- Milestones: What is due, delayed, or completed?
- Risks: What could derail delivery?
- Blockers: What needs intervention now?
- Team: Who is accountable?
- Activity: What has happened and what evidence exists?
- Keep existing tabs if needed, but strengthen explanatory copy above the fold.

**Contribution to overall story**

This makes the page feel more like an operating console and less like a passive reporting surface.

### 5. Increase ownership and accountability signals `[Done]`

**Goal**

Make it obvious who owns the initiative, who owns project execution, and who is responsible for moving issues forward.

**Implementation**

- Strengthen owner presentation in:
- `src/pages/lifecycle/LCInitiativeDetailPage.tsx`
- `src/pages/lifecycle/LCInsightsPage.tsx`
- Add or elevate:
- accountable owner
- project manager ownership
- unresolved issue owners
- resolution due dates
- next key milestone owner
- Add an "accountability strip" or compact summary box in Insights.

**Contribution to overall story**

Accountability is central to the positioning. Without it, Lifecycle risks feeling like a reporting layer instead of a governed execution environment.

### 6. Strengthen the evidence-of-governance feel `[Done]`

**Goal**

Make lifecycle actions feel recorded, auditable, and institutionally meaningful.

**Implementation**

- Expand use of the activity model introduced in `src/data/shared/activityEventStore.ts`.
- Ensure all owner-side changes log activity consistently:
- status changes
- milestone changes
- budget changes
- risk status updates
- blocker escalations
- blocker resolutions
- service requests
- Improve activity rendering in `src/pages/lifecycle/LCInsightsPage.tsx` so entries feel like governance evidence, not generic timeline items.
- Consider tags or metadata on events:
- user
- event type
- source object
- timestamp

**Contribution to overall story**

This gives Lifecycle institutional weight. It tells the user the platform is recording governed progress, intervention, and decision history.

### 7. Make Portfolio-to-Lifecycle provenance explicit `[Done]`

**Goal**

Show that Lifecycle is often the formal response to a portfolio-level finding, gap, or governance trigger.

**Implementation**

- Surface origin context wherever `fromPortfolio` and `portfolioCardId` exist in `src/data/shared/lifecyclePortfolioStore.ts`.
- Add provenance indicators to:
- initiative cards on `src/pages/LifecycleManagementPage.tsx`
- initiative detail pages
- insights page sidebar/header
- Use labels such as:
- Raised from Portfolio
- Created from Rationalisation Finding
- Initiated from Critical App Review
- Link back to the originating portfolio record where possible.

**Contribution to overall story**

This strengthens the narrative connection between the two marketplaces and reinforces the operating model:
Portfolio identifies, Lifecycle executes.

### 8. Make service requests feel like formal support channels `[Done]`

**Goal**

Present TO support requests as a structured intervention path, not just a convenience form.

**Implementation**

- Review request language and states in:
- `src/data/lifecycle/serviceRequestState.ts`
- `src/pages/lifecycle/LCInsightsPage.tsx`
- `src/pages/lifecycle/LCStage2Overview.tsx`
- Reframe request UI to communicate:
- why support is being requested
- what issue triggered it
- who owns the request
- where it is in the support workflow
- what outcome came back
- Consider adding lightweight request categories or labels such as:
- advisory
- recovery
- architecture review
- escalation support

**Contribution to overall story**

This makes TO support feel like part of DEWA's transformation governance model rather than an isolated request feature.

### 9. Give completion and closure more narrative weight

**Goal**

Make "Completed" mean governed closure with evidence, not just a green status.

**Implementation**

- Extend completion states or completion UX in:
- `src/pages/lifecycle/LCInsightsPage.tsx`
- `src/pages/lifecycle/LCInitiativeDetailPage.tsx`
- `src/data/shared/lifecyclePortfolioStore.ts`
- Define completion expectations such as:
- delivery complete
- key milestones closed
- major blockers resolved
- relevant support requests completed
- closure summary available
- Add a "Closure Evidence" or "Outcome Summary" section for completed initiatives.

**Contribution to overall story**

This gives Lifecycle a full beginning-to-end narrative arc and reinforces the idea of verified outcomes.

### 10. Clarify the object model in the UX

**Goal**

Reduce confusion between initiative, project, risk, blocker, service request, and escalation.

**Implementation**

- Add lightweight explanatory microcopy across:
- Lifecycle landing page
- initiative detail
- insights sidebar
- stage 2 overview
- Introduce a short "how this works" pattern:
- initiative = strategic execution wrapper
- project = delivery stream inside initiative
- risk/blocker = threats to delivery
- service request = support request to TO
- escalation = formal intervention path

**Contribution to overall story**

This makes the product model easier to understand and makes the governance structure feel intentional.

### 11. Strengthen visual tone to feel more official and operational

**Goal**

Push Lifecycle away from "generic dashboard" and toward "institutional execution environment."

**Implementation**

- Review visual emphasis in:
- `src/pages/LifecycleManagementPage.tsx`
- `src/pages/lifecycle/LCInsightsPage.tsx`
- `src/pages/lifecycle/LCStage2Overview.tsx`
- Increase the prominence of:
- state indicators
- governance labels
- intervention banners
- ownership callouts
- evidence/activity timelines
- Reduce any overly casual or generic language in cards and helper text.

**Contribution to overall story**

The visual tone should support the product claim that this is a serious governance and execution environment.

### 12. Add an explicit relationship cue between Portfolio and Lifecycle `[Done]`

**Goal**

Teach the user, in-product, how the two marketplaces differ and connect.

**Implementation**

- Add a short relationship explainer in one or both locations:
- `src/pages/PortfolioManagementPage.tsx`
- `src/pages/LifecycleManagementPage.tsx`
- Suggested structure:
- Portfolio tells you where attention is needed
- Lifecycle is where DEWA governs the response
- Add cross-links with intentional wording:
- View execution in Lifecycle
- Return to Portfolio context

**Contribution to overall story**

This strengthens the full DTMP marketplace narrative and reduces conceptual overlap.

## Recommended Delivery Order

### Phase 1: Positioning clarity

- Task 1. Rewrite Stage 1 hero and framing copy `[Done]`
- Task 4. Reframe tab and section copy around operating questions `[Done]`
- Task 12. Add explicit relationship cues between Portfolio and Lifecycle `[Done]`

**Why first**

These changes improve understanding immediately and strengthen demos without requiring deep structural changes.

### Phase 2: Lifecycle identity

- Task 2. Introduce a visible lifecycle journey model `[Done]`
- Task 3. Make intervention a first-class concept `[Done]`
- Task 5. Increase ownership and accountability signals `[Done]`

**Why next**

These establish the strongest unique identity for Lifecycle as a governed execution environment.

### Phase 3: Governance credibility

- Task 6. Strengthen the evidence-of-governance feel `[Done]`
- Task 7. Make Portfolio-to-Lifecycle provenance explicit `[Done]`
- Task 8. Make service requests feel like formal support channels `[Done]`

**Why next**

These deepen the operating-model story and make the workflow feel institutionally real.

### Phase 4: Narrative closure

- Task 9. Give completion and closure more narrative weight
- Task 10. Clarify the object model in the UX
- Task 11. Strengthen visual tone to feel more official and operational

**Why last**

These refine the end-to-end story and improve polish once the structural positioning is in place.

## Success Criteria

The positioning work is succeeding if a user can accurately say:

- Portfolio Management shows me where DEWA needs to act.
- Lifecycle Management is where DEWA governs the execution response.
- I can see ownership, delivery stage, intervention needs, and support history clearly.
- A completed initiative feels formally closed, not just marked done.
- The system feels like an official transformation governance environment, not a generic tracker.

## Suggested Follow-On Deliverables

After this task list, the next useful documents would be:

- a Lifecycle copy deck for hero, tabs, panels, and CTAs
- a screen-by-screen UX rewrite plan
- a Portfolio vs Lifecycle narrative map for demos and stakeholder walkthroughs
- a Stage 1 → Stage 2 → Stage 3 operating model diagram
