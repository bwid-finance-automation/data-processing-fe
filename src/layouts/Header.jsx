import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, SunIcon, MoonIcon, LanguageIcon } from "@heroicons/react/24/solid";
import { useTranslation } from 'react-i18next';
import { useDarkMode } from "@configs/DarkModeProvider";

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isDark, toggleDarkMode } = useDarkMode();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const navItems = [
    { label: t("departments"), path: "/department" },
  ];

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-[#f7f6f3] dark:bg-[#181818] text-[#222] dark:text-[#f5efe6] shadow-sm">
      <div
        className="flex items-center gap-3 cursor-pointer select-none group"
        onClick={() => navigate("/")}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <span className="text-2xl font-bold text-white">B</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-3 py-2 rounded-full border border-gray-300 bg-[#f5efe6] dark:bg-[#222] hover:bg-[#eee] dark:hover:bg-[#333] transition-all"
          aria-label="Toggle language"
        >
          <LanguageIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {i18n.language === "vi" ? "EN" : "VI"}
          </span>
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full border border-gray-300 bg-[#f5efe6] dark:bg-[#222] hover:bg-[#eee] dark:hover:bg-[#333] transition-all"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <SunIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border border-gray-300 bg-[#f5efe6] dark:bg-[#222] hover:bg-[#eee] dark:hover:bg-[#333] transition-all"
          >
            <span className="font-medium">{t("menu")}</span>
            <ChevronDownIcon
              className={`w-5 h-5 transition-transform duration-200 ${
                open ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {open && (
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
          )}

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {navItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
