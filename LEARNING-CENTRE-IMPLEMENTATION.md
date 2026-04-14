# 1. LEARNING CENTRE

## Purpose

Enable platform users to build digital transformation capability through structured, self-paced learning — from course discovery and enrolment through active module-by-module learning, quiz assessment, learning track completion, and professional certification.

## Story

### Stage 1 — Discovery & Enrolment
A user arrives at the Learning Centre and browses available courses by category (foundations, technical, leadership, governance) and difficulty level. They read course detail pages showing the curriculum, instructor, duration, and learner reviews. They discover learning tracks — curated sequences of courses aligned to specific transformation roles such as "Digital Architect" or "Change Lead". When they find a course or track they want to pursue, they click "Enrol". If they are not logged in, the Login Modal fires. After authentication they land in their Stage 2 workspace.

### Stage 2 — Active Learning Workspace (Learner)
The user's personal Learning Centre workspace. They see all enrolled courses in the sidebar. For each course: a module-by-module view with lesson content, a quiz player with attempt tracking and pass/fail logic, a progress tracker showing completion percentage and estimated time remaining, downloadable resources, and a certificate view that activates on track completion. The workspace is the daily learning environment — every time the user returns, they pick up where they left off.

### Stage 2 — Course Management (Course Owner/Admin)
A course owner switches to the admin view from the profile menu. They see enrollment metrics, monthly enrollment and completion trends, a completion funnel, performance analytics (quiz scores, average completion rate), the course content structure, and a settings panel. Any settings changes (course title, enrollment type, pass score, completion requirements, notifications) are staged as a draft. When the owner is ready, they submit the change set to the TO Office for approval. The TO reviews the before/after diff and approves or rejects.

### Stage 3 — TO Oversight
The TO Office receives course change requests from course owners. They see the full before/after diff of the proposed settings change, can add review notes, and approve or reject. On approval, the settings change takes effect and the course owner is notified in Stage 2. Future additions: enrollment oversight per division, mandate compliance tracking, content quality flags from learner feedback.

## Current Implementation

| Stage | Component | What Exists | Status |
|-------|-----------|-------------|--------|
| Stage 1 | Course catalogue | Courses tab with CourseCard, difficulty/duration/rating display, pagination | ✅ Complete |
| Stage 1 | Learning Tracks tab | LearningTrackCard with required courses list and enrol CTA | ✅ Complete |
| Stage 1 | Reviews tab | ReviewCard display with ratings and text | ⚠️ Display only — no onClick, no navigation |
| Stage 1 | Course detail page | LearningCenterDetailPage with overview, modules, resources, reviews, documents tabs | ✅ Mostly complete |
| Stage 1 | Enrolment login gate | LoginModal fires on enrol with learning-center context | ✅ Present |
| Stage 1 | Documents tab download button | Download icon button renders | ❌ console.log only — no download |
| Stage 1 | Back button on detail page | Absent | ❌ Missing |
| Stage 1 | LoginModal "Sign up" button | Renders | ❌ No onClick — dead |
| Stage 1 | LoginModal description text | Shows "enrollment" for all contexts | ⚠️ Context-unaware |
| Stage 2 | Learner workspace | UserOverviewTab, UserModulesTab (QuizPlayer), UserProgressTab, UserResourcesTab, UserCertificateTab | ✅ Complete and well-built |
| Stage 2 | Admin/course owner workspace | AdminOverviewTab (recharts trends + funnel), AdminEnrollmentsTab, AdminPerformanceTab, AdminContentTab, AdminSettingsTab | ✅ Complete and well-built |
| Stage 2 | Profile switcher (learner ↔ admin) | Present in profile dropdown, gated by canAccessAdminView | ✅ Present but unreachable from Stage 1 |
| Stage 2 | Draft change management | upsertLearningDraftChangeSet, buildLearningSettingDiffs, submitLearningDraftChangeSet | ✅ Complete |
| Stage 2 | Sub-service description encoding | Mojibake • instead of bullet point | ❌ Encoding bug |
| Stage 2 | Learning Centre sidebar icon | Headphones icon (same as Support Services) | ❌ Wrong icon |
| Stage 2 | Review writing from workspace | Absent | ❌ Missing |
| Stage 2 | Discussion/Q&A layer | Absent | ❌ Missing |
| Stage 3 | Learning Centre scope filter | Present | ✅ Complete |
| Stage 3 | Course change request review | Before/after diff display, approve/reject with notes | ✅ Complete |
| Stage 3 | Enrollment records | Absent — enrolments are not visible in TO Office | ❌ Missing |
| Stage 3 | Mandate compliance tracking | Absent | ❌ Missing |
| Stage 3 | Learner feedback escalation | Absent | ❌ Missing |

