# Solution Build Priority Escalation Feature

## Overview

Added a new function to allow priority escalation for build requests with full audit trail and Stage 3 synchronization support.

## Implementation Details

### Function Signature

```typescript
escalateBuildRequestPriority(
  requestId: string,
  newPriority: "low" | "medium" | "high" | "critical",
  reason: string,
  escalatedBy: string
): BuildRequest | null
```

### Features

✅ **Priority Escalation Only** - Prevents de-escalation (can only increase priority, not decrease)  
✅ **Audit Trail** - Automatically logs escalation with timestamp, reason, and who escalated  
✅ **Message History** - Adds escalation note to request messages for visibility  
✅ **Stage 3 Sync Ready** - Dispatches custom event when linked to Stage 3 request  
✅ **Non-Breaking** - Existing functionality unchanged  
✅ **Type Safe** - Full TypeScript support  

### Priority Order

```
low (0) → medium (1) → high (2) → critical (3)
```

Only transitions that increase the numeric value are allowed.

## Usage Examples

### Example 1: Basic Escalation

```typescript
import { escalateBuildRequestPriority } from '@/data/solutionBuild';

// Escalate a medium priority request to high
const updated = escalateBuildRequestPriority(
  "BLD-2026-001",
  "high",
  "CEO requested this for board meeting next week",
  "John Smith"
);

if (updated) {
  console.log(`Priority escalated to ${updated.priority}`);
  console.log(`New message added: ${updated.messages[updated.messages.length - 1].content}`);
} else {
  console.log("Escalation not allowed (already at or above requested priority)");
}
```

### Example 2: Critical Escalation

```typescript
// Escalate to critical priority
const updated = escalateBuildRequestPriority(
  "BLD-2026-003",
  "critical",
  "Production outage - immediate fix required",
  "Sarah Chen"
);
```

### Example 3: Prevented De-escalation

```typescript
// This will NOT work - cannot de-escalate from high to medium
const updated = escalateBuildRequestPriority(
  "BLD-2026-002", // Currently high priority
  "medium",
  "Less urgent now",
  "Mike Johnson"
);

// Returns null - no change made
console.log(updated); // null
```

### Example 4: React Component Usage

```typescript
import { escalateBuildRequestPriority } from '@/data/solutionBuild';
import { useState } from 'react';

function BuildRequestCard({ request }) {
  const [escalating, setEscalating] = useState(false);
  
  const handleEscalate = () => {
    const reason = prompt("Reason for escalation:");
    if (!reason) return;
    
    const newPriority = request.priority === "low" ? "medium" :
                       request.priority === "medium" ? "high" : "critical";
    
    const updated = escalateBuildRequestPriority(
      request.id,
      newPriority,
      reason,
      "Current User" // Replace with actual user name
    );
    
    if (updated) {
      alert(`Priority escalated to ${newPriority}`);
      // Refresh UI or update state
    } else {
      alert("Cannot escalate - already at maximum priority");
    }
  };
  
  return (
    <div>
      <h3>{request.name}</h3>
      <p>Priority: {request.priority}</p>
      {request.priority !== "critical" && (
        <button onClick={handleEscalate}>Escalate Priority</button>
      )}
    </div>
  );
}
```

## Audit Trail Format

When a priority is escalated, a message is automatically added:

```
[2026-02-24T15:30:45.123Z] Priority escalated from medium to high by John Smith: CEO requested this for board meeting next week
```

This message appears in:
- `request.messages[]` array
- Visible in the build request detail view
- Searchable and filterable

## Stage 3 Integration

When a build request is linked to a Stage 3 request (`stage3RequestId` exists), the function dispatches a custom event:

```typescript
window.dispatchEvent(new CustomEvent('buildRequestPriorityEscalated', {
  detail: {
    buildRequestId: "BLD-2026-001",
    stage3RequestId: "req-stage3-012",
    newPriority: "high",
    reason: "CEO requested this for board meeting next week",
  },
}));
```

### Listening for Escalation Events

