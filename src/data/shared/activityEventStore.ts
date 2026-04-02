// ─────────────────────────────────────────────────────────────────────────────
// Activity Event Store
// Pattern: localStorage-backed, pure functions — matches lifecyclePortfolioStore.ts
// src/data/shared/activityEventStore.ts
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityEventType =
  | "milestone"
  | "risk"
  | "blocker"
  | "escalation"
  | "resolve"
  | "budget"
  | "status"
  | "request"
  | "rag"
  | "system";

export type ActivitySourceType =
  | "risk"
  | "blocker"
  | "milestone"
  | "project"
  | "initiative"
  | "service-request";

export interface ActivityEvent {
  id: string;
  initiativeId: string;
  actor: string;
  action: string;
  note?: string;
  sourceType?: ActivitySourceType;
  sourceId?: string;
  eventType: ActivityEventType;
  timestamp: string;
}

const ACTIVITY_KEY = "dtmp.lifecycle.activityLog";
const MAX_EVENTS   = 1000;
const isBrowser    = typeof window !== "undefined";

const parseJson = <T>(raw: string | null, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const readAll = (): ActivityEvent[] => {
  if (!isBrowser) return [];
  return parseJson<ActivityEvent[]>(window.localStorage.getItem(ACTIVITY_KEY), []);
};

const writeAll = (events: ActivityEvent[]): void => {
  if (!isBrowser) return;
  // Keep newest MAX_EVENTS only
  const trimmed = events
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, MAX_EVENTS);
  window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(trimmed));
};

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns events for a given initiative, sorted newest first. */
export const getActivityEvents = (initiativeId: string): ActivityEvent[] =>
  readAll()
    .filter((e) => e.initiativeId === initiativeId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const getAllActivityEvents = (): ActivityEvent[] =>
  readAll().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

/** Appends a new activity event (generates id and timestamp). */
export const addActivityEvent = (
  data: Omit<ActivityEvent, "id" | "timestamp">
): ActivityEvent => {
  const now = new Date().toISOString();
  const event: ActivityEvent = {
    ...data,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    timestamp: now,
  };
  writeAll([event, ...readAll()]);
  return event;
};

/** Removes all activity events for a given initiative. */
export const clearActivityEvents = (initiativeId: string): void => {
  writeAll(readAll().filter((e) => e.initiativeId !== initiativeId));
};
