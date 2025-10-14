import { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext(undefined);

const DarkModeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    console.log("Dark mode state:", isDark);
    console.log("HTML element before:", root.classList.toString());

    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    console.log("HTML element after:", root.classList.toString());
  }, [isDark]);

  const toggleDarkMode = () => {
    console.log("Toggling from:", isDark);
    setIsDark(prev => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
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
