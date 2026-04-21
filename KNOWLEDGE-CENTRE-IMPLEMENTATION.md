# 2. KNOWLEDGE CENTRE

## Purpose

Serve as the organisation's living institutional knowledge repository — a curated, searchable collection of transformation best practices, methodology playbooks, practitioner testimonials, and reference library content — designed to be consumed, saved, and acted on.

## Story

### Stage 1 — Discovery & Saving
A user arrives at the Knowledge Centre and browses four content categories: Best Practices (proven approaches from transformation programmes), Playbooks (step-by-step methodology guides), Testimonials (case narratives from practitioners who have done it), and Library (reference documents, frameworks, standards). Each item has a detail page with full content, related tags, and metadata. The user can save items to their workspace (login required) or raise a TO request — to ask for clarification on an item, request a resource, or flag an item as outdated.

### Stage 2 — Personal Knowledge Workspace
The user's personal Knowledge Centre workspace. Four views: Saved items (all items the user has bookmarked across all tabs), Reading history (recently viewed items with timestamp), Continue reading (items opened but not finished), and TO Requests (status of any clarification, resource, or update requests submitted). The workspace is the user's personal curation layer — it makes the Knowledge Centre feel personal and re-visitable.

### Stage 3 — TO Content Management
The TO Office receives knowledge content requests (clarification, resource, flag for update). A content manager reviews and responds: answering the clarification, providing the resource, or initiating a content review/update. New capability needed: receiving "Add new content" requests and publishing new items to the knowledge base.

## Current Implementation

| Stage | Component | What Exists | Status |
|-------|-----------|-------------|--------|
| Stage 1 | Four-tab content browser | Best Practices, Playbooks, Testimonials, Library tabs with card lists | ✅ Complete |
| Stage 1 | Knowledge item detail pages | Full content, tags, TO request options | ✅ Complete |
| Stage 1 | Login gate for save/request | LoginModal fires on save or TO request action | ✅ Present |
| Stage 1 | Hero gradient | Same blue gradient as Learning Centre (from-blue-50) | ⚠️ Non-distinctive |
| Stage 1 | Breadcrumb | Uses text-gray-600 instead of text-muted-foreground | ⚠️ Colour inconsistency |
| Stage 1 | LoginModal "Sign up" | Dead button | ❌ No onClick |
| Stage 1 | LoginModal description | Generic "enrollment" text | ⚠️ Wrong context |
| Stage 2 | Saved items view | getSavedKnowledgeIds, toggleSavedKnowledgeItem wired | ✅ Complete |
| Stage 2 | Reading history | getKnowledgeHistory, getContinueReading wired | ✅ Complete |
| Stage 2 | TO request tracking | addTORequest, getTORequests, updateTORequestStatus | ✅ Complete |
| Stage 2 | Mention notifications | getMentionNotifications, markMentionNotificationRead | ✅ Present |
| Stage 2 | Usage analytics | getKnowledgeUsageMetrics imported | ⚠️ Imported but unclear if rendered |
| Stage 2 | Contribution flow | Absent | ❌ Missing |
| Stage 2 | Staleness indicators | Absent | ❌ Missing |
| Stage 2 | Peer endorsement/upvote | Absent | ❌ Missing |
| Stage 2 | Connection to Learning Centre | Absent | ❌ Missing |
| Stage 3 | Knowledge Centre scope filter | Present | ✅ Present |
| Stage 3 | TO request handling | Receives and tracks KC requests | ✅ Present |
| Stage 3 | "Add New Content" request type | Absent | ❌ Missing |
| Stage 3 | Admin/curator analytics view | Absent | ❌ Missing |

## Gaps

**G1** — [Stage 1] Hero gradient is identical to Learning Centre (from-blue-50 to-white) — both marketplaces look the same in the hub view.

**G2** — [Stage 1] Breadcrumb uses text-gray-600 instead of the platform standard text-muted-foreground.

**G3** — [Stage 1] LoginModal "Sign up" button has no onClick.

**G4** — [Stage 1] LoginModal description is generic "enrollment" text for Knowledge Centre context.

**G5** — [Stage 1 + Stage 2] No contribution flow — users can consume knowledge but cannot submit new items. The Knowledge Centre will stagnate without practitioner contributions.

**G6** — [Stage 1] No staleness indicator on content items — a 2019 best practice may be dangerously outdated with no visual signal.

**G7** — [Stage 1] No peer endorsement/upvote on best practices — no social signal to distinguish highly validated content from untested submissions.

**G8** — [Stage 1 + Stage 2] No connection to Learning Centre — a user reading a playbook on cloud architecture is not shown the related Learning Centre course.

**G9** — [Stage 3] TO request types don't include "Add New Content" — there is no formal channel for users to request that a new knowledge item be created.

**G10** — [Stage 2] getKnowledgeUsageMetrics is imported but it is not confirmed whether usage analytics are rendered in the workspace. If not rendered, this data is wasted.

**G11** — [Stage 2] Default Stage 2 marketplace is hardcoded to "portfolio-management" — Knowledge Centre users navigating directly to /stage2 land on the wrong workspace.

## Recommendations

### R1 — Differentiate Knowledge Centre hero gradient

