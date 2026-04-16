const API_BASE = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") || "/api");

function getStoredToken() {
  try {
    const raw = localStorage.getItem("aimed_portal_auth");
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (_error) {
    return null;
  }
}

export async function apiFetch(path, options = {}, customToken = null) {
  const token = customToken || getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with ${response.status}`);
  }

  return data;
}

export function getWsUrl(token) {
  const explicit = import.meta.env.VITE_WS_URL?.replace(/\/$/, "");
  if (explicit) {
    return `${explicit}?token=${encodeURIComponent(token)}`;
  }

  const apiUrl = new URL(API_BASE, window.location.origin);
  const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";

  if (apiUrl.host === window.location.host && API_BASE.startsWith("/")) {
    return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
  }

  return `${protocol}//${apiUrl.host}/ws?token=${encodeURIComponent(token)}`;
}
