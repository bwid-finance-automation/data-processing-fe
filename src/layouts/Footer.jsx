import { useTranslation } from "react-i18next";
import thumbnail from "@assets/images/thumnail.png";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--app-footer-bg)] theme-text-primary font-inter transition-colors border-t border-[color:var(--app-border)]">
      <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center">
        <div className="flex flex-col gap-3">
          <div className="theme-surface p-4 rounded-xl shadow-md w-fit border border-[color:var(--app-border)]">
            <img
              src={thumbnail}
              alt="BWID Logo"
              className="w-32 h-auto object-contain"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[color:var(--app-border)] py-4 text-center text-sm theme-text-secondary">
        &copy; {currentYear}. {t("allRightsReserved")}
      </div>
    </footer>
  );
}
