import { createStore, useSelector } from "@tanstack/react-store";

const STORAGE_KEY = "global_app_state:v1";
const LEGACY_STORAGE_KEY = "global_app_state";

export type GlobalState = {
  theme: "dark" | "light" | "system";
};

const defaultState: GlobalState = {
  theme: "system",
};

function getInitialState(): GlobalState {
  if (typeof window === "undefined") return defaultState;
  const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  return saved ? JSON.parse(saved) : defaultState;
}

const globalStore = createStore<GlobalState>(getInitialState());

globalStore.subscribe((state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

export { globalStore, useSelector };
