import { createAuthClient } from "@neondatabase/neon-js/auth";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;

if (!authUrl) {
  console.warn("VITE_NEON_AUTH_URL is not configured. Neon Auth screens will not work until it is set.");
}

export const neonAuth = createAuthClient(authUrl ?? "http://localhost/auth", {
  adapter: BetterAuthReactAdapter(),
}) as ReturnType<typeof createAuthClient>;

const wait = (delayMs: number) => new Promise((resolve) => window.setTimeout(resolve, delayMs));

type CachedJwt = {
  token: string;
  expiresAtMs: number;
};

let cachedJwt: CachedJwt | null = null;
let inFlightToken: Promise<string | null> | null = null;

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
};

const jwtExpiryMs = (token: string): number => {
  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(decodeBase64Url(payloadB64)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

const isTokenExpired = (token: string): boolean => {
  const expiresAtMs = jwtExpiryMs(token);
  if (!expiresAtMs) return false;
  // Consider expired if less than 30 seconds remaining
  return expiresAtMs < Date.now() + 30_000;
};

const isJwt = (token: unknown): token is string =>
  typeof token === "string" && token.split(".").length === 3;

const isValidToken = (token: unknown): token is string => isJwt(token) && !isTokenExpired(token);

const cachedValidJwt = () => {
  if (!cachedJwt) return null;
  if (cachedJwt.expiresAtMs < Date.now() + 30_000) {
    cachedJwt = null;
    return null;
  }
  return cachedJwt.token;
};

const rememberJwt = (token: string) => {
  const expiresAtMs = jwtExpiryMs(token);
  if (expiresAtMs > Date.now() + 30_000) cachedJwt = { token, expiresAtMs };
  return token;
};

const tokenFromSession = async () => {
  if (typeof (neonAuth as any).getSession !== "function") return null;
  const sessionResponse = await (neonAuth as any).getSession?.();
  const token = sessionResponse?.data?.session?.token;
  return isValidToken(token) ? token : null;
};

const tokenFromEndpoint = async () => {
  if (typeof (neonAuth as any).token !== "function") return null;
  const tokenResponse = await (neonAuth as any).token?.();
  const token = tokenResponse?.data?.token;
  return isValidToken(token) ? token : null;
};

export const getNeonAuthToken = async ({
  retries = 6,
  delayMs = 180,
}: {
  retries?: number;
  delayMs?: number;
} = {}) => {
  const cached = cachedValidJwt();
  if (cached) return cached;

  if (inFlightToken) return inFlightToken;

  inFlightToken = (async () => {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const token = (await tokenFromSession()) ?? (await tokenFromEndpoint());
      if (token) return rememberJwt(token);
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) await wait(delayMs);
  }

  if (lastError) {
    console.error("[auth token]", lastError);
  }

  return null;
  })();

  try {
    return await inFlightToken;
  } finally {
    inFlightToken = null;
  }
};

export const clearNeonAuthTokenCache = () => {
  cachedJwt = null;
  inFlightToken = null;
};
