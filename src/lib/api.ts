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
