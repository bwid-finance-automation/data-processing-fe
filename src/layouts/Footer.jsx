import { useTranslation } from "react-i18next";
import thumbnail from "@assets/thumnail.png";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: t("home") },
    { href: "/jobs", label: t("findJobs") },
    { href: "/about", label: t("aboutUs") },
    { href: "/contact", label: t("contact") },
  ];

  const contactInfo = [
    { label: t("email"), value: "bwid.finance1@gmail.com" },
    { label: t("phone"), value: "+84 123 456 789" },
    { label: t("address"), value: t("addressValue") },
  ];

  return (
    <footer className="bg-gray-100 dark:bg-[#1f1f1f] text-gray-800 dark:text-[#f5efe6] font-inter transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-3">
          <div className="bg-white p-4 rounded-xl shadow-md w-fit">
            <img
              src={thumbnail}
              alt="BWID Logo"
              className="w-32 h-auto object-contain"
            />
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-[#222] dark:text-[#f5efe6]">
            {t("quickLinks")}
          </h4>
          <ul className="flex flex-col gap-2 text-gray-700 dark:text-gray-300">
            {quickLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="hover:text-[#111] dark:hover:text-white transition"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-[#222] dark:text-[#f5efe6]">
            {t("contactInfo")}
          </h4>
          <div className="flex flex-col gap-1">
            {contactInfo.map((info, index) => (
              <p key={index} className="text-gray-700 dark:text-gray-300 text-sm">
                {info.label}: {info.value}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {currentYear} . {t("allRightsReserved")}
      </div>
    </footer>
  );
}
