export type AuthToastVariant = "default" | "success" | "error" | "warning" | "info";

export type AuthToastPayload = {
  message: string;
  variant: AuthToastVariant;
  kind?: "user" | "backend";
};

export const AUTH_ERROR_EVENT = "warisanai:auth-error";
export const AUTH_ERROR_STORAGE_KEY = "warisanai:last-auth-error";

const userErrorPatterns = [
  "password too short",
  "password is too short",
  "invalid password",
  "invalid email",
  "email is required",
  "password is required",
  "required",
  "already exists",
  "not found",
  "invalid credentials",
  "incorrect email",
  "incorrect password",
  "unauthorized",
  "verification",
  "otp",
  "code",
];

const backendErrorPatterns = [
  "invalid origin",
  "trusted origins",
  "allowed origins",
  "vite_neon_auth_url",
  "not configured",
  "configuration",
  "failed to fetch",
  "network",
  "cors",
  "internal server",
  "server error",
  "service unavailable",
  "database",
  "endpoint",
];

export const classifyAuthError = (message: string): "user" | "backend" => {
  const normalized = message.toLowerCase();
  if (backendErrorPatterns.some((pattern) => normalized.includes(pattern))) return "backend";
  if (userErrorPatterns.some((pattern) => normalized.includes(pattern))) return "user";
  return "backend";
};

export const publishAuthToast = (payload: AuthToastPayload) => {
  if (typeof window === "undefined") return;

  if (payload.variant === "error") {
    const kind = payload.kind ?? classifyAuthError(payload.message);
    const normalizedPayload = { ...payload, kind };

    if (kind === "backend") {
      console.error("[auth backend]", payload.message);
      window.sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(AUTH_ERROR_STORAGE_KEY, JSON.stringify(normalizedPayload));
    window.dispatchEvent(new CustomEvent<AuthToastPayload>(AUTH_ERROR_EVENT, { detail: normalizedPayload }));
  }
};

export const readLastAuthError = () => {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(AUTH_ERROR_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthToastPayload;
    return parsed.variant === "error" && parsed.message && (parsed.kind ?? classifyAuthError(parsed.message)) === "user"
      ? parsed
      : null;
  } catch {
    return null;
  }
};

export const clearLastAuthError = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
};
