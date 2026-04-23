# DTMP Stage 0 — Refinement Task List

**Branch:** `feature/dev-portfolio-mercy`
**Status:** In progress
**Approach:** Execute one task at a time, mark complete before moving to next.

---

## Task Index

| # | Task | Status | Files |
|---|---|---|---|
| T02 | Help Icon — Wire up click interactions | ✅ Done | `Header.tsx` |
| T03 | Platform Overview CTA — Restore specific article link | ✅ Done | `DBPOverview.tsx`, `KnowledgeCenterDetailPage.tsx`, `KnowledgeCenterPage.tsx`, `App.tsx` |
| T04 | 4D Governance Model — Deeper definitions and elaboration | ✅ Done | `FourDModelPage.tsx`, `src/data/governance.ts` |
| T05 | A–E Methodology — Dedicated page + CTA from 4D page | ✅ Done | New: `MethodologyPage.tsx`, `App.tsx`, `FourDModelPage.tsx`, `src/data/governance.ts`, `Header.tsx` |
| T07 | Execution Streams — Correct and expand DWS + SDO content | ✅ Done | `ExecutionStreamsPage.tsx` |
| T08 | Strategic Priorities — Add filter pass-through to Lifecycle marketplace | ✅ Done | `StrategicPriorities.tsx`, `LifecycleManagementPage.tsx`, `src/data/shared/lifecyclePortfolioStore.ts`, `src/data/strategicPriorities.ts` |
| T09 | Transformation Office — Align styling with landing page design system | ✅ Done | `TransformationOfficePage.tsx` |
| T10 | Onboarding — Route to specific marketplace/card with filters | ✅ Done | `OnboardingPage.tsx`, `LifecycleManagementPage.tsx` |
| T11 | Landing Theme — Align landing page visual system to DEWA brand cues | ✅ Done | `HeroSection.tsx`, `shared.tsx`, `DBPOverview.tsx`, `GovernanceModel.tsx`, `ExecutionStreams.tsx`, `StrategicPriorities.tsx`, `ResourceMarketplaces.tsx`, `TOValue.tsx`, `FinalCTA.tsx`, `Header.tsx`, `src/components/landing/theme.ts` |
| T12 | Divisional Landing Theme — Align division landing pages to DEWA visual system | ✅ Done | `DivisionalLandingPage.tsx` |
| T13 | 4D Page Theme — Align 4D Governance page to DEWA visual system | ✅ Done | `FourDModelPage.tsx` |
| T14 | T-Office Theme — Align Transformation Office page to DEWA visual system | ✅ Done | `TransformationOfficePage.tsx` |

> T01 (Search + Chat) and T06 (Division pages) require no changes.

---

## T02 — Help Icon: Wire Up Click Interactions

### Problem
The help icon in the Header renders five options in a dropdown but none have click handlers. Clicking anything does nothing. Dead interactions erode trust.

### Options and Intended Behaviour

| Option | Behaviour | Implementation |
|---|---|---|
| Register / Request Access | Open a modal — role selector + name/email fields + submit button | Inline modal, confirmation toast on submit |
| Navigation Issue | Open a feedback modal — "What were you looking for? Where did you expect to find it?" + text area + submit | Inline modal, toast confirmation |
| Submit a Complaint | Open a modal — issue type dropdown + description + contact email + submit | Inline modal, toast confirmation |
| Contact the EA Office | Expand inline panel showing: EA Office email, Teams channel name, office location | No modal — reveal info within the dropdown |
| Something Isn't Working | Open a bug report modal — current URL (auto-filled), description, optional screenshot note, submit | Inline modal, toast confirmation |

### Execution Steps
1. Read `Header.tsx` in full to understand current help dropdown structure
2. Create modal state variables for each interactive option (or a single `activeHelpModal` state with a string key)
3. Wire `onClick` to each `helpOptions` item
4. Build each modal as a conditional render inside the Header component (keep them lightweight — no separate files needed at this stage)
5. Use existing `toast` hook for all confirmation messages
6. "Contact the EA Office" option: reveal a contact info sub-panel inside the dropdown instead of opening a modal
7. Verify all five options produce a visible, intentional outcome

### Notes
- No backend. All forms show a success toast: "Request received — the EA Office will respond within 2 working days."
- Do not add routing away from the current page for any of these.

