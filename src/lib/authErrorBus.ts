export type AuthToastVariant = "default" | "success" | "error" | "warning" | "info";

export type AuthToastPayload = {
  message: string;
  variant: AuthToastVariant;
};

export const AUTH_ERROR_EVENT = "warisanai:auth-error";
export const AUTH_ERROR_STORAGE_KEY = "warisanai:last-auth-error";

export const publishAuthToast = (payload: AuthToastPayload) => {
  if (typeof window === "undefined") return;

  if (payload.variant === "error") {
    window.sessionStorage.setItem(AUTH_ERROR_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent<AuthToastPayload>(AUTH_ERROR_EVENT, { detail: payload }));
  }
};

export const readLastAuthError = () => {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(AUTH_ERROR_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthToastPayload;
    return parsed.variant === "error" && parsed.message ? parsed : null;
  } catch {
    return null;
  }
};

export const clearLastAuthError = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
};
