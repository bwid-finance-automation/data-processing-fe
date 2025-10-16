import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

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

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/department")}
          className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t("backButton")}</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#222] dark:text-[#f5efe6] mb-2">
            {t("projectsFor")} {departmentName}
          </h1>         
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {t("noProjects")}
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => project.link && navigate(project.link)}
                className={`p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f7f6f3] dark:bg-[#222] hover:shadow-lg transition-all ${
                  project.link ? 'cursor-pointer hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-[#222] dark:text-[#f5efe6]">
                      {project.name}
                    </h3>
                    {project.link && (
                      <span className="text-blue-600 dark:text-blue-400 text-sm">→</span>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {project.description}
                </p>
                {project.link && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{t("clickToOpen")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