---

## T03 — Platform Overview CTA: Restore Specific Article Link

### Problem
The Platform Overview section (`DBPOverview.tsx`) has a CTA — "Explore the Unified EA Architecture" — that currently links to `/marketplaces/knowledge` (the general marketplace home). Previously it linked to a specific strategy document. During the rename pass, the deep-link was replaced with the general route because the old path was being retired and the target document's ID was uncertain.

There is also a suspected broken redirect on the Knowledge marketplace card itself — this needs to be verified.

### Execution Steps
1. Read `src/components/sections/DBPOverview.tsx` to see the current CTA link and label
2. Read the Knowledge Centre data files (`src/data/knowledge/` or wherever articles are seeded) to find an appropriate existing article — look for something labelled "EA Architecture", "Unified Architecture", "DEWA EA Strategy", "EA 4.0 Framework", or similar strategy-level content
3. Note the article's `id`, `tab` (source tab within the Knowledge marketplace), and route pattern
4. Update the CTA in `DBPOverview.tsx` to link to the specific article detail page: `/marketplaces/knowledge/:tab/:articleId`
5. Read `KnowledgeCenterDetailPage.tsx` — check for any back-navigation or breadcrumb that references old routes (knowledge-center) and verify they resolve correctly
6. Read `KnowledgeCenterPage.tsx` — check that the card `onClick` for this specific article navigates to the correct canonical route
7. Fix any stale route references found in steps 5–6

