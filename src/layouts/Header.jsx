import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, SunIcon, MoonIcon, GlobeAltIcon } from "@heroicons/react/24/solid";
import { useTranslation } from 'react-i18next';
import { useDarkMode } from "@configs/DarkModeProvider";
import { motion, AnimatePresence } from "framer-motion";

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
    { label: t("Projects"), path: "/projects" },
    { label: "AI Usage", path: "/ai-usage" },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex justify-between items-center px-6 py-4 bg-white/80 dark:bg-[#181818]/80 backdrop-blur-lg text-[#222] dark:text-[#f5efe6] shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50"
    >
      <motion.div
        className="flex items-center gap-3 cursor-pointer select-none group"
        onClick={() => navigate("/")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
            <span className="text-2xl font-bold text-white relative z-10">B</span>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <motion.button
          onClick={toggleLanguage}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-all group overflow-hidden"
          aria-label="Toggle language"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <GlobeAltIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 relative z-10" />
          <motion.span
            key={i18n.language}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 relative z-10"
          >
            {i18n.language.toUpperCase()}
          </motion.span>
        </motion.button>

        {/* Dark Mode Toggle */}
        <motion.button
          onClick={toggleDarkMode}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-all overflow-hidden"
          aria-label="Toggle dark mode"
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: 90, scale: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SunIcon className="w-5 h-5 text-yellow-500" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: -90, scale: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MoonIcon className="w-5 h-5 text-gray-700" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setOpen(!open)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
          >
            <span className="font-medium">{t("menu")}</span>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDownIcon className="w-5 h-5" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                  onClick={() => setOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {navItems.map((item, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => {
                        navigate(item.path);
                        setOpen(false);
                      }}
                      whileHover={{ x: 5 }}
                      className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center gap-2"
                    >
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
