// ─── Portfolio Management Role — Session Persistence ─────────────────────
// Role selected once per session; persists across card detail navigations.

export type PMRole =
  | "EA Office / Portfolio Manager"
  | "Division Head / Senior Stakeholder"
  | "General DEWA Staff";

export const PM_ROLES: PMRole[] = [
  "EA Office / Portfolio Manager",
  "Division Head / Senior Stakeholder",
  "General DEWA Staff",
];

const PM_ROLE_KEY = "dtmp.portfolio.role";

export function getSessionPMRole(): PMRole | null {
  try {
    const stored = localStorage.getItem(PM_ROLE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PMRole;
    if (PM_ROLES.includes(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setSessionPMRole(role: PMRole): void {
  try {
    localStorage.setItem(PM_ROLE_KEY, JSON.stringify(role));
  } catch {
    // ignore
  }
}

export function clearSessionPMRole(): void {
  try {
    localStorage.removeItem(PM_ROLE_KEY);
  } catch {
    // ignore
  }
}
