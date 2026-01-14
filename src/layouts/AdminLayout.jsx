import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@configs/AuthProvider";
import { useDarkMode } from "@configs/DarkModeProvider";
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";

export default function AdminLayout({ children }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const previousLanguageRef = useRef(null);

  // Force English language in admin panel
  useEffect(() => {
    // Save current language before switching
    previousLanguageRef.current = i18n.language;

    // Switch to English if not already
    if (i18n.language !== "en") {
      i18n.changeLanguage("en");
    }

    // Restore previous language when leaving admin panel
    return () => {
      if (previousLanguageRef.current && previousLanguageRef.current !== "en") {
        i18n.changeLanguage(previousLanguageRef.current);
      }
    };
  }, [i18n]);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    { name: "User Management", href: "/admin/users", icon: UsersIcon },
    { name: "Feature Management", href: "/admin/cases", icon: Cog6ToothIcon },
    { name: "AI Usage", href: "/admin/ai-usage", icon: ChartBarIcon },
    { name: "System Settings", href: "/admin/settings", icon: ServerIcon },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate("/login");
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 shadow-xl transition-all duration-300
          ${sidebarOpen ? "w-64" : "w-20"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 ${sidebarOpen ? "justify-between" : "justify-center"}`}>
          <div className={`flex items-center ${sidebarOpen ? "gap-3" : ""}`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <ServerIcon className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col"
              >
                <span className="font-bold text-gray-900 dark:text-white">Admin Panel</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">BW Industrial</span>
              </motion.div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bars3Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
        {!sidebarOpen && (
          <div className="hidden lg:flex justify-center py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bars3Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${sidebarOpen ? "px-3" : "px-2"}`}>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/admin"}
              title={!sidebarOpen ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center ${sidebarOpen ? "gap-3 px-3" : "justify-center px-2"} py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  {item.name}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className={`border-t border-gray-200 dark:border-gray-700 ${sidebarOpen ? "p-4" : "p-2"}`}>
          {sidebarOpen && user && (
            <div className="flex items-center gap-3 mb-4">
              {user.picture_url ? (
                <img
                  src={user.picture_url}
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.full_name?.charAt(0) || "A"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {!sidebarOpen && user && (
            <div className="flex justify-center mb-2">
              {user.picture_url ? (
                <img
                  src={user.picture_url}
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full"
                  title={user.full_name}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center" title={user.full_name}>
                  <span className="text-white font-medium">
                    {user.full_name?.charAt(0) || "A"}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className={`flex ${sidebarOpen ? "items-center gap-2" : "flex-col gap-2"}`}>
            <button
              onClick={toggleDarkMode}
              title={!sidebarOpen ? (isDark ? "Light Mode" : "Dark Mode") : undefined}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                sidebarOpen ? "flex-1" : "w-full"
              }`}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5 text-yellow-500" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600" />
              )}
              {sidebarOpen && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {isDark ? "Light" : "Dark"}
                </span>
              )}
            </button>

            <button
              onClick={handleLogoutClick}
              title={!sidebarOpen ? t("Logout") : undefined}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ${
                sidebarOpen ? "flex-1" : "w-full"
              }`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              {sidebarOpen && (
                <span className="text-sm text-red-600 dark:text-red-400">
                  {t("Logout")}
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleLogoutCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mx-4 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("Confirm Logout")}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("Are you sure you want to logout?")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleLogoutCancel}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  {t("Logout")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        <div className="min-h-screen p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
