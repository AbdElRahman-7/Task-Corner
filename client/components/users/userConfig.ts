import { API_BASE_URL } from "@/utils/api";

export const API = API_BASE_URL;


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
