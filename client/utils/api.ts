const BASE_URL = "http://localhost:5000/api";

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export const apiFetch = async (endpoint: string, options: ApiOptions = {}) => {
  const { token, ...fetchOptions } = options;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error(error.message || `Request failed with status ${response.status}`);
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
