# Knowledge Centre Content Review Workflow - Implementation Guide

## Overview

This document outlines the hybrid content review workflow implementation for the Knowledge Centre, allowing TO team members to review and update stale content efficiently.

---

## Implementation Approach: Hybrid Review System

### Design Philosophy
- **Quick path** for simple reviews (content still accurate)
- **Detailed path** for complex reviews (content needs updates)
- **Progressive disclosure** of complexity
- **Audit trail** for governance

---

## Phase 1: Quick Review on Cards ✅ IMPLEMENTED

### Features Implemented

#### 1. Review State Management
**File:** `src/data/knowledgeCenter/reviewState.ts`

**Key Functions:**
- `submitQuickReview()` - Submit quick "still accurate" review
- `submitDetailedReview()` - Submit detailed review with notes
- `getReviewHistory()` - Get all reviews for an item
- `getLatestReview()` - Get most recent review
- `canUserReview()` - Check if user has review permissions
- `getReviewStats()` - Get review statistics

**Data Model:**
```typescript
interface KnowledgeItemReview {
  id: string;
  itemId: string; // Format: "best-practices:bp-001"
  reviewedBy: string;
  reviewedByName: string;
  reviewedAt: string;
  outcome: "accurate" | "minor-updates" | "major-revision" | "deprecated";
  notes: string;
  sectionsReviewed?: string[];
  stage3RequestId?: string;
}
```

**Storage:** localStorage with key `dtmp.knowledgeCenter.reviews`

#### 2. Quick Review Modal Component
**File:** `src/components/knowledgeCenter/QuickReviewModal.tsx`

**Features:**
- Two-option modal for quick decisions
- Option 1: "Content is Still Accurate" (green)
  - Updates review date to today
  - Removes staleness indicator
  - One-click action
- Option 2: "Content Needs Updates" (amber)
  - Navigates to detail page
  - Opens detailed review form (Phase 2)
- Shows item title and last review date
- Calculates days since last review
- Backdrop click to close

**Visual Design:**
- Clean, modern modal with backdrop
- Color-coded options (green for accurate, amber for updates)
- Icon indicators (CheckCircle, AlertTriangle)
- Responsive layout

#### 3. Card Integration
**File:** `src/components/knowledgeCenter/BestPracticeCard.tsx`

**Changes:**
- Added FileCheck icon button next to staleness badge
- Only visible to users with review permissions
- Click opens QuickReviewModal
- Updates staleness state after review
- Integrates with existing endorsement system

**Permissions:**
- Only shown to users with roles:
  - Admin
  - TO Team
  - Content Owner
  - Transformation Office

#### 4. Staleness Detection Enhancement
**File:** `src/data/knowledgeCenter/knowledgeItems.ts`

**Updated Logic:**
```typescript
export function isKnowledgeItemStale(item: KnowledgeItem): boolean {
  // Check for recent review first
  const latestReview = getLatestReview(item.id);
  if (latestReview && latestReview.outcome === "accurate") {
    // Use review date instead of original lastReviewed
    const daysSinceReview = (Date.now() - new Date(latestReview.reviewedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceReview > (item.reviewCycleDays ?? 365);
  }
  
  // Fall back to original date
  const daysSinceReview = (Date.now() - new Date(item.lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceReview > (item.reviewCycleDays ?? 365);
}
```

**Benefits:**
- Reviews update the staleness calculation
- Accurate reviews extend the review cycle
- Maintains original date as fallback

---

## User Workflow (Phase 1)

### Scenario 1: Content Still Accurate

```
User browses Knowledge Centre
    ↓
Sees amber "Review recommended" badge on card
    ↓
Clicks FileCheck icon button (if authorized)
    ↓
Quick Review Modal opens
    ↓
Selects "Content is Still Accurate"
    ↓
Clicks "Mark as Reviewed"
    ↓
Review submitted, badge disappears
    ↓
Done! (2 clicks total)
```

### Scenario 2: Content Needs Updates

```
User browses Knowledge Centre
    ↓
Sees amber "Review recommended" badge on card
    ↓
Clicks FileCheck icon button (if authorized)
    ↓
Quick Review Modal opens
    ↓
Selects "Content Needs Updates"
    ↓
Clicks "Open Review Form"
    ↓
Navigates to detail page
    ↓
[Phase 2: Detailed review form]
```

---

## Technical Implementation Details

### State Management
- **Local State:** Modal visibility, submission status
- **localStorage:** Review history persistence
- **React State:** Staleness indicator updates

### Permission System
```typescript
const canUserReview = (userRole?: string): boolean => {
  if (!userRole) return false;
  const reviewerRoles = ["Admin", "TO Team", "Content Owner", "Transformation Office"];
  return reviewerRoles.some((role) => userRole.includes(role));
};
```

