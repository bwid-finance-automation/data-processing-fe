import { useTranslation } from "react-i18next";
import footerLogo from "@assets/images/thumnail-footer.png";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--app-footer-bg)] theme-text-primary font-inter transition-colors border-t border-[color:var(--app-border)]">
      <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center">
        <div className="flex flex-col gap-3">
          <div className="theme-surface w-fit rounded-[1.75rem] shadow-md border border-[color:var(--app-border)] p-1.5 overflow-hidden">
            <div className="rounded-[1.25rem] overflow-hidden">
              <img
                src={footerLogo}
                alt="BWID Logo"
                className="block w-56 sm:w-64 h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[color:var(--app-border)] py-4 text-center text-sm theme-text-secondary">
        &copy; {currentYear}. {t("allRightsReserved")}
      </div>
    </footer>
  );
}
