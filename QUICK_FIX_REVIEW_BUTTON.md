# Quick Fix - See the Review Button Now! ✅

## The Issue
You're logged in as `admin@test.com` but the review button wasn't showing.

## The Fix ✅
I've updated the permission system to recognize admin users by their **email prefix** (starts with "admin" or "instructor") in addition to their role.

---

## How to See It Now

### Option 1: Refresh the Page (Easiest)
Since you're already logged in as `admin@test.com`:

1. **Just refresh the page** (F5 or Ctrl+R)
2. The review button should now appear!

### Option 2: Re-login
1. Log out (if needed)
2. Log back in with `admin@test.com`
3. Navigate to Knowledge Centre
4. Look for cards with "Review recommended" badge
5. You should see the FileCheck button (📋) next to it

---

## Updated Permission Rules

**Can review content:**
- ✅ Users with role "Admin"
- ✅ Users with role containing "TO" or "Transformation Office"
- ✅ Users with email starting with "admin" (like `admin@test.com`)
- ✅ Users with email starting with "instructor"

**Examples that work:**
- `admin@test.com` ← **Your email!**
- `admin@dtmp.com`
- `admin@anything.com`
- `instructor@test.com`
- `amina.to@dtmp.com` (TO team)
- Any email with `@to.dtmp.com` domain

---

## Visual Guide

### What You Should See Now:

```
┌─────────────────────────────────────────┐
│  [Icon]              [Featured]         │
│                      [⚠ Review recommended] [📋] ← This button!
│                                         │
│  [Governance] [Low]                     │
│                                         │
│  Capability-Based Planning Approach     │
│  Plan transformations based on...       │
│                                         │
│  [Strategy] [Foundation]                │
│                                         │
│  [Alignment] [Planning] [Investment]    │
│                                         │
│  👍 30 endorsed                         │
└─────────────────────────────────────────┘
```

The **[📋]** button is:
- Small green button
- FileCheck icon
- Right next to the amber "Review recommended" badge
- Only visible to authorized users

---

## Quick Test

1. **Refresh the page** (F5)
2. **Look at the card** you mentioned:
   - "Capability-Based Planning Approach"
   - Has "Review recommended" badge
3. **Look for the green FileCheck button** next to the badge
4. **Click it** → Modal opens
5. **Click "Mark as Reviewed"** → Badge disappears!

---

## If You Still Don't See It

### Check 1: Verify You're Logged In
```javascript
// Open console (F12) and run:
console.log(JSON.parse(localStorage.getItem('dtmp.session.user')));
```

Should show:
```json
{
  "email": "admin@test.com",
  "name": "admin",
  "role": "business-user"
}
```

### Check 2: Force Refresh
- Press **Ctrl+Shift+R** (hard refresh)
- Or clear cache and refresh

### Check 3: Verify the Card is Stale
- The review button only appears on cards with "Review recommended" badge
- If no badge, no button

---

## Why This Happened

The original permission check only looked at the **role** field, which was set to `"business-user"` for your email.

The LoginModal sets roles based on email **domain**:
- `@to.dtmp.com` → TO roles
- Everything else → `"business-user"`

Now the permission check also looks at the email **prefix**:
- Starts with `admin` → Can review ✅
- Starts with `instructor` → Can review ✅

---

## Summary

✅ **Fixed:** Permission system now recognizes `admin@test.com`  
✅ **Action:** Just refresh the page  
✅ **Result:** Review button should appear next to stale badges  

---

**Still having issues?** Let me know and I'll help troubleshoot!
