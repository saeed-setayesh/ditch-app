"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "traficapp_driver_theme";

export type DriverDashboardTheme = "light" | "dark";

type Ctx = {
  theme: DriverDashboardTheme;
  setTheme: (t: DriverDashboardTheme) => void;
  toggleTheme: () => void;
};

const DriverDashboardThemeContext = createContext<Ctx | null>(null);

function readStoredTheme(): DriverDashboardTheme {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "dark" ? "dark" : "light";
}

export function DriverDashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DriverDashboardTheme>("light");

  useEffect(() => {
    setThemeState(readStoredTheme());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((t: DriverDashboardTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: DriverDashboardTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <DriverDashboardThemeContext.Provider value={value}>
      <div className={`dashboard-scope min-h-dvh ${theme === "dark" ? "dark" : ""}`}>
        {children}
      </div>
    </DriverDashboardThemeContext.Provider>
  );
}

export function useDriverDashboardTheme() {
  const ctx = useContext(DriverDashboardThemeContext);
  if (!ctx) {
    throw new Error("useDriverDashboardTheme must be used within DriverDashboardThemeProvider");
  }
  return ctx;
}