### Notes
- The target article must already exist in seeded data — do not create a new one just for this CTA
- If no suitable article exists, escalate before proceeding (don't fall back to the general marketplace again)

---

## T04 — 4D Governance Model: Deeper Definitions

### Problem
The current phase cards on `/4d-model` give a definition, a who-leads note, a list of linked marketplaces, and an A–E stage mapping. The definitions are correct but thin. The user wants more robust, elaborated content for each phase — something that genuinely explains the governance logic, not just labels it.

### What "Deeper" Means Per Phase

Each phase card should cover:
- **What this phase is** — 3–5 sentence definition, not a tagline
- **Why it comes at this point in the sequence** — what would go wrong if you skipped it or reordered it
- **Who leads and who participates** — primary role + supporting roles, not just a job title
- **What decisions are made here** — the governance questions this phase answers
- **What the outputs are** — what leaves this phase and enters the next
- **Governance gates** — what must be true before moving forward
- **Which marketplaces are active and why** — not just a list, but a sentence explaining the connection

### Execution Steps
1. Read `src/pages/FourDModelPage.tsx` in full — understand the current card structure and data shape
2. Read `src/data/governance.ts` (or wherever the 4D phase data is defined) — understand the current data model
3. Expand the data model to support the new fields listed above
4. Rewrite the content for all four phases (Discern / Design / Deploy / Drive) with the depth described
5. Update the card component in `FourDModelPage.tsx` to render the new fields — expand the card UI to accommodate richer content without being cluttered
6. Review internal consistency — each phase's outputs should logically become the next phase's inputs

### Notes
- Drive currently bundles too much (portfolio, analytics, support). Consider whether Drive should be subdivided or whether the card copy should acknowledge the breadth explicitly.
- The A–E content on this page will be simplified once T05 is done (it becomes a CTA pointing to the new page).

---

## T05 — A–E Methodology: Dedicated Page

### Problem
The A–E methodology (Strategy → Assets → Target → Initiatives → Deploy) is currently summarised at the bottom of `/4d-model` as five brief cards. This underserves a genuine delivery methodology. The fix is to give it its own page and reduce the 4D page to a clean summary with a "Read More" CTA.

### New Route
`/methodology` — the A–E Methodology page

### Page Structure (`MethodologyPage.tsx`)
Each step (A through E) rendered as a full section or expanded card with:
- **Letter + full name** (e.g. "A — Strategy & Context")
- **What happens at this step** — 3–5 sentences describing the work being done
- **Who does it** — primary roles active at this step
- **Tools and marketplaces used** — which DTMP marketplaces are active at this step and why
- **Typical deliverables** — what is produced and handed to the next step
- **Connection to 4D** — which Discern / Design / Deploy / Drive phase this step sits within
- **Visual indicator** — progress/sequence indicator showing where A sits relative to B–E

The page should feel like a reference document, not a marketing page. Clean layout, dense but navigable.

### Changes to `FourDModelPage.tsx`
- Replace the current A–E card grid with a short prose summary (2–3 sentences) of what the A–E methodology is and how it relates to 4D
- Add a CTA button: **"Explore the Full A–E Methodology →"** linking to `/methodology`

### Execution Steps
1. Read `src/pages/FourDModelPage.tsx` — identify current A–E card section and its data
2. Read `src/data/` — check if A–E step data exists in a separate file or is inline in the page
3. Create `src/pages/MethodologyPage.tsx` with the structure described above
4. Add route to `src/App.tsx`: `<Route path="/methodology" element={<MethodologyPage />} />`
5. Update `FourDModelPage.tsx` — strip the A–E card grid, add summary prose + CTA
6. Verify the new page renders, the CTA links correctly, and the 4D page still makes sense without the A–E detail

### Notes
- The new page should have its own Header + Footer
- The URL `/methodology` should also be accessible from the Header Explore dropdown or another navigation surface — assess whether to add it after building

---

## T07 — Execution Streams: Correct and Expand DWS + SDO

### Problem
The current `ExecutionStreamsPage.tsx` and its data contain inaccurate definitions for two of the four streams. The content was inferred from acronyms in a utility context rather than sourced from spec.

### Correct Definitions

**DWS — Digital Workspace**
Core theme: how DEWA's people work — the digital workplace itself.
Includes (at minimum): collaboration and productivity platforms, workplace configuration, core business operations systems, back-office functions (HR, Finance, Procurement). Extrapolate further: unified communications, enterprise content management, employee experience platforms, ERP governance.

**SDO — Security & DevOps**
Core theme: the technology foundation that all other streams depend on.
Includes (at minimum): digital IT infrastructure and foundations, cybersecurity architecture and governance, interoperability frameworks, automation (BPM, APIs, integration layers). Extrapolate further: cloud platform governance, network architecture, identity and access management, secure delivery pipelines, IT/OT security convergence.

**DXP — Digital Experience Platform** and **DIA — Digital Intelligence & Analytics** — verify these are correctly defined in the current data before assuming no changes needed.

### Execution Steps
1. Read `src/data/executionStreams.ts` — review all four stream definitions in full
2. Read `src/pages/ExecutionStreamsPage.tsx` — understand how stream data is rendered (programme scope bullets, platform connections, CTAs)
3. Rewrite DWS content: name, description, programme scope (4–6 bullets, not 4), platform connections, CTA
4. Rewrite SDO content: name, description, programme scope (4–6 bullets), platform connections, CTA
5. Review and correct DXP and DIA if needed
6. Update the data file and verify the page renders correctly

### Notes
- Programme scope bullets should be substantive, not generic — each bullet should name a real function or system type, not just a category
- Platform connections should reference specific DTMP marketplaces with a brief reason why

---

## T08 — Strategic Priorities: Filter Pass-Through to Lifecycle Marketplace

### Problem
Each Strategic Priority card on the landing page links to `/marketplaces/initiative-portfolio` with no context. The user lands on the full unfiltered marketplace regardless of which priority they clicked. The priority selection data is discarded.

### Desired Behaviour
Clicking a priority card → navigates to `/marketplaces/initiative-portfolio?priority=:slug` → Lifecycle marketplace loads with that priority pre-selected as an active filter → user sees only initiatives tagged to that priority → a visible filter chip confirms the active filter → "Clear filter" removes it.

### Execution Steps
1. Read `src/components/sections/StrategicPriorities.tsx` — identify how priority cards render and what data they use
2. Read `src/data/strategicPriorities.ts` (or equivalent) — note each priority's `id` or `slug`
3. Read `src/pages/LifecycleManagementPage.tsx` — understand current filter state and how it's managed
4. Check the seeded initiative data — verify whether initiatives have a `strategicPriority` field; if not, add it to a representative set of seeded initiatives
5. Update `StrategicPriorities.tsx` — change each card's `Link to=` from `/marketplaces/initiative-portfolio` to `/marketplaces/initiative-portfolio?priority=:slug`
6. Update `LifecycleManagementPage.tsx`:
   - Import `useSearchParams`
   - On mount, read `priority` param
   - If present, set as active filter in the filter bar
   - Show a visible "Filtered by: [Priority Name] ×" chip that clears the param on click
7. Verify the full flow: click priority on landing → arrive pre-filtered → chip shows → clear works → no param → full list

### Notes
- Slugs should be lowercase-hyphenated and stable (e.g. `clean-energy`, `ai-innovation`, `smart-grid`)
- The filter chip should use the priority's display name, not the slug

---

## T09 — Transformation Office Page: Design System Alignment

### Problem
The `TransformationOfficePage.tsx` was built as a standalone page and drifted from the landing page design system. The "Engagement with Transformation Office" section (and possibly others) uses card styles, backgrounds, or layout patterns that don't match the established system.

### Design System Reference (Landing Page Patterns)
- **Section eyebrow:** `SectionPill` component with uppercase label
- **Section backgrounds:** white (`bg-white`), slate-50 (`bg-slate-50`), or specific named gradient for dark sections
- **Cards:** `rounded-2xl`, `border border-slate-100`, `shadow-sm`, hover shadow lift
- **Primary buttons:** gradient fill — typically `linear-gradient(135deg, #6d28d9 0%, #0369A1 100%)` or similar spec-approved gradients
- **Secondary/outline buttons:** `border border-slate-200`, `text-slate-700`, hover `bg-slate-50`
- **Section spacing:** `py-20` standard, `py-16` for CTA bands
- **Typography:** `text-3xl lg:text-4xl font-bold text-slate-900` for section headings

### Execution Steps
1. Read `src/pages/TransformationOfficePage.tsx` in full
2. Section by section, compare against the reference patterns above — note every divergence (background tint, card border style, button gradient, missing SectionPill, spacing)
3. Fix each divergence — no structural changes, purely visual alignment
4. Pay particular attention to: the Mandate section cards, the Service Catalogue cards, the CTA band at the bottom
5. Verify the page still renders correctly after changes

---

## T10 — Onboarding Flow: Specific Destination Routing

### Problem
The onboarding flow collects role (Step 1) + division (Step 2) + 4D primer (Step 3). On completion it routes to a generic destination (Stage 2 or a top-level marketplace). The role and division data collected during onboarding is not used to make a specific routing decision. The whole purpose of onboarding is to shortcut generic exploration — the redirect should reflect that.

### Desired Behaviour
On completion, the user should be routed to the most relevant marketplace, and where possible, to a pre-filtered or pre-selected state within that marketplace — not just the marketplace home.

### Role → Destination Mapping (baseline)

| Role | Primary destination | Enhancement |
|---|---|---|
| Enterprise Architect / EA Office | `/marketplaces/asset-capability` | Pre-select "Architecture Canvas" tab if one exists |
| Divisional Transformation Lead | `/divisions/:selected-division` | Uses division selected in Step 2 |
| Project Manager / Programme Lead | `/marketplaces/initiative-portfolio` | Pre-filter by division (`?division=:slug`) |
| General Staff | `/marketplaces/learning` | Pre-select "Getting Started" or equivalent tab |
| Transformation Office (Lead or Admin) | `/transformation-office` (or `/stage3/dashboard` if authenticated) | — |
| Senior Leadership | `/marketplaces/intelligence` | — |

### Execution Steps
1. Read `src/pages/OnboardingPage.tsx` in full — understand role definitions, division list, current redirect logic, and localStorage structure
2. Note exact role IDs and division slugs as defined in the component
3. Build a routing map: `role + division → destination URL` (with query params where applicable)
4. Update the `handleComplete` function to use this map instead of a generic destination
5. Ensure the division slug selected in Step 2 is available at completion time
6. Where a marketplace is the destination, construct the URL with appropriate query params (tab, filter, priority) so the user lands in a contextualised view
7. Verify all 6 role paths route to distinct, correct destinations
8. Verify the Divisional Transformation Lead path correctly uses the Step 2 division selection

### Notes
- If the user is unauthenticated, Stage 3 destinations should fall back to the TO's marketplace landing instead
- The localStorage write should still happen — it stores the onboarding completion state regardless of where the user is routed

---

## T11 — Landing Theme: DEWA Brand Alignment

### Problem
The landing page was leaning too heavily on a violet/indigo SaaS-style palette. That visual language did not align closely enough with DEWA’s public-facing sustainability, clean-energy, and Net-Zero positioning.

### Desired Behaviour
Shift the landing page toward a DEWA-aligned visual system:
- green-led primary accents
- teal/blue as supporting digital colors
- cleaner institutional surfaces
- fewer purple/pink hero and CTA treatments
- stronger visual alignment to sustainability and enterprise utility transformation

### Execution Steps
1. Audit landing sections and shared landing accents for dominant purple styling
2. Create a shared landing theme token file
3. Rework the hero section to use a green/teal DEWA-aligned palette
4. Update CTA gradients, pills, stat gradients, and section tints
5. Restyle the most visible landing-page components and header accents
6. Run type-check to confirm the restyle is clean

### Notes
- Reference cues came from DEWA’s public brand and homepage materials
- This task is visual alignment work, not IA or content restructuring

---

## T12 — Divisional Landing Theme: DEWA Brand Alignment

### Problem
The division landing pages still reflected the older violet-heavy landing style even after the main landing page moved toward a greener, more DEWA-aligned visual system.

### Desired Behaviour
Bring the shared division landing template into the same design family as the refreshed landing page:
- keep division-specific accents
- reduce purple-heavy treatments
- align AI prompt bar, surfaces, tabs, and CTA band to the DEWA-oriented green/teal system
- avoid rewriting division copy unless necessary

### Execution Steps
1. Audit the shared division landing template for old violet/indigo treatments
2. Rebalance division accents that felt too detached from the DEWA palette
3. Update the AI prompt bar and interaction states to the new green/teal system
4. Replace violet-tinted section backgrounds with the new landing surface treatment
5. Align tabs, KPI accents, card hover states, and CTA band with the shared landing theme
6. Run type-check

### Notes
- This was implemented as a shared-template facelift in `DivisionalLandingPage.tsx`
- Content and division messaging were preserved; this was a visual/system pass

---

## T13 — 4D Page Theme: DEWA Brand Alignment

### Problem
The 4D Governance page still used the older indigo/purple Stage 0 visual language after the landing and divisional pages were refreshed.

### Desired Behaviour
Bring the 4D page into the same family as the refreshed DEWA-aligned pages:
- green/teal-led hero treatment
- DEWA-aligned section tint for the methodology block
- CTA buttons and bottom band aligned to the shared landing theme
- no content rewrite

### Execution Steps
1. Replace the old purple-heavy hero gradient with the shared landing hero treatment
2. Update the hero pill accent
3. Re-theme the methodology CTA section surface and button
4. Re-theme the bottom CTA band using the shared landing dark gradient
5. Run type-check

### Notes
- This was a visual pass only
- Governance content and page structure were preserved

---

## T14 — T-Office Theme: DEWA Brand Alignment

### Problem
The Transformation Office page still carried the older purple-heavy Stage 0 visual treatment even after the landing and 4D pages were refreshed.

### Desired Behaviour
Bring the Transformation Office page into the same DEWA-aligned visual system:
- green/teal-led hero treatment
- AI assistant interactions aligned to the refreshed theme
- mandate, service, and team cards using updated hover/accent treatment
- bottom engagement band aligned to the shared dark DEWA gradient
- no content rewrite

### Execution Steps
1. Replace the hero palette and accent highlight treatment
2. Re-theme the AI prompt bar and example prompt interactions
3. Update CTA gradients and card hover shadows
4. Replace the old violet-tinted section background with the shared landing surface
5. Re-theme the bottom engagement band and TO entry CTA
6. Run type-check

### Notes
- This was a visual pass only
- Content and structure were preserved

---

## Execution Order (Recommended)

Suggested sequence to minimise rework:

1. **T03** — Quick win, anchors Knowledge CTA correctly before other tasks reference it
2. **T02** — Self-contained, no dependencies
3. **T07** — Self-contained data + page rewrite
4. **T09** — Visual pass, no logic changes
5. **T04** — Content depth, sets up for T05
6. **T05** — Depends on T04 being finalised (A–E section on 4D page will be removed)
7. **T08** — Depends on knowing initiative data structure (checked during T07/T04)
8. **T10** — Last, most complex — depends on understanding final marketplace/page states

---

*Last updated: 22 April 2026*
*Owner: Mercy Irene*
