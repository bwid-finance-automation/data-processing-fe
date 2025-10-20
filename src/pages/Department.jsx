import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Department() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("departments")} - BW Industrial`;
  }, [t]);

  const departments = [
    { id: 1, name: t("fpaRDept"), description: t("fpaRDeptDesc") },
    { id: 2, name: t("financeAccountingDept"), description: t("financeAccountingDeptDesc") },
  ];

  // Navigate to project page for selected department
  const handleDepartmentClick = (deptId) => {
    navigate(`/project/${deptId}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#222] dark:text-[#f5efe6] mb-2">
            {t("departments")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("departmentsList")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => handleDepartmentClick(dept.id)}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f7f6f3] dark:bg-[#222] hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-[#222] dark:text-[#f5efe6] mb-2">
                {dept.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {dept.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