## Gaps

**G1** — [Stage 1] No entry point from Stage 1 for course owners to navigate to admin view. The admin view is fully built in Stage 2 but there is no "Manage this Course" button on the Stage 1 detail page that would set `learningRole: "admin"` in navigation state.

**G2** — [Stage 1] ReviewCard has no onClick handler and no cursor-pointer styling — it is the only card type in the entire platform that is non-navigable.

**G3** — [Stage 1] LearningCenterDetailPage has no back button. Every other well-implemented detail page has one.

**G4** — [Stage 1] Documents tab Download button calls `console.log` only — no download occurs.

**G5** — [Stage 1] LoginModal "Sign up" button has no onClick handler — clicking it produces no response.

**G6** — [Stage 1] LoginModal description text says "Please log in to continue with your enrollment" regardless of marketplace context.

**G7** — [Stage 2] Mojibake encoding in learningSubServices course descriptions — • renders instead of •.

**G8** — [Stage 2] Learning Centre sidebar icon is `Headphones` — same as Support Services. Should be `BookOpen`.

**G9** — [Stage 2] No entry point from Stage 1 sets `learningRole: "admin"` — course owners cannot reach admin view through normal platform navigation.

**G10** — [Stage 2] Users who complete a course cannot write a new review from within Stage 2. The review loop is broken — learners complete, earn certificates, but have no in-platform way to share feedback.

**G11** — [Stage 2] No discussion or Q&A layer inside courses. No peer learning, no instructor-learner dialogue.

**G12** — [Stage 3] Enrolment records are not created as Stage 3 requests — the TO Office cannot see who is enrolling in what, at what volume, or by which division.

**G13** — [Stage 3] No mandatory learning assignment mechanism — no way to model "all staff in this role must complete X track by this date" and track compliance.

**G14** — [Stage 3] Learning completion has no downstream effect in other marketplaces — completing a track creates no capability badge or signal that surfaces elsewhere.

**G15** — [Cross-stage] Learning Centre is entirely disconnected from the Knowledge Centre — there are no "related articles" on course detail pages and no "related courses" on knowledge item detail pages.

## Recommendations

### R1 — Add "Manage this Course" entry point on Stage 1 detail page

**File:** `src/pages/LearningCenterDetailPage.tsx`  
**Lines:** After the enrol button section (approximately lines 320–340)

**Problem:** Course owners have no way to reach admin view from the normal platform flow.

**Expected Outcome:** An authenticated course owner sees a "Manage this Course" button on the course detail page. Clicking it navigates to Stage 2 with `learningRole: "admin"` in state.

**Fix:**

```tsx
// LearningCenterDetailPage.tsx — after the enrol button, inside the CTA section

{isUserAuthenticated() && course.instructor === getSessionUser()?.name && (
  <Button
    variant="outline"
    className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
    onClick={() => navigate(`/stage2/learning-center/course/${course.id}/admin`, {
      state: {
        marketplace: "learning-center",
        learningRole: "admin",
        cardId: course.id,
        serviceName: course.courseName,
      }
    })}
  >
    <Settings className="w-4 h-4" />
    Manage this Course
  </Button>
)}
```

Add `Settings` to lucide-react imports. Add a `getSessionUser()` helper to `src/data/sessionAuth.ts` that returns the currently authenticated user object.

### R2 — Make ReviewCard navigable

**Files:**
- `src/components/learningCenter/ReviewCard.tsx` — add `onClick` prop and hover styles
- `src/pages/LearningCenterPage.tsx` — lines ~601 — pass `onClick` to ReviewCard

