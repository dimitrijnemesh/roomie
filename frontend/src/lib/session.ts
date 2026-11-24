// Token storage: Bearer token in localStorage (README §8 — still OPEN, may move to httpOnly cookies).
const TOKEN_KEY = "roomie:token";
const PENDING_EMAIL_KEY = "roomie:email";

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

const AUTH_EVENT = "roomie:auth";
const notify = () => window.dispatchEvent(new Event(AUTH_EVENT));

export const getToken = () => safe(() => localStorage.getItem(TOKEN_KEY), null);
export const setToken = (t: string) => {
  safe(() => localStorage.setItem(TOKEN_KEY, t), undefined);
  notify();
};
export const clearToken = () => {
  safe(() => localStorage.removeItem(TOKEN_KEY), undefined);
  notify();
};

/** Subscribe to login/logout in this tab (custom event) and in other tabs (storage event). */
export function subscribeAuth(cb: () => void) {
  window.addEventListener(AUTH_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(AUTH_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

// Email between register/login → verify. Kept in sessionStorage, never in the URL.
export const getPendingEmail = () => safe(() => sessionStorage.getItem(PENDING_EMAIL_KEY), null);
export const setPendingEmail = (e: string) => safe(() => sessionStorage.setItem(PENDING_EMAIL_KEY, e), undefined);
export const clearPendingEmail = () => safe(() => sessionStorage.removeItem(PENDING_EMAIL_KEY), undefined);
