import { createStore, useSelector } from "@tanstack/react-store";

const STORAGE_KEY = "global_app_state";

// Define everything your app will ever need in one state type
export interface GlobalState {
  theme: "dark" | "light" | "system";
  // You can easily add more global keys here later:
  // user: { name: string } | null;
  // sidebarOpen: boolean;
}
const defaultState: GlobalState = {
  theme: "system",
};

// Load existing storage or fallback to defaults
function getInitialState(): GlobalState {
  if (typeof window === "undefined") return defaultState;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : defaultState;
}

// The single source of truth
const globalStore = createStore<GlobalState>(getInitialState());

// Automatically save any changes made to the store
globalStore.subscribe((state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

export { globalStore, useSelector };
