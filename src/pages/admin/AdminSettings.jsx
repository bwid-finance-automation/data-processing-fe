import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  ServerIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    // Security
    maxSessionsPerUser: 5,
    sessionTimeout: 30,

    // Notifications
    emailNotifications: true,
    slackNotifications: false,
    webhookUrl: "",

    // System
    maintenanceMode: false,
    debugMode: false,
    autoBackup: true,
    backupFrequency: "daily",
  });

  useEffect(() => {
    document.title = "System Settings - Admin";
  }, []);

  const handleSave = async () => {
    setLoading(true);
    // TODO: Implement API call to save settings
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const SettingCard = ({ icon: Icon, title, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );

  const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  const InputField = ({ label, description, type = "text", value, onChange, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      />
    </div>
  );

  const SelectField = ({ label, description, value, onChange, options }) => (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : saved ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <Cog6ToothIcon className="w-5 h-5" />
          )}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <SettingCard icon={ShieldCheckIcon} title="Security">
          <InputField
            label="Max Sessions Per User"
            description="Maximum number of active sessions allowed per user"
            type="number"
            value={settings.maxSessionsPerUser}
            onChange={(v) => handleChange("maxSessionsPerUser", parseInt(v))}
          />
          <InputField
            label="Session Timeout (days)"
            description="Days before session expires"
            type="number"
            value={settings.sessionTimeout}
            onChange={(v) => handleChange("sessionTimeout", parseInt(v))}
          />
        </SettingCard>

        {/* Notification Settings */}
        <SettingCard icon={BellIcon} title="Notifications">
          <Toggle
            label="Email Notifications"
            description="Send email notifications for important events"
            checked={settings.emailNotifications}
            onChange={(v) => handleChange("emailNotifications", v)}
          />
          <Toggle
            label="Slack Notifications"
            description="Send notifications to Slack channel"
            checked={settings.slackNotifications}
            onChange={(v) => handleChange("slackNotifications", v)}
          />
          <InputField
            label="Webhook URL"
            description="URL for custom webhook notifications"
            value={settings.webhookUrl}
            onChange={(v) => handleChange("webhookUrl", v)}
            placeholder="https://..."
          />
        </SettingCard>

        {/* System Settings */}
        <SettingCard icon={ServerIcon} title="System">
          <Toggle
            label="Maintenance Mode"
            description="Enable maintenance mode (users will see maintenance page)"
            checked={settings.maintenanceMode}
            onChange={(v) => handleChange("maintenanceMode", v)}
          />
          <Toggle
            label="Debug Mode"
            description="Enable debug mode for detailed logging"
            checked={settings.debugMode}
            onChange={(v) => handleChange("debugMode", v)}
          />
          <Toggle
            label="Auto Backup"
            description="Automatically backup database"
            checked={settings.autoBackup}
            onChange={(v) => handleChange("autoBackup", v)}
          />
          <SelectField
            label="Backup Frequency"
            description="How often to run automatic backups"
            value={settings.backupFrequency}
            onChange={(v) => handleChange("backupFrequency", v)}
            options={[
              { value: "hourly", label: "Hourly" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </SettingCard>
      </div>
    </div>
  );
}
