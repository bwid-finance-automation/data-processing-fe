import { useParams, useNavigate } from "react-router-dom";
import { FolderIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Breadcrumb from "@components/common/Breadcrumb";

export default function Project() {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const projectsByDepartment = {
    1: [
      { id: 1, name: t("ExcelComparision"), description: t("excelComparisionDesc"), link: "/excel-comparison" },
    ],
    2: [
      { id: 2, name: t("varianceAnalysisProject"), description: t("varianceAnalysisDesc"), link: "/variance-analysis" },
      { id: 3, name: t("contractOCRProject"), description: t("contractOCRDesc"), link: "/contract-ocr" },
      { id: 4, name: t("utilityBillingProject"), description: t("utilityBillingDesc"), link: "/utility-billing" },
    ],
  };

  const departmentNames = {
    1: t("fpaRDept"),
    2: t("financeAccountingDept"),
  };

  const projects = projectsByDepartment[departmentId] || [];
  const departmentName = departmentNames[departmentId] || "Unknown";

  const breadcrumbItems = [
    { label: t("home") || "Home", href: "/" },
    { label: t("departments") || "Departments", href: "/department" },
    { label: departmentName, icon: FolderIcon },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        <motion.button
          onClick={() => navigate("/department")}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        >
          <span className="text-lg font-bold">←</span>
          <span className="font-medium">{t("backButton")}</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#222] dark:text-[#f5efe6] mb-2">
            {t("projectsFor")} {departmentName}
          </h1>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("noProjects")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t("noProjectsDesc") || "No projects available for this department"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                onClick={() => project.link && navigate(project.link)}
                className={`group relative p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f7f6f3] dark:bg-[#222] hover:shadow-xl transition-all overflow-hidden ${
                  project.link ? 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-600' : ''
                }`}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-semibold text-[#222] dark:text-[#f5efe6]">
                      {project.name}
                    </h3>
                    {project.link && (
                      <motion.span
                        className="text-blue-600 dark:text-blue-400 text-lg"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {project.description}
                  </p>
                  {project.link && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                      <span>{t("clickToOpen")}</span>
                      <motion.svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </motion.svg>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