**Problem:** ReviewCard is the only non-navigable card in the platform.

**Expected Outcome:** Clicking a ReviewCard navigates to `/marketplaces/learning-center/reviews/:reviewId`.

**Fix — ReviewCard.tsx:**

```tsx
interface ReviewCardProps {
  review: Review;
  onClick: () => void;
}

export function ReviewCard({ review, onClick }: ReviewCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* existing card content unchanged */}
      {/* Update the Helpful button to stop propagation: */}
      <button
        onClick={(e) => { e.stopPropagation(); /* helpful vote logic */ }}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
      >
        Helpful
      </button>
    </div>
  );
}
```

**Fix — LearningCenterPage.tsx, line ~601:**

```tsx
{pagedReviews.map((review) => (
  <ReviewCard
    key={review.id}
    review={review}
    onClick={() => navigate(`/marketplaces/learning-center/reviews/${review.id}`)}
  />
))}
```

### R3 — Add back button to LearningCenterDetailPage

**File:** `src/pages/LearningCenterDetailPage.tsx`  
**Lines:** After closing `</nav>` of the breadcrumb (approximately line 148)

**Fix:**

```tsx
<div className="mt-3 mb-6">
  <button
    type="button"
    onClick={() => navigate(`/marketplaces/learning-center?tab=${tab}`)}
    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
  >
    <ArrowLeft className="w-4 h-4" />
    Back to {tab === "courses" ? "Courses" : tab === "learning-tracks" ? "Learning Tracks" : "Reviews"}
  </button>
</div>
```

Add `ArrowLeft` to the lucide-react import.

### R4 — Fix Documents tab Download button

**File:** `src/pages/LearningCenterDetailPage.tsx`  
**Lines:** ~455–462

**Fix:**

```tsx
<Button
  variant="ghost"
  size="icon"
  className="text-orange-600 hover:text-orange-700"
  onClick={(e) => {
    e.stopPropagation();
    if ((doc as any).url) {
      window.open((doc as any).url, "_blank", "noopener,noreferrer");
    } else {
      alert("This material will be available after enrollment is confirmed.");
    }
  }}
  aria-label={`Download ${doc.name}`}
>
  <Download className="w-5 h-5" />
</Button>
```

### R5 — Fix LoginModal "Sign up" dead button (applies to all marketplaces)

**File:** `src/components/learningCenter/LoginModal.tsx`  
**Line:** 262

**Fix:**

```tsx
<button
  onClick={() => alert("Self-registration is managed by your organisation. Contact your DTMP administrator to request access.")}
  className="text-orange-600 hover:text-orange-700 font-medium"
>
  Sign up
</button>
```

### R6 — Fix LoginModal description text to be context-aware (applies to all marketplaces)

**File:** `src/components/learningCenter/LoginModal.tsx`  
**Lines:** 209–217

**Fix:**

```tsx
<p className="text-base text-muted-foreground text-center mb-8">
  {context.marketplace === "learning-center"
    ? "Please log in to continue with your enrollment."
    : context.marketplace === "knowledge-center"
      ? "Log in to save this item to your Knowledge Centre workspace."
      : context.marketplace === "solution-specs"
        ? `Log in to request the specification package for "${context.serviceName}".`
        : context.marketplace === "solution-build"
          ? `Log in to request deployment of "${context.serviceName}".`
          : context.marketplace === "digital-intelligence"
            ? `Log in to request access to "${context.dashboardName || context.serviceName}".`
            : context.marketplace === "support-services"
              ? `Log in to submit a support request for "${context.serviceName}".`
              : context.marketplace === "portfolio-management"
                ? "Log in to track and manage this portfolio request."
                : context.marketplace === "document-studio" || context.marketplace === "templates"
                  ? `Log in to request an AI-generated document for "${context.serviceName}".`
                  : "Log in to access this service."}
</p>
```

### R7 — Fix mojibake encoding in learningSubServices descriptions

**File:** `src/pages/Stage2AppPage.tsx`  
**Line:** 953

**Fix:**

