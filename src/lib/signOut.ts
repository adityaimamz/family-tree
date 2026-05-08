import { clearNeonAuthTokenCache, neonAuth } from "./auth";

export const performSignOut = async (): Promise<void> => {
  clearNeonAuthTokenCache();

  try {
    await neonAuth.signOut();
  } catch (error) {
    console.error("[auth] sign-out failed, forcing local cleanup", error);
  }

  // Clear any cached state
  window.sessionStorage.removeItem("warisanai:last-auth-error");

  // Hard redirect to ensure all React state is cleared
  window.location.href = "/auth/sign-in";
};
