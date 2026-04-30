# 🎯 HOW TO SEE THE PRIORITY ESCALATION FEATURE

## Quick Access (Test Page)

### Step 1: Start the app
```bash
cd /home/karen/Documents/DQ/DTMP/DQ_Prod_DTMP_v3
npm run dev
```

### Step 2: Open in browser
Navigate to:
```
http://localhost:5173/test/priority-escalation
```

### Step 3: Test the feature
1. You'll see 4 build requests
2. Click on any request to select it
3. Look at the **3 stat cards** (Progress, Type, Priority)
4. In the **Priority card** (3rd card), you'll see a **trending-up arrow icon (↗)**
5. **Click the icon**
6. Enter a reason like: "Testing priority escalation"
7. Click OK
8. Watch the priority change!
9. Scroll down to see the new message in the audit trail

---

## Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│  Priority Escalation Feature Test                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Instructions Box]                                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Request 1    │  │ Request 2    │  ← Click to select │
│  │ Priority: med│  │ Priority: low│                     │
│  └──────────────┘  └──────────────┘                    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Selected Request Details                         │   │
│  │                                                  │   │
│  │  ┌─────────┬─────────┬──────────────┐          │   │
│  │  │Progress │  Type   │ Priority  ↗  │ ← CLICK! │   │
│  │  │  75%    │ Custom  │   medium     │          │   │
│  │  └─────────┴─────────┴──────────────┘          │   │
│  │                                                  │   │
│  │  Messages & Audit Trail:                        │   │
│  │  ┌──────────────────────────────────────────┐  │   │
│  │  │ [ESCALATION] Priority escalated from... │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## What You'll See

### Before Escalation:
- Priority: **medium** (yellow)
- Messages: 2 messages

### After Clicking Icon:
- Prompt appears asking for reason
- Enter: "Testing priority escalation"
- Click OK

### After Escalation:
- Priority: **high** (orange)
- Messages: 3 messages
- New message highlighted in orange with **[ESCALATION]** badge
- Message shows: "[timestamp] Priority escalated from medium to high by Test User: Testing priority escalation"

---

## Features to Notice

1. **Icon Visibility**: Icon only shows if priority < critical
2. **Hover Effect**: Icon turns orange when you hover
3. **Validation**: Can't submit empty reason
4. **Immediate Update**: Priority changes without page refresh
5. **Audit Trail**: New message appears in orange box
6. **Badge**: [ESCALATION] badge on escalation messages
7. **Timestamp**: Full date/time of escalation
8. **Reason**: Your reason is logged

---

## Try These Tests

### Test 1: Basic Escalation
- Select "Customer 360 Data Platform"
- Current priority: medium
- Click ↗ icon
- Enter: "CEO needs this urgently"
- Result: Priority → high

### Test 2: Multiple Escalations
- Select same request again
- Current priority: high (from Test 1)
- Click ↗ icon again
- Enter: "Production outage"
- Result: Priority → critical
- Notice: Icon disappears (already at max)

### Test 3: Already Critical
- Select a request with critical priority
- Notice: No ↗ icon visible
- This is correct behavior!

---

## Troubleshooting

### "I don't see the page"
- Make sure app is running: `npm run dev`
- Check URL: `http://localhost:5173/test/priority-escalation`
- Try refreshing the page

### "Icon doesn't appear"
- Check if priority is already "critical"
- Try selecting a different request
- Refresh the page

### "Nothing happens when I click"
- Check browser console (F12) for errors
- Make sure you entered a reason
- Try a different browser

---

## Production Location

Once you've tested it, the same feature is available in the real workspace at:

**URL**: `/stage2?marketplace=solution-build`

**Steps**:
1. Click "Access Platform" in header
2. Login
3. Navigate to Solution Build
4. Click "My Requests"
5. Select a request
6. Same ↗ icon in Priority card

---

## Summary

**Test URL**: `http://localhost:5173/test/priority-escalation`

**What to do**: Click the ↗ icon in the Priority card

**What you'll see**: Priority increases + audit message added

**Perfect for demo**: Clean, simple, shows the feature clearly! 🚀
