# How to See the Review Feature in the UI - Step-by-Step Guide

## Prerequisites

### 1. Set Your User Role to Admin or TO Team
You need to be logged in as an Admin or TO team member to see the review feature.

**Option A: Use Browser Console**
```javascript
// Open browser console (F12) and run:
localStorage.setItem('dtmp.session.authenticated', 'true');
localStorage.setItem('dtmp.session.user', JSON.stringify({
  email: 'admin@dtmp.com',
  name: 'Admin User',
  role: 'Admin'
}));

// OR for TO team member:
localStorage.setItem('dtmp.session.user', JSON.stringify({
  email: 'amina.to@dtmp.com',
  name: 'Amina TO',
  role: 'Transformation Office'
}));

// Then refresh the page
location.reload();
```

**Option B: Login via LoginModal**
- Click any "Enroll" or "Request" button
- In the login modal, use email: `admin@dtmp.com` or `amina.to@dtmp.com`
- The system will set your role automatically

---

## Step-by-Step: Finding the Review Feature

### Step 1: Navigate to Knowledge Centre
1. Go to the homepage
2. Click "Marketplaces" in the navigation
3. Click "Knowledge Center" card
4. **OR** directly navigate to: `/marketplaces/knowledge-center`

### Step 2: Look for Stale Content
On the Knowledge Centre marketplace page, look for cards with:
- **Amber badge** that says "Review recommended" with an AlertCircle icon
- This badge appears on content that hasn't been reviewed in 365+ days

**Visual Example:**
```
┌─────────────────────────────────────────┐
│  [Icon]              [Featured]         │
│                      [⚠ Review recommended] [📋] ← REVIEW BUTTON
│                                         │
│  [Domain Badge] [Complexity Badge]      │
│                                         │
│  API-First Architecture Best Practice   │
│  Implement API-first design patterns... │
│                                         │
│  [Tag] Category  [↗] Maturity Level    │
│                                         │
│  [Impact Areas...]                      │
│                                         │
│  👍 45 endorsed                         │
└─────────────────────────────────────────┘
```

### Step 3: Identify the Review Button
Next to the amber "Review recommended" badge, you'll see:
- **Small green button** with a FileCheck icon (📋)
- Only visible if you're logged in as Admin or TO team member
- Hover shows "Quick Review" tooltip

**What it looks like:**
```
[⚠ Review recommended] [📋]
     ↑                  ↑
  Staleness badge    Review button (Admin/TO only)
```

### Step 4: Click the Review Button
Click the FileCheck icon button to open the Quick Review Modal

---

## The Quick Review Modal

### What You'll See

```
┌──────────────────────────────────────────────┐
│  Review Content                          [X] │
├──────────────────────────────────────────────┤
│  Quick review options                        │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  API-First Architecture Best Practice  │ │
│  │  Last reviewed: Jan 15, 2023           │ │
│  │  (642 days ago)                        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  ✓ Content is Still Accurate           │ │
│  │    Updates review date to today and    │ │
│  │    removes staleness indicator         │ │
│  │                                        │ │
│  │    [Mark as Reviewed]                  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  ⚠ Content Needs Updates               │ │
│  │    Opens detailed review form to       │ │
│  │    document required changes           │ │
│  │                                        │ │
│  │    [Open Review Form]                  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│                              [Cancel]        │
└──────────────────────────────────────────────┘
```

### Option 1: Mark as Reviewed
1. Click the green **"Mark as Reviewed"** button
2. Modal closes
3. The amber "Review recommended" badge **disappears** from the card
4. Review is saved to localStorage
5. Badge won't reappear for another 365 days

### Option 2: Open Review Form
1. Click the amber **"Open Review Form"** button
2. Modal closes
3. You're navigated to the detail page
4. (Phase 2: Detailed review form will appear here)

---

## Testing the Feature

### Quick Test Flow

1. **Set up user role:**
   ```javascript
   // In browser console (F12)
   localStorage.setItem('dtmp.session.authenticated', 'true');
   localStorage.setItem('dtmp.session.user', JSON.stringify({
     email: 'admin@dtmp.com',
     name: 'Admin User',
     role: 'Admin'
   }));
   location.reload();
   ```

2. **Navigate to Knowledge Centre:**
   - Go to `/marketplaces/knowledge-center`

3. **Find a stale card:**
   - Look for amber "Review recommended" badge
   - Should see FileCheck button next to it

4. **Click review button:**
   - Modal opens

5. **Mark as reviewed:**
   - Click "Mark as Reviewed"
   - Badge disappears

6. **Verify persistence:**
   - Refresh the page
   - Badge should still be gone

---

## Troubleshooting

### "I don't see the review button"

**Check 1: Are you logged in?**
```javascript
// In console:
console.log(localStorage.getItem('dtmp.session.authenticated'));
// Should return: "true"
```

