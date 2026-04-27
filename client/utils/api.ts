const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, ""); // Remove trailing slashes for consistency


function getAuthTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("taskcorner_state");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { auth?: { token?: string | null } };
    return parsed?.auth?.token ?? null;
  } catch {
    return null;
  }
}

interface ApiOptions extends RequestInit {
  token?: string | null;
  auth?: boolean;
}

export const apiFetch = async (endpoint: string, options: ApiOptions = {}) => {
  const { token, auth, ...fetchOptions } = options;

  const effectiveToken =
    auth === true ? (token ?? getAuthTokenFromStorage()) : token ?? null;

  const headers = {
    "Content-Type": "application/json",
    ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    if (contentType && contentType.includes("application/json")) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = null;
      }
      const errorMessage = error?.message || error?.error || (typeof error === 'string' ? error : null) || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    } else {
      const text = await response.text();
      console.error("API Error (Non-JSON):", text);
      throw new Error(`Server returned an error (${response.status}). Please check if the backend is running and the route is correct.`);
    }
  }

  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};
