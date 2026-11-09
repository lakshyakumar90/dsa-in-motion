import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { writeStorage } from "@/lib/utils";

type Theme = "dark" | "light";
interface ThemeContextValue { theme: Theme; toggleTheme: () => void }
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === "light" ? "light" : "dark");
  const toggleTheme = useCallback(() => setTheme((current) => {
    const next: Theme = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("dsa-motion-theme", next); } catch { /* Keep the in-memory theme even when storage is blocked. */ }
    // Preserve the preference used by the legacy app.
    writeStorage("dsa-motion-light", next === "light");
    return next;
  }), []);
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
