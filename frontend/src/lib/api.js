const normalizeBase = (value) => String(value || "").trim().replace(/\/$/, "");

export const API_BASE = normalizeBase(import.meta.env.VITE_API_URL);
export const SOCKET_URL = normalizeBase(
  import.meta.env.VITE_SOCKET_URL || API_BASE || window.location.origin
);

export function apiUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

export function getStoredToken() {
  return localStorage.getItem("token") || "";
}

export function clearStoredToken() {
  localStorage.removeItem("token");
}

export function authHeaders(extraHeaders = {}) {
  const token = getStoredToken();

  if (!token) {
    return extraHeaders;
  }

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  };
}

export async function jsonRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const text = await response.text();

  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(payload.message || payload.error || "Request failed");
  }

  return payload;
}
