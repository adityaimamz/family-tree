import { createAuthClient } from "@neondatabase/neon-js/auth";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;

if (!authUrl) {
  console.warn("VITE_NEON_AUTH_URL is not configured. Neon Auth screens will not work until it is set.");
}

export const neonAuth: any = createAuthClient(authUrl ?? "http://localhost/auth", {
  adapter: BetterAuthReactAdapter(),
});

const wait = (delayMs: number) => new Promise((resolve) => window.setTimeout(resolve, delayMs));

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
      const tokenResponse = await neonAuth.token();
      const token = tokenResponse.data?.token ?? null;
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