### Review ID Generation
```typescript
id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

### Date Formatting
```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return `${date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  })} (${diffDays} days ago)`;
};
```

---

## Files Modified/Created

### Created Files
1. `src/data/knowledgeCenter/reviewState.ts` - Review state management
2. `src/components/knowledgeCenter/QuickReviewModal.tsx` - Quick review modal

### Modified Files
1. `src/components/knowledgeCenter/BestPracticeCard.tsx` - Added review button
2. `src/data/knowledgeCenter/knowledgeItems.ts` - Enhanced staleness detection

---

## Phase 2: Detail Page Review Panel (PLANNED)

### Features to Implement
- Dedicated "Content Review" section on detail pages
- Review history timeline display
- Detailed review form with:
  - Review outcome dropdown
  - Notes text area
  - Sections reviewed checklist
  - Submit button
- Expandable review history
- Integration with Stage 3 requests

### Location
- Add to knowledge item detail pages
- Sidebar or dedicated tab
- Always visible to authorized users

---

## Phase 3: Stage 3 Integration (PLANNED)

### Features to Implement
- Auto-create Stage 3 requests for updates
- Pre-populate with review notes
- Link back to knowledge item
- Assign to content owner/TO team
- Track request status
- Update knowledge item when completed

### Workflow
```
User submits "Needs Updates" review
    ↓
System creates Stage 3 request
    ↓
Request assigned to content owner
    ↓
Content owner updates content
    ↓
Request marked complete
    ↓
Knowledge item updated
    ↓
Review cycle resets
```

---

## Phase 4: Notifications (PLANNED)

### Features to Implement
- Email notifications for review due dates
- Dashboard alerts for overdue reviews
- Notification when review submitted
- Notification when updates completed
- Weekly digest of pending reviews

---

## Testing Guide

### Test Scenario 1: Quick Review (Authorized User)
1. Log in as TO team member or admin
2. Navigate to Knowledge Centre marketplace
3. Find a card with "Review recommended" badge
4. Verify FileCheck icon button appears next to badge
5. Click FileCheck button
6. Verify Quick Review Modal opens
7. Verify item title and last review date display
8. Click "Mark as Reviewed"
9. Verify modal closes
10. Verify badge disappears from card
11. Refresh page - badge should still be gone

### Test Scenario 2: Quick Review (Unauthorized User)
1. Log in as regular user (non-TO)
2. Navigate to Knowledge Centre marketplace
3. Find a card with "Review recommended" badge
4. Verify FileCheck icon button does NOT appear
5. Badge should be visible but not actionable

### Test Scenario 3: Navigate to Detailed Review
1. Log in as TO team member
2. Click FileCheck button on stale card
3. Click "Open Review Form" in modal
4. Verify navigation to detail page
5. [Phase 2: Verify review form appears]

### Test Scenario 4: Review History
1. Submit multiple reviews for same item
2. Check localStorage: `dtmp.knowledgeCenter.reviews`
3. Verify all reviews are stored
4. Verify most recent review affects staleness

---

## Data Persistence

### localStorage Structure
```json
{
  "dtmp.knowledgeCenter.reviews": [
    {
      "id": "review-1234567890-abc123",
      "itemId": "best-practices:bp-001",
      "reviewedBy": "john.doe@company.com",
      "reviewedByName": "John Doe",
      "reviewedAt": "2024-01-15T10:30:00.000Z",
      "outcome": "accurate",
      "notes": "Quick review: Content verified as still accurate"
    }
  ]
}
```

---

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading:** Modal only renders when opened
2. **Memoization:** Review history cached per item
3. **Debouncing:** Prevent double-submissions
4. **localStorage Limits:** Monitor storage size
5. **Batch Operations:** Future enhancement for bulk reviews

---

## Security Considerations

### Permission Checks
- Server-side validation (future)
- Client-side role checking
- Audit trail of all reviews
- User identification required

### Data Validation
- Required fields enforced
- Date validation
- Outcome enum validation
- XSS prevention in notes

---

## Accessibility

### WCAG Compliance
- Keyboard navigation support
- Focus management in modal
- ARIA labels on buttons
- Color contrast ratios met
- Screen reader announcements

---

## Future Enhancements

### Potential Features
1. **Bulk Review:** Review multiple items at once
2. **Review Templates:** Pre-defined review notes
3. **Review Reminders:** Automated email reminders
4. **Review Dashboard:** TO team review queue
5. **Review Analytics:** Track review velocity
6. **Review Delegation:** Assign reviews to team members
7. **Review Approval:** Two-stage review process
8. **Review Comments:** Discussion threads on reviews
9. **Review Notifications:** Real-time updates
10. **Review Export:** Download review history

---

## Metrics to Track

### Success Metrics
- Number of reviews submitted per week
- Average time to review
- Percentage of stale content
- Review completion rate
- User satisfaction with review process

### Technical Metrics
- Modal open rate
- Quick review vs detailed review ratio
- Review submission success rate
- localStorage usage
- Performance impact

---

## Rollout Plan

### Phase 1 (Current)
- ✅ Quick review on cards
- ✅ Review state management
- ✅ Permission system
- ✅ Staleness integration

### Phase 2 (Next)
- Detail page review panel
- Review history display
- Detailed review form
- Section-level review tracking

### Phase 3 (Future)
- Stage 3 integration
- Auto-request creation
- Status tracking
- Update workflow

### Phase 4 (Future)
- Notification system
- Email alerts
- Dashboard integration
- Analytics

---

## Support & Maintenance

### Known Issues
- None currently

### Troubleshooting
- **Badge not disappearing:** Check localStorage permissions
- **Modal not opening:** Verify user role
- **Review not saving:** Check browser console for errors

### Contact
- Technical questions: Development team
- Process questions: TO team
- Bug reports: Issue tracker

---

**Implementation Date:** 2024
**Status:** Phase 1 Complete ✅
**Next Phase:** Detail Page Review Panel