```typescript
// In Stage 3 component or service
useEffect(() => {
  const handleEscalation = (event: CustomEvent) => {
    const { stage3RequestId, newPriority, reason } = event.detail;
    
    // Update Stage 3 request priority
    updateStage3RequestPriority(stage3RequestId, newPriority);
    
    // Add note to Stage 3 activity log
    addStage3Note(stage3RequestId, `Build request priority escalated: ${reason}`);
  };
  
  window.addEventListener('buildRequestPriorityEscalated', handleEscalation);
  
  return () => {
    window.removeEventListener('buildRequestPriorityEscalated', handleEscalation);
  };
}, []);
```

## Testing

### Manual Test Steps

1. Open browser console
2. Import the function:
   ```javascript
   import('@/data/solutionBuild').then(({ escalateBuildRequestPriority, getBuildRequestById }) => {
     // Get a build request
     const request = getBuildRequestById("BLD-2026-001");
     console.log("Current priority:", request.priority);
     
     // Escalate it
     const updated = escalateBuildRequestPriority(
       "BLD-2026-001",
       "high",
       "Test escalation",
       "Test User"
     );
     
     console.log("New priority:", updated?.priority);
     console.log("Messages:", updated?.messages);
   });
   ```

3. Verify:
   - Priority changed
   - Message added to messages array
   - Event dispatched (check console for custom event)

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  addBuildRequest, 
  escalateBuildRequestPriority,
  getBuildRequestById 
} from '@/data/solutionBuild/requestState';

describe('escalateBuildRequestPriority', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  it('should escalate priority from low to medium', () => {
    const request = {
      id: 'TEST-001',
      priority: 'low',
      messages: [],
      // ... other required fields
    };
    
    addBuildRequest(request);
    
    const updated = escalateBuildRequestPriority(
      'TEST-001',
      'medium',
      'Test reason',
      'Test User'
    );
    
    expect(updated).not.toBeNull();
    expect(updated?.priority).toBe('medium');
    expect(updated?.messages.length).toBe(1);
    expect(updated?.messages[0].content).toContain('escalated from low to medium');
  });
  
  it('should prevent de-escalation', () => {
    const request = {
      id: 'TEST-002',
      priority: 'high',
      messages: [],
      // ... other required fields
    };
    
    addBuildRequest(request);
    
    const updated = escalateBuildRequestPriority(
      'TEST-002',
      'medium',
      'Try to de-escalate',
      'Test User'
    );
    
    expect(updated).toBeNull();
    
    const unchanged = getBuildRequestById('TEST-002');
    expect(unchanged?.priority).toBe('high');
  });
  
  it('should not change priority if already at requested level', () => {
    const request = {
      id: 'TEST-003',
      priority: 'high',
      messages: [],
      // ... other required fields
    };
    
    addBuildRequest(request);
    
    const updated = escalateBuildRequestPriority(
      'TEST-003',
      'high',
      'Already high',
      'Test User'
    );
    
    expect(updated).toBeNull();
  });
});
```

## Benefits

1. **Audit Compliance** - Full trail of who changed priority and why
2. **Business Agility** - Respond quickly to changing priorities
3. **Prevents Errors** - Cannot accidentally lower priority
4. **Stage 3 Sync** - Automatically notifies TO operations team
5. **User Transparency** - All stakeholders see escalation history
6. **Non-Disruptive** - Existing code continues to work unchanged

## Future Enhancements

Potential additions (not implemented yet):

- **Approval Workflow** - Require manager approval for critical escalations
- **Automatic Notifications** - Email/Slack alerts on escalation
- **Escalation Limits** - Prevent too many escalations in short time
- **Priority Decay** - Auto-downgrade if not started within X days
- **Cost Impact** - Show budget impact of priority changes

## Files Modified

1. `/src/data/solutionBuild/requestState.ts` - Added `escalateBuildRequestPriority()` function
2. `/src/data/solutionBuild/index.ts` - Exported new function

## Backward Compatibility

✅ **100% Backward Compatible**

- No existing functions modified
- No breaking changes to types
- No changes to data structure (uses existing `messages` array)
- Optional feature - existing code works without using it

## Summary

This small addition provides real business value by:
- Enabling priority escalation with full audit trail
- Preventing accidental de-escalation
- Integrating with Stage 3 operations
- Maintaining complete backward compatibility

**Estimated implementation time**: 5 minutes  
**Lines of code added**: ~60  
**Breaking changes**: 0  
**Business value**: High (enables agile response to changing priorities)