**Check 2: What's your role?**
```javascript
// In console:
console.log(JSON.parse(localStorage.getItem('dtmp.session.user')));
// Should show role: "Admin" or role containing "TO"
```

**Check 3: Is there stale content?**
- The review button only appears on cards with "Review recommended" badge
- If no stale content, you won't see any review buttons

**Fix: Force a card to be stale**
```javascript
// In console - this will make all best practices appear stale:
const reviews = JSON.parse(localStorage.getItem('dtmp.knowledgeCenter.reviews') || '[]');
// Clear all reviews to reset staleness
localStorage.setItem('dtmp.knowledgeCenter.reviews', '[]');
location.reload();
```

### "The badge didn't disappear after review"

**Check localStorage:**
```javascript
// In console:
console.log(JSON.parse(localStorage.getItem('dtmp.knowledgeCenter.reviews')));
// Should show your review
```

**Try refreshing:**
- Sometimes state needs a page refresh to update
- Press F5 or Ctrl+R

### "I'm logged in as regular user"

**Switch to Admin:**
```javascript
// In console:
localStorage.setItem('dtmp.session.user', JSON.stringify({
  email: 'admin@dtmp.com',
  name: 'Admin User',
  role: 'Admin'
}));
location.reload();
```

---

## Where to Find Stale Content

### Best Practices Tab
- Navigate to Knowledge Centre
- Click "Best Practices" tab
- Look for cards with amber badges

### Current Stale Items
Based on the seed data, items with `lastReviewed` dates from early 2023 will show as stale:
- Most best practices are seeded with dates ~365+ days ago
- These will automatically show the "Review recommended" badge

---

## Visual Indicators

### For Admin/TO Users (Can Review)
```
Card with stale content:
┌─────────────────────────────────┐
│  [Icon]    [⚠ Review recommended] [📋] ← You see this
│  ...                             │
└─────────────────────────────────┘
```

### For Regular Users (Cannot Review)
```
Card with stale content:
┌─────────────────────────────────┐
│  [Icon]    [⚠ Review recommended]     ← No button
│  ...                             │
└─────────────────────────────────┘
```

---

## Review Data Storage

### Check Your Reviews
```javascript
// In browser console:
const reviews = JSON.parse(localStorage.getItem('dtmp.knowledgeCenter.reviews') || '[]');
console.table(reviews);
```

### Review Data Structure
```javascript
{
  id: "review-1234567890-abc123",
  itemId: "best-practices:bp-001",
  reviewedBy: "admin@dtmp.com",
  reviewedByName: "Admin User",
  reviewedAt: "2024-01-15T10:30:00.000Z",
  outcome: "accurate",
  notes: "Quick review: Content verified as still accurate"
}
```

---

## Quick Demo Script

### 5-Minute Demo

1. **Setup (30 seconds)**
   - Open browser console (F12)
   - Set admin role
   - Refresh page

2. **Navigate (30 seconds)**
   - Go to Knowledge Centre
   - Click Best Practices tab

3. **Find Stale Content (1 minute)**
   - Scroll through cards
   - Look for amber badges
   - Identify review button

4. **Review Content (1 minute)**
   - Click review button
   - Modal opens
   - Click "Mark as Reviewed"
   - Badge disappears

5. **Verify (1 minute)**
   - Refresh page
   - Badge still gone
   - Check localStorage for review

6. **Show Permissions (1 minute)**
   - Log out or switch to regular user
   - Show review button disappears
   - Badge remains visible

---

## Next Steps

### Phase 2 (Coming Soon)
- Detail page review panel
- Review history display
- Detailed review form with notes
- Section-level review tracking

### Phase 3 (Future)
- Stage 3 integration
- Auto-create update requests
- Track update status

---

## Support

**Questions?**
- Check `REVIEW_WORKFLOW_PHASE1_COMPLETE.md` for full documentation
- Check `KNOWLEDGE_CENTER_REVIEW_WORKFLOW.md` for technical details

**Found a bug?**
- Check browser console for errors
- Verify localStorage permissions
- Check user role and authentication

---

**Quick Access URLs:**
- Knowledge Centre: `/marketplaces/knowledge-center`
- Best Practices: `/marketplaces/knowledge-center?tab=best-practices`
- Testimonials: `/marketplaces/knowledge-center?tab=testimonials`
- Playbooks: `/marketplaces/knowledge-center?tab=playbooks`

**Console Commands:**
```javascript
// Set Admin role
localStorage.setItem('dtmp.session.user', JSON.stringify({email: 'admin@dtmp.com', name: 'Admin User', role: 'Admin'}));

// Check reviews
console.table(JSON.parse(localStorage.getItem('dtmp.knowledgeCenter.reviews') || '[]'));

// Clear reviews (reset staleness)
localStorage.setItem('dtmp.knowledgeCenter.reviews', '[]');

// Reload
location.reload();
```
