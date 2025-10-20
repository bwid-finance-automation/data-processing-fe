import { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext(undefined);

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

const DarkModeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  // Prevent flash of incorrect theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
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

  const setTheme = (theme) => {
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
