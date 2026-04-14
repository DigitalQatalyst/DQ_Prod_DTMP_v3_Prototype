# How to View Priority Escalation in the UI

## 🎯 Where to Find It

### Step 1: Navigate to Solution Build Workspace
1. Go to the app in your browser
2. Click **"Access Platform"** in the header
3. Login (if needed)
4. Navigate to **Solution Build** from the sidebar
5. Click on **"My Requests"** or **"Workspace"**

### Step 2: Select a Build Request
- You'll see a list of build requests on the left
- Click on any request to view its details

### Step 3: Look for the Priority Card
In the main detail panel, you'll see 3 stat cards at the top:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│  Progress   │  │    Type     │  │    Priority  ↗  │  ← Look here!
│    75%      │  │   Custom    │  │     high        │
└─────────────┘  └─────────────┘  └─────────────────┘
```

### Step 4: Click the Escalation Icon
- In the **Priority** card (3rd card), you'll see a small **trending up arrow icon** (↗) in the top-right corner
- This icon only appears if the priority is NOT already "critical"
- Hover over it - it will turn orange
- Click it to escalate

### Step 5: Provide Reason
- A prompt will appear asking for the reason
- Enter something like: "CEO requested for board meeting"
- Click OK

### Step 6: See the Result
- Priority will update immediately (e.g., medium → high)
- A success message will appear
- Scroll down to "Team & Communication" section
- You'll see a new message with the escalation details

---

## 🎨 Visual Location

```
┌─────────────────────────────────────────────────────────────┐
│  Solution Build Workspace                                    │
├──────────────┬──────────────────────────────────────────────┤
│              │  Customer 360 Data Platform                   │
│  [Requests]  │  ┌─────────┬─────────┬──────────────┐        │
│              │  │Progress │  Type   │ Priority  ↗  │ ← HERE │
│  • Request 1 │  │  75%    │ Custom  │   high       │        │
│  • Request 2 │  └─────────┴─────────┴──────────────┘        │
│  • Request 3 │                                               │
│              │  [Stage Card]                                 │
│              │  [Phase Timeline]                             │
│              │  [Business Need]                              │
│              │  [Team & Communication] ← Escalation appears  │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 🧪 Quick Test

### Test with Existing Request:

1. Navigate to Solution Build Workspace
2. Select "Customer 360 Data Platform" (or any request)
3. Check current priority (probably "high" or "medium")
4. Click the ↗ icon in the Priority card
5. Enter reason: "Testing priority escalation feature"
6. Click OK
7. Watch priority change
8. Scroll down to see the new message

### Expected Behavior:

**Before:**
- Priority: medium
- Messages: 2 messages

**After:**
- Priority: high
- Messages: 3 messages (new one added)
- New message says: "[timestamp] Priority escalated from medium to high by Current User: Testing priority escalation feature"

---

## 🔍 What to Look For

### Visual Indicators:

1. **Icon Appearance**
   - Small trending up arrow (↗) icon
   - Gray by default
   - Orange on hover
   - Only visible if priority < critical

2. **Priority Colors**
   - Low: Gray
   - Medium: Yellow
   - High: Orange
   - Critical: Red

3. **Escalation Message**
   - Appears in "Team & Communication" section
   - Has timestamp
   - Shows old → new priority
   - Shows who escalated and why

### Interactive Elements:

- **Hover Effect**: Icon turns orange when you hover
- **Click Action**: Opens browser prompt for reason
- **Validation**: Won't let you submit empty reason
- **Feedback**: Shows success alert after escalation
- **Real-time Update**: Priority updates immediately without page refresh

---

## 📱 Mobile/Responsive View

On smaller screens:
- The 3 stat cards stack vertically
- Priority card will be at the bottom
- Icon still appears in top-right of Priority card
- Same functionality

---

## 🐛 Troubleshooting

### "I don't see the icon"
- Check if priority is already "critical" (icon hidden for critical)
- Make sure you're viewing a request detail (not the list view)
- Try refreshing the page

### "Nothing happens when I click"
- Check browser console for errors (F12)
- Make sure you entered a reason in the prompt
- Try a different request

### "Priority didn't change"
- Check if you're trying to de-escalate (not allowed)
- Check if priority is already at the level you're trying to set
- Look in browser console for error messages

---

## 💡 Pro Tips

1. **Keyboard Shortcut**: After clicking the icon, you can paste a pre-written reason
2. **Audit Trail**: All escalations are logged in messages - great for compliance
3. **Stage 3 Sync**: If the request is linked to Stage 3, TO team gets notified automatically
4. **No Undo**: Once escalated, you can't de-escalate (by design)
5. **Multiple Escalations**: You can escalate multiple times (low → medium → high → critical)

---

## 📊 Example Scenarios

### Scenario 1: Urgent Business Need
```
Current: medium
Action: Click ↗, enter "CEO needs this for investor meeting"
Result: Priority → high
```

### Scenario 2: Production Issue
```
Current: high
Action: Click ↗, enter "Production outage affecting customers"
Result: Priority → critical
```

### Scenario 3: Already Critical
```
Current: critical
Action: No icon visible (already at max priority)
Result: N/A
```

---

## 🎬 Video Walkthrough (Steps)

1. **[0:00]** Open Solution Build Workspace
2. **[0:05]** Click on a build request
3. **[0:10]** Locate Priority card (3rd card, top row)
4. **[0:15]** Hover over ↗ icon (turns orange)
5. **[0:20]** Click icon
6. **[0:25]** Enter reason in prompt
7. **[0:30]** Click OK
8. **[0:35]** See priority update
9. **[0:40]** Scroll to Team & Communication
10. **[0:45]** See new escalation message

---

## 📝 Summary

**Location**: Solution Build Workspace → Select Request → Priority Card (top-right icon)

**Action**: Click ↗ icon → Enter reason → Confirm

**Result**: Priority increases by one level + audit message added

**Visibility**: Icon only shows if priority < critical

**Perfect for your work update**: Small, visible, functional, adds real value! 🚀
