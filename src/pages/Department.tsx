import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRightIcon,
  ChartBarIcon,
  FolderIcon,
  Squares2X2Icon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { Breadcrumb } from "@components/common";

export default function Department() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const safeT = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const departments = [
    {
      id: 1,
      name: safeT("fpaRDept", "FP&A"),
      description: safeT("fpaRDeptDesc", "Financial Planning & Analysis"),
      projectCount: 3,
      focus: safeT("fpaFocus", "Forecasting, variance, and decision support"),
      tools: [
        safeT("ExcelComparision", "Excel Comparison"),
        safeT("glaVarianceAnalysis", "GLA Variance"),
      ],
      Icon: ChartBarIcon,
      gradient: "from-blue-600 to-cyan-500",
      shadow: "shadow-blue-500/20",
    },
    {
      id: 2,
      name: safeT("financeAccountingDept", "Finance Accounting"),
      description: safeT("financeAccountingDeptDesc", "Financial management and accounting"),
      projectCount: 5,
      focus: safeT("financeFocus", "Automation, reconciliation, and compliance"),
      tools: [
        safeT("varianceAnalysisProject", "Variance Analysis"),
        safeT("cashReportProject", "Cash Report"),
      ],
      Icon: WalletIcon,
      gradient: "from-emerald-600 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
  ];

  const totalProjects = departments.reduce((sum, dept) => sum + dept.projectCount, 0);
  const departmentsLabel = safeT("departments", "Departments");
  const projectsLabel = safeT("projects", "Projects");

  useEffect(() => {
    document.title = `${departmentsLabel} - BW Industrial`;
  }, [departmentsLabel]);

  const breadcrumbItems = [
    { label: safeT("workspaceLabel", "Workspace"), href: "/" },
    { label: departmentsLabel },
  ];

  return (
    <div className="flex-1 bg-[#f7f6f3] dark:bg-[#181818] transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
        <div className="w-full max-w-[85vw] mx-auto py-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Squares2X2Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-[#f5efe6]">
                  {departmentsLabel}
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {safeT("departmentsDesc", "Manage your teams and projects")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: safeT("teamsLabel", "Teams"), value: String(departments.length).padStart(2, "0"), Icon: Squares2X2Icon },
                { label: projectsLabel, value: String(totalProjects).padStart(2, "0"), Icon: FolderIcon },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2.5 px-4 py-2 bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm backdrop-blur-sm"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                    <stat.Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                      {stat.label}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[85vw] mx-auto py-12">
        {/* Card Grid - MAGAZINE STYLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => navigate(`/project/${dept.id}`)}
              className="group relative h-56 sm:h-64 rounded-[2rem] overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              {/* Layer 1: Base Background */}
              <div className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors duration-300" />

              {/* Layer 2: Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${dept.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`} />

              {/* Layer 3: Watermark Number (Big 01, 02) */}
              <span className="absolute -right-4 -bottom-10 text-[12rem] leading-none font-black text-slate-100 dark:text-slate-800/40 select-none transition-transform duration-700 group-hover:-translate-y-4 group-hover:scale-105">
                {String(dept.id).padStart(2, '0')}
              </span>

              {/* Layer 4: Content */}
              <div className="relative h-full p-8 flex flex-col justify-between z-10">
                {/* Header: Name & Desc */}
                <div className="flex justify-between items-start max-w-[85%]">
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-blue-500 transition-all duration-300">
                      {dept.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                </div>

                {/* Footer: Stats & Action Button */}
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                    <FolderIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      {dept.projectCount} Active {projectsLabel}
                    </span>
                  </div>

                  {/* Circle Action Button */}
                  <button className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-45deg]">
                    <ArrowRightIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
