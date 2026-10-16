const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status} ${response.statusText})`);
  }

  return response.json() as Promise<T>;
}