```tsx
description: `${course.instructor} \u2022 ${course.duration} \u2022 ${course.progress}% complete`,
```

### R8 — Fix Learning Centre sidebar icon

**File:** `src/pages/Stage2AppPage.tsx`  
**Line:** 1768

**Fix:**

```tsx
<BookOpen className="w-4 h-4 flex-shrink-0" /> {/* was: Headphones */}
```

`BookOpen` is already imported at the top of Stage2AppPage.tsx.

### R9 — Add "Leave a Review" flow in Stage 2 after course completion

**File:** `src/components/learningCenter/stage2/user/UserCertificateTab.tsx`  
**Lines:** After the certificate download section

**Expected Outcome:** A learner who has completed a course sees a "Share Your Experience" card prompting them to rate the course and write a review. On submission the review is added to `src/data/learningCenter/reviews.ts` and surfaces on the Stage 1 reviews tab.

**Fix:**

**Step 1** — Add a `addReview(review: Review)` function to `src/data/learningCenter/reviews.ts` that pushes a new review into the `reviews` array.

**Step 2** — In `UserCertificateTab.tsx`, add after the certificate card:

```tsx
{course.status === "completed" && !hasSubmittedReview && (
  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mt-4">
    <h3 className="font-semibold text-primary-navy mb-1">Share Your Experience</h3>
    <p className="text-sm text-muted-foreground mb-4">
      You've completed this course. Your feedback helps other learners.
    </p>
    <StarRatingInput value={reviewRating} onChange={setReviewRating} />
    <Textarea
      className="mt-3"
      placeholder="What did you find most valuable? What would you improve?"
      value={reviewText}
      onChange={(e) => setReviewText(e.target.value)}
    />
    <Button
      className="mt-3 bg-orange-600 hover:bg-orange-700 text-white"
      onClick={handleSubmitReview}
    >
      Submit Review
    </Button>
  </div>
)}
```

### R10 — Add enrollment records to Stage 3

**File:** `src/components/learningCenter/LoginModal.tsx`  
**Lines:** 90–108 (learning-center branch inside handleSubmit)  
**Also:** `src/pages/Stage3AppPage.tsx` — Stage3Scope type and scope filter UI

**Fix — LoginModal.tsx, inside learning-center branch, after navigate call:**

```tsx
import { createStage3Request } from "@/data/stage3";

createStage3Request({
  type: "learning-center",
  marketplace: "learning-center",
  cardId: context.cardId || "",
  serviceName: context.serviceName || "Course Enrollment",
  requesterEmail: email,
  requesterName: email.split("@")[0],
  status: "submitted",
  description: `Enrollment request for: ${context.serviceName}`,
});
```

### R11 — Add capability badges from learning track completion

**File:** `src/data/learningCenter/pathCertificates.ts`  
**New file:** `src/data/learningCenter/capabilityBadges.ts`

**Expected Outcome:** When a user completes a learning track, a capability badge is added to their profile. This badge is visible in Stage 2 and referenced in Solution Specs ("Recommended prerequisite: Cloud Architecture Fundamentals track completed").

**Fix:**

**Step 1** — Create `src/data/learningCenter/capabilityBadges.ts`:

```tsx
export interface CapabilityBadge {
  id: string;
  trackId: string;
  trackTitle: string;
  badgeLabel: string;
  earnedAt: string;
  userId: string;
}

const earnedBadges: CapabilityBadge[] = [];

export function awardCapabilityBadge(userId: string, trackId: string, trackTitle: string): CapabilityBadge {
  const badge: CapabilityBadge = {
    id: `badge-${trackId}-${userId}`,
    trackId,
    trackTitle,
    badgeLabel: trackTitle,
    earnedAt: new Date().toISOString(),
    userId,
  };
  earnedBadges.push(badge);
  return badge;
}

export function getCapabilityBadgesForUser(userId: string): CapabilityBadge[] {
  return earnedBadges.filter((b) => b.userId === userId);
}
```

**Step 2** — Call `awardCapabilityBadge` when a track's `status` transitions to `"completed"` in the track progress engine.

**Step 3** — Surface earned badges in the UserCertificateTab and in the Stage 2 profile section header.