**File:** `src/pages/KnowledgeCenterPage.tsx`  
**Lines:** Hero `<section>` className

**Fix:**

```tsx
// Change from:
className="bg-gradient-to-b from-blue-50 to-white py-8 lg:py-12"

// To:
className="bg-gradient-to-b from-teal-50 to-white py-8 lg:py-12"
```

Also update the phase badge colour: `bg-teal-100 text-teal-700`.

### R2 — Fix breadcrumb colour consistency

**File:** `src/pages/KnowledgeCenterPage.tsx`  
**Lines:** Breadcrumb `<nav>` element

**Fix:**

```tsx
<nav className="flex items-center text-sm text-muted-foreground mb-4">
  <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
  <ChevronRight className="w-4 h-4 mx-2" />
  <Link to="/marketplaces" className="hover:text-foreground transition-colors">Marketplaces</Link>
  <ChevronRight className="w-4 h-4 mx-2" />
  <span className="font-medium text-foreground">Knowledge Centre</span>
</nav>
```

### R3 — Fix LoginModal "Sign up" button

See Learning Centre R5. Same fix, same file.

### R4 — Fix LoginModal context description for Knowledge Centre

See Learning Centre R6. The Knowledge Centre branch reads:

```tsx
: context.marketplace === "knowledge-center"
  ? "Log in to save this item to your Knowledge Centre workspace."
```

### R5 — Add contribution flow

**New file:** `src/pages/KnowledgeContributePage.tsx`  
**File:** `src/pages/KnowledgeCenterPage.tsx` — add "Contribute" CTA  
**File:** `src/data/knowledgeCenter/knowledgeItems.ts` — add addKnowledgeItem function

**Expected Outcome:** An authenticated user on the Knowledge Centre Stage 1 page sees a "Contribute Knowledge" button. Clicking it opens a form to submit a new best practice, playbook entry, or testimonial for TO review and publication.

**Contribution form fields:**

- Content Type: Best Practice | Playbook Entry | Testimonial | Reference Document
- Title (required)
- Category (select from existing categories)
- Summary (required, max 300 chars)
- Full Content (rich text or markdown, required)
- Tags (comma-separated)
- Source / Organisation (optional)
- Why this is relevant to DT programmes (required, max 200 chars)

**Stage 3 side:** When submitted, a Stage 3 request of type "knowledge-center" is created with action: "contribute". The TO content manager reviews, optionally edits, and publishes. On approval the item is added to knowledgeItems and tagged with contributedBy: userId and publishedAt: date.

### R6 — Add staleness indicators

**File:** `src/data/knowledgeCenter/knowledgeItems.ts`  
**Lines:** Each item in the knowledgeItems array

**Step 1** — Add lastReviewed: string (ISO date) and reviewCycleDays: number (default 365) to the knowledge item interface.

**Step 2** — Add a computed isStale field or utility:

```tsx
export function isKnowledgeItemStale(item: KnowledgeItem): boolean {
  if (!item.lastReviewed) return false;
  const daysSinceReview = (Date.now() - new Date(item.lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceReview > (item.reviewCycleDays ?? 365);
}
```

**Step 3** — On the knowledge item card, add a badge when stale:

```tsx
{isKnowledgeItemStale(item) && (
  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    Review recommended
  </span>
)}
```

### R7 — Add peer endorsement on best practices

**File:** `src/data/knowledgeCenter/knowledgeItems.ts`

**Step 1** — Add endorsements: number to the knowledge item interface and populate with seed values.

**Step 2** — Add endorseKnowledgeItem(itemId: string, userId: string) and hasUserEndorsed(itemId: string, userId: string) to a new endorsementState.ts in the knowledge center data folder.

**Step 3** — On the knowledge item card, add an endorsement button:

```tsx
<button
  onClick={(e) => { e.stopPropagation(); handleEndorse(item.id); }}
  className={`flex items-center gap-1 text-xs ${hasEndorsed ? "text-orange-600" : "text-gray-500 hover:text-orange-600"}`}
>
  <ThumbsUp className="w-3.5 h-3.5" />
  {item.endorsements + (hasEndorsed ? 1 : 0)} endorsed
</button>
```

### R8 — Surface related courses on knowledge item detail pages

**File:** `src/pages/KnowledgeCenterDetailPage.tsx`  
**Data:** `src/data/knowledgeCenter/knowledgeItems.ts` — add relatedCourseIds: string[] to items

**Fix:** At the bottom of the knowledge item detail page, add a "Deepen Your Knowledge" section:

```tsx
{relatedCourses.length > 0 && (
  <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
    <h3 className="font-semibold text-primary-navy mb-3">Deepen Your Knowledge</h3>
    <div className="space-y-2">
      {relatedCourses.map((course) => (
        <button
          key={course.id}
          onClick={() => navigate(`/marketplaces/learning-center/courses/${course.id}`)}
          className="flex items-center gap-3 w-full text-left p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium text-primary-navy">{course.courseName}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

### R9 — Fix Stage 2 default marketplace

**File:** `src/pages/Stage2AppPage.tsx`  
**Line:** 411

**Fix:**

```tsx
// Change:
marketplace: stateMarketplace = "portfolio-management",

// To:
marketplace: stateMarketplace = "overview",
```
