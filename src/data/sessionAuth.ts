const AUTH_KEY = "dtmp.session.authenticated";
const USER_KEY = "dtmp.session.user";

const isBrowser = typeof window !== "undefined";

export interface SessionUser {
  email: string;
  name: string;
  role: string;
}

export const isUserAuthenticated = (): boolean => {
  if (!isBrowser) return false;
  return window.localStorage.getItem(AUTH_KEY) === "true";
};

export const setUserAuthenticated = (value: boolean): void => {
  if (!isBrowser) return;
  window.localStorage.setItem(AUTH_KEY, value ? "true" : "false");
};

export const getSessionUser = (): SessionUser | null => {
  if (!isBrowser) return null;
  const userJson = window.localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

export const setSessionUser = (user: SessionUser | null): void => {
  if (!isBrowser) return;
  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_KEY);
  }
};

/**
 * Check if the current user is a course instructor or admin
 * Returns true for emails starting with "instructor" or "admin" (except admin.to)
 */
export const isLearningCenterAdmin = (): boolean => {
  const user = getSessionUser();
  if (!user) return false;
  
  const email = user.email.toLowerCase().trim();
  
  // Exclude admin.to email (used for Stage 3)
  if (email === "admin@to.dtmp.com" || email.endsWith("@to.dtmp.com")) {
    return false;
  }
  
  // Check if email starts with "instructor" or "admin"
  return email.startsWith("instructor") || email.startsWith("admin");
};
