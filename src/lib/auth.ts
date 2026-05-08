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

const isTokenExpired = (token: string): boolean => {
  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    // Consider expired if less than 30 seconds remaining
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return false;
  }
};

const isJwt = (token: unknown): token is string =>
  typeof token === "string" && token.split(".").length === 3;

const isValidToken = (token: unknown): token is string => isJwt(token) && !isTokenExpired(token);

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
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const token = (await tokenFromSession()) ?? (await tokenFromEndpoint());
      if (token) return token;
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) await wait(delayMs);
  }

  if (lastError) {
    console.error("[auth token]", lastError);
  }

  return null;
};
