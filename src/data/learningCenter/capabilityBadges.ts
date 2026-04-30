export interface CapabilityBadge {
  id: string;
  trackId: string;
  trackTitle: string;
  badgeLabel: string;
  earnedAt: string;
  userId: string;
  description: string;
  iconColor: string;
}

const STORAGE_KEY = "dtmp.capability.badges";
const isBrowser = typeof window !== "undefined";

function loadBadgesFromStorage(): CapabilityBadge[] {
  if (!isBrowser) return [];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveBadgesToStorage(badges: CapabilityBadge[]): void {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
}

export function awardCapabilityBadge(
  userId: string,
  trackId: string,
  trackTitle: string
): CapabilityBadge {
  const badges = loadBadgesFromStorage();
  const existing = badges.find(
    (badge) => badge.userId === userId && badge.trackId === trackId
  );
  
  if (existing) {
    return existing;
  }

  const badge: CapabilityBadge = {
    id: `badge-${trackId}-${userId}-${Date.now()}`,
    trackId,
    trackTitle,
    badgeLabel: trackTitle,
    earnedAt: new Date().toISOString(),
    userId,
    description: `Completed all required courses in the ${trackTitle} learning track`,
    iconColor: "orange",
  };
  
  badges.push(badge);
  saveBadgesToStorage(badges);
  return badge;
}

export function getCapabilityBadgesForUser(userId: string): CapabilityBadge[] {
  const badges = loadBadgesFromStorage();
  return badges.filter((badge) => badge.userId === userId);
}

export function hasCapabilityBadge(userId: string, trackId: string): boolean {
  const badges = loadBadgesFromStorage();
  return badges.some(
    (badge) => badge.userId === userId && badge.trackId === trackId
  );
}
