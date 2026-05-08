import { getNeonAuthToken } from "./auth";

export const authHeaders = async (headers: HeadersInit = {}) => {
  const token = await getNeonAuthToken();
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetch(input, {
    ...init,
    headers: await authHeaders(init.headers),
  });

export const apiErrorMessage = async (response: Response, fallback: string) => {
  const responseText = await response.text().catch(() => "");
  if (!responseText) return fallback;

  try {
    const data = JSON.parse(responseText) as { error?: unknown; message?: unknown };
    const message = data.error ?? data.message;
    return typeof message === "string" && message.trim() ? message : fallback;
  } catch {
    return responseText.trim() || fallback;
  }
};

export const spaceFetch = async (spaceSlug: string, path: string, init: RequestInit = {}) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return authFetch(`/api/spaces/${spaceSlug}${normalizedPath}`, init);
};
