import { createAuthClient } from "@neondatabase/neon-js/auth";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;

if (!authUrl) {
  console.warn("VITE_NEON_AUTH_URL is not configured. Neon Auth screens will not work until it is set.");
}

export const neonAuth: any = createAuthClient(authUrl ?? "http://localhost/auth", {
  adapter: BetterAuthReactAdapter(),
});

export const getNeonAuthToken = async () => {
  const tokenResponse = await neonAuth.token();
  return tokenResponse.data?.token ?? null;
};
