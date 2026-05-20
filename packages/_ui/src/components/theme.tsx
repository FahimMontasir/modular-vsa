import { Moon, Sun } from "lucide-react";
import * as React from "react";

import { globalStore, useSelector, type GlobalState } from "@modular-vsa/shared/web/store"; // Import the single store

type Theme = GlobalState["theme"];
type Coords = { x: number; y: number };
const MEDIA = "(prefers-color-scheme: light)";

// Helper to mutate DOM classes
function applyTheme(theme: "light" | "dark") {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

/** Sets the theme in the global store & triggers document styling */
function setTheme(theme: Theme, coords?: Coords) {
  if (coords) {
    const root = window.document.documentElement;
    root.style.setProperty("--x", `${coords.x}px`);
    root.style.setProperty("--y", `${coords.y}px`);
  }

  const targetTheme =
    theme === "system" ? (window.matchMedia(MEDIA).matches ? "dark" : "light") : theme;

  if (!document.startViewTransition) {
    applyTheme(targetTheme);
  } else {
    document.startViewTransition(() => applyTheme(targetTheme));
  }

  // Update the single global store
  globalStore.setState((state) => ({ ...state, theme }));
}

/** Toggles between light and dark */
function toggleTheme(coords?: Coords) {
  const currentColorScheme = window.document.documentElement.style.colorScheme;
  setTheme(currentColorScheme === "dark" ? "light" : "dark", coords);
}

/** Hook to get the theme safely */
export function useTheme() {
  return useSelector(globalStore, (state) => state.theme);
}

/** UI Toggle Button */
export function ThemeToggle() {
  return (
    <button type="button" onClick={({ clientX: x, clientY: y }) => toggleTheme({ x, y })}>
      <Sun className="block animate-in duration-300 fade-in zoom-in dark:hidden" />
      <Moon className="hidden animate-in duration-300 fade-in zoom-in dark:block" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

/** Theme Sync Provider */
export function ThemeProvider({ children }: React.PropsWithChildren) {
  React.useInsertionEffect(() => {
    const media = window.matchMedia(MEDIA);
    const currentTheme = globalStore.state.theme;

    const initialTheme =
      currentTheme === "system" ? (media.matches ? "dark" : "light") : currentTheme;
    applyTheme(initialTheme);

    if (currentTheme === "system") {
      function handleSystemChange(e: MediaQueryListEvent) {
        applyTheme(e.matches ? "dark" : "light");
      }
      media.addEventListener("change", handleSystemChange);
      return () => media.removeEventListener("change", handleSystemChange);
    }
  }, []);

  return children;
}
