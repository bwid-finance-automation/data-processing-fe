import { useTranslation } from "react-i18next";
import thumbnail from "@assets/thumnail.png";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-[#1f1f1f] text-gray-800 dark:text-[#f5efe6] font-inter transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center">
        <div className="flex flex-col gap-3">
          <div className="bg-white p-4 rounded-xl shadow-md w-fit">
            <img
              src={thumbnail}
              alt="BWID Logo"
              className="w-32 h-auto object-contain"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {currentYear} . {t("allRightsReserved")}
      </div>
    </footer>
  );
}
