import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, SunIcon, MoonIcon, GlobeAltIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { useTranslation } from 'react-i18next';
import { useDarkMode } from "@configs/DarkModeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@configs/AuthProvider";

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const { isDark, toggleDarkMode } = useDarkMode();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogoutClick = () => {
    setOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate("/login");
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
    { label: t("AI Usage"), path: "/ai-usage" },
  ];

  return (
    <>
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
        {/* Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setOpen(!open)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Bars3Icon className="w-5 h-5" />
            <span className="font-medium hidden sm:block">{t("menu")}</span>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDownIcon className="w-4 h-4" />
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
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {/* User Info Section (if logged in) */}
                  {isAuthenticated && user && (
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white dark:ring-gray-700">
                          {user.full_name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      {user.role === "admin" && (
                        <span className="mt-2 inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  )}

                  {/* Navigation Items */}
                  <div className="py-1">
                    {navItems.map((item, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => {
                          navigate(item.path);
                          setOpen(false);
                        }}
                        whileHover={{ x: 4 }}
                        className="w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all flex items-center gap-3"
                      >
                        <span className="font-medium">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Settings Section */}
                  <div className="py-1">
                    {/* Language Toggle */}
                    <motion.button
                      onClick={toggleLanguage}
                      whileHover={{ x: 4 }}
                      className="w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <GlobeAltIcon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{t('Language')}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {i18n.language.toUpperCase()}
                      </span>
                    </motion.button>

                    {/* Theme Toggle */}
                    <motion.button
                      onClick={toggleDarkMode}
                      whileHover={{ x: 4 }}
                      className="w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {isDark ? (
                          <SunIcon className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <MoonIcon className="w-5 h-5 text-gray-500" />
                        )}
                        <span className="font-medium">{t('Theme')}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {isDark ? 'Dark' : 'Light'}
                      </span>
                    </motion.button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Auth Section */}
                  <div className="py-1">
                    {isAuthenticated && user ? (
                      <motion.button
                        onClick={handleLogoutClick}
                        whileHover={{ x: 4 }}
                        className="w-full text-left px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-3"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span className="font-medium">{t('Sign Out')}</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => {
                          navigate('/login');
                          setOpen(false);
                        }}
                        whileHover={{ x: 4 }}
                        className="w-full text-left px-4 py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-3"
                      >
                        <UserCircleIcon className="w-5 h-5" />
                        <span className="font-medium">{t('Sign In')}</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      </motion.header>

      {/* Logout Confirmation Modal - Portal */}
      {createPortal(
        <AnimatePresence>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowLogoutConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('Confirm Sign Out')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {t('Are you sure you want to sign out?')}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {t('Cancel')}
                    </button>
                    <button
                      onClick={handleLogoutConfirm}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      {t('Sign Out')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
