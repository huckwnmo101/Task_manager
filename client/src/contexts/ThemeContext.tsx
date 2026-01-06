import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeVariant = "apple" | "slate" | "midnight" | "stone";
export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeVariant;
  mode: ThemeMode;
  setTheme: (theme: ThemeVariant) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "app-theme";
const MODE_STORAGE_KEY = "app-mode";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeVariant;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  defaultTheme = "apple",
  defaultMode = "light",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeVariant>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeVariant) || defaultTheme;
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return (stored as ThemeMode) || defaultMode;
  });

  // Apply theme and mode to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Set theme attribute
    root.setAttribute("data-theme", theme);
    
    // Set mode class
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // Persist to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [theme, mode]);

  const setTheme = (newTheme: ThemeVariant) => {
    setThemeState(newTheme);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Theme metadata for UI
export const themeConfig: Record<ThemeVariant, { 
  name: string; 
  description: string;
  lightPreview: string;
  darkPreview: string;
}> = {
  apple: {
    name: "Apple",
    description: "Clean & minimal",
    lightPreview: "#007AFF",
    darkPreview: "#0A84FF",
  },
  slate: {
    name: "Slate",
    description: "Neutral & calm",
    lightPreview: "#6366f1",
    darkPreview: "#818cf8",
  },
  midnight: {
    name: "Midnight",
    description: "Deep navy blue",
    lightPreview: "#1e3a5f",
    darkPreview: "#7dd3fc",
  },
  stone: {
    name: "Stone",
    description: "Warm & natural",
    lightPreview: "#78716c",
    darkPreview: "#d6d3d1",
  },
};
