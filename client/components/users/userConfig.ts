export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const getToken = () => {
  if (typeof window === "undefined") return "";
  try {
    const state = localStorage.getItem("taskcorner_state");
    if (!state) return "";
    return JSON.parse(state)?.auth?.token ?? "";
  } catch {
    return "";
  }
};

export const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});
