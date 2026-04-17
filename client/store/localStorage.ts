import type { RootState } from "./index";

type PersistedState = Partial<RootState> & {
  ui?: {
    theme?: string;
  };
};

export const loadState = () => {
  try {
    if (typeof window === "undefined") return undefined;
    const serializedState = localStorage.getItem("taskcorner_state");
    if (serializedState === null) {
      return undefined;
    }
    const parsed: PersistedState = JSON.parse(serializedState) as PersistedState;
    // Migrate stale 'system' theme to 'light'
    if (parsed?.ui?.theme === "system") {
      parsed.ui.theme = "light";
    }
    return parsed;
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const saveState = (state: RootState) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      if (typeof window === "undefined") return;
      const serializedState = JSON.stringify(state);
      localStorage.setItem("taskcorner_state", serializedState);
    } catch (err) {
      console.error("Error saving state to localStorage:", err);
    }
  }, 1000);
};
