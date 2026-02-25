import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ThemeMode = "light" | "dark";

type DarkModeContextValue = {
  isDark: boolean;
  toggleDarkMode: () => void;
  setTheme: (theme: ThemeMode) => void;
};

const DarkModeContext = createContext<DarkModeContextValue | undefined>(undefined);

const getInitialTheme = () => {
  // Check localStorage first
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme === "dark";
  }

  // Check system preference if no saved theme
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return true;
  }

  return false; // Default to light mode
};

type DarkModeProviderProps = {
  children: ReactNode;
};

const DarkModeProvider = ({ children }: DarkModeProviderProps) => {
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [mounted, setMounted] = useState(false);
  const isFirstThemeSync = useRef(true);

  // Prevent flash of incorrect theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      if (isDark) {
        root.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    };

    if (isFirstThemeSync.current) {
      isFirstThemeSync.current = false;
      syncTheme();
      return undefined;
    }

    root.classList.add("theme-transition");
    const timeoutId = window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 240);

    syncTheme();

    return () => window.clearTimeout(timeoutId);
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem("theme");
      if (!savedTheme) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  const setTheme = (theme: ThemeMode) => {
    setIsDark(theme === "dark");
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode, setTheme }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within DarkModeProvider");
  }
  return context;
};

export default DarkModeProvider;
