# Lifecycle Marketplace Elevation Guide Status

This note is a filtered implementation status for [lifecycle-marketplace-elevation-guide.txt](c:\Users\Wangare\Desktop\DEWA Prototype\DQ_Prod_DTMP_v3_DEWA_Prototype\guides\lifecycle-marketplace-elevation-guide.txt).

It reflects the current product direction:

- keep structural and governance improvements
- avoid extra teaching panels, duplicate hero layers, decorative journey strips, and heavy explanatory UI
- prefer improvements that make Lifecycle cleaner, more coherent, and more operational without adding noise

## Valid And Executed

### 1. Lifecycle positioning as governed delivery layer

Status: `Done`

What was kept:
- Lifecycle remains framed as the governed execution layer for initiatives, distinct from Portfolio
- provenance from Portfolio remains visible where relevant

Why it remains valid:
- this is core product positioning, not decorative UI

### 2. Tab 1 naming clarity

Status: `Done`

What was executed:
- `Initiatives` renamed to `Active Initiatives` in Stage 1

Why it remains valid:
- this improves clarity without changing the interaction model

### 3. EA alignment cleanup

Status: `Done`

What was executed:
- removed seed-data `null` noise by assigning the missing initiative an EA alignment score
- removed `TBD` from the main initiative card badge treatment
- changed remaining user-facing EA fallbacks from `TBD` to `Not Assessed`

Why it remains valid:
- this improves demo credibility and removes low-quality placeholder language

### 4. Raised from Portfolio provenance upgrade

Status: `Done`

What was executed:
- kept the `Raised from Portfolio` signal
- added direct `View portfolio source` actions from Lifecycle detail and Insights provenance surfaces
- added a portfolio-source action inside the Stage 1 initiative card provenance block

Why it remains valid:
- this strengthens the Portfolio-to-Lifecycle narrative without adding more UI clutter

## Valid But Adapted

### 5. Stage 3 coherence across Lifecycle and Portfolio

Status: `Deferred`

Original guide direction:
- unify or at least wrap standalone Stage 3 pages in a shared shell

Why adapted:
- still valid structurally
- not yet executed because it is a broader shell refactor across Lifecycle, Portfolio, and Stage 3 routing
- should be done as a focused architecture pass, not mixed into current UX cleanup work

### 6. Benefits, activity, and governance evidence

Status: `Partially done`

What is already present:
- activity logging exists
- closure/outcome framing exists for completed initiatives

Why adapted:
- the guide is correct that these are valuable
- but they must surface in a restrained way, not as more explanatory banners or dashboard clutter

### 7. Document Studio handoff, sync conflict UI, gate evidence capture, computed RAG

Status: `Deferred`

Why adapted:
- these are valid governance/integration ideas
- they require data-model and workflow work, not just visual changes
- they should be added only once their placement and interaction model are agreed

## Not Carried Forward In This Direction

### 8. Extra lifecycle-model teaching surfaces

Status: `Not adopted`

Examples from the guide direction that do not fit the current product direction:
- explanatory hero tag rows
- lifecycle model cards
- journey strips used as page banners
- accountability/object-model teaching panels in sidebars

Why not:
- they make the UI feel self-explanatory in the wrong way
- they create duplicate hierarchy and visual noise
- they have repeatedly tested poorly against the preferred direction

### 9. Heavy visible journey framing

Status: `Not adopted`

Why not:
- the lifecycle concept is valid
- but full-width journey strips and stage-cell banners felt artificial in practice
- if needed later, lifecycle stage should be shown in a quieter, more embedded way

### 10. Framework-discovery theatricality

Status: `Deferred / likely partial only`

Examples:
- featured strips
- large stepper storytelling
- more layered onboarding chrome in Stage 1

Why not now:
- the current priority is coherence and credibility, not adding more surfaces
- some of these may be useful later, but only in a lighter form

## Executed In This Pass

Files changed in this guide-filtering pass:

- [lifecyclePortfolioStore.ts](c:\Users\Wangare\Desktop\DEWA Prototype\DQ_Prod_DTMP_v3_DEWA_Prototype\src\data\shared\lifecyclePortfolioStore.ts)
- [LifecycleManagementPage.tsx](c:\Users\Wangare\Desktop\DEWA Prototype\DQ_Prod_DTMP_v3_DEWA_Prototype\src\pages\LifecycleManagementPage.tsx)
- [LCInitiativeDetailPage.tsx](c:\Users\Wangare\Desktop\DEWA Prototype\DQ_Prod_DTMP_v3_DEWA_Prototype\src\pages\lifecycle\LCInitiativeDetailPage.tsx)
- [LCInsightsPage.tsx](c:\Users\Wangare\Desktop\DEWA Prototype\DQ_Prod_DTMP_v3_DEWA_Prototype\src\pages\lifecycle\LCInsightsPage.tsx)
- [LCStage3Page.tsx](c:\Users\Wangare\Desktop\DEWA Prototype\DQ_Prod_DTMP_v3_DEWA_Prototype\src\pages\lifecycle\LCStage3Page.tsx)

## Recommended Next Valid Moves

If continuing from the original guide while staying aligned to the current direction, the next highest-value items are:

1. Stage 3 shell alignment for Lifecycle and Portfolio
2. Portfolio sync-state handling in a light, utility-first UI
3. Document Studio handoff for delivered support requests
4. Gate evidence capture with restrained modal-based UX
5. Benefits realization surfaced without reintroducing dashboard clutter
