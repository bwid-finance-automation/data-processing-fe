import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PresentationChartLineIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

export default function Project() {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const safeT = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const projectsByDepartment = {
    1: [
      {
        id: 1,
        name: safeT("ExcelComparision", "Excel Comparison"),
        description: safeT("excelComparisionDesc", "Compare budget, forecast, and actual financial data"),
        category: safeT("comparisonCategory", "Comparison"),
        link: "/excel-comparison",
        Icon: TableCellsIcon,
        gradient: "from-blue-600 to-cyan-500",
        shadow: "shadow-blue-500/20",
      },
      {
        id: 6,
        name: safeT("glaVarianceAnalysis", "GLA Variance Analysis"),
        description: safeT(
          "glaVarianceAnalysisDesc",
          "Compare Gross Leasable Area between periods to track Handover and Committed GLA changes"
        ),
        category: safeT("areaAnalysisCategory", "Area Analysis"),
        link: "/gla-variance-analysis",
        Icon: ChartBarIcon,
        gradient: "from-indigo-600 to-blue-500",
        shadow: "shadow-indigo-500/20",
      },
      {
        id: 7,
        name: safeT("ntmEbitdaAnalysis", "NTM EBITDA Variance Analysis"),
        description: safeT("ntmEbitdaAnalysisDesc", "Analyze NTM EBITDA variance between periods with AI-powered commentary"),
        category: safeT("forecastingCategory", "Forecasting"),
        link: "/ntm-ebitda-analysis",
        Icon: PresentationChartLineIcon,
        gradient: "from-violet-600 to-fuchsia-500",
        shadow: "shadow-violet-500/20",
      },
    ],
    2: [
      {
        id: 2,
        name: safeT("varianceAnalysisProject", "Variance Analysis"),
        description: safeT("varianceAnalysisDesc", "Automated variance analysis and reporting system"),
        category: safeT("analysisCategory", "Analysis"),
        link: "/variance-analysis",
        Icon: ArrowsRightLeftIcon,
        gradient: "from-blue-600 to-cyan-500",
        shadow: "shadow-blue-500/20",
      },
      {
        id: 3,
        name: safeT("contractOCRProject", "Contract OCR System"),
        description: safeT("contractOCRDesc", "Extract information from contracts using AI-powered OCR"),
        category: safeT("documentAiCategory", "Document AI"),
        link: "/contract-ocr",
        Icon: DocumentMagnifyingGlassIcon,
        gradient: "from-amber-600 to-orange-500",
        shadow: "shadow-amber-500/20",
      },
      {
        id: 4,
        name: safeT("utilityBillingProject", "Utility Billing Automation"),
        description: safeT("utilityBillingDesc", "Process utility billing data and generate ERP-ready invoices"),
        category: safeT("automationCategory", "Automation"),
        link: "/utility-billing",
        Icon: BoltIcon,
        gradient: "from-cyan-600 to-teal-500",
        shadow: "shadow-cyan-500/20",
      },
      {
        id: 5,
        name: safeT("bankStatementParserProject", "Bank Statement Parser"),
        description: safeT("bankStatementParserDesc", "Extract and structure bank statement data quickly and accurately"),
        category: safeT("extractionCategory", "Extraction"),
        link: "/bank-statement-parser",
        Icon: BanknotesIcon,
        gradient: "from-emerald-600 to-lime-500",
        shadow: "shadow-emerald-500/20",
      },
      {
        id: 8,
        name: safeT("cashReportProject", "Cash Report"),
        description: safeT(
          "cashReportDesc",
          "Generate and manage weekly cash reports with movement classification and reconciliation"
        ),
        category: safeT("treasuryCategory", "Treasury"),
        link: "/cash-report",
        Icon: BanknotesIcon,
        gradient: "from-rose-600 to-orange-500",
        shadow: "shadow-rose-500/20",
      },
    ],
  };

  const departmentNames = {
    1: safeT("fpaRDept", "FP&A"),
    2: safeT("financeAccountingDept", "Finance Accounting"),
  };

  const departmentName = departmentNames[departmentId] || safeT("departmentLabel", "Department");
  const projects = projectsByDepartment[departmentId] || [];
  const projectsLabel = safeT("projects", "Projects");
  const categoriesLabel = safeT("categoriesLabel", "Categories");

  const categories = [...new Set(projects.map((project) => project.category))];
  const filteredProjects = projects;

  useEffect(() => {
    document.title = `${departmentName} - BW Industrial`;
  }, [departmentName]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-800/40 selection:text-indigo-900 dark:selection:text-indigo-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 dark:bg-indigo-400/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-blue-500/5 dark:bg-blue-400/10 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <header className="mb-8 sm:mb-10">
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {safeT("workspaceLabel", "Workspace")}
            </button>
            <ChevronRightIcon className="h-4 w-4" />
            <button
              type="button"
              onClick={() => navigate("/department")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {safeT("departments", "Departments")}
            </button>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="text-slate-900 dark:text-white truncate">{departmentName}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-8">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate("/department")}
                className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                {safeT("backButton", "Back")}
              </button>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                  {departmentName}
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: projectsLabel, value: String(projects.length).padStart(2, "0"), Icon: FolderIcon },
                { label: categoriesLabel, value: String(categories.length).padStart(2, "0"), Icon: ChartBarIcon },
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
        </header>

        {filteredProjects.length === 0 ? (
          <div className="text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-16 px-6 bg-white/80 dark:bg-slate-900/70">
            <div className="mx-auto mb-4 h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <MagnifyingGlassIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {safeT("noProjects", "No projects yet")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {safeT("noProjectsMatch", "No projects available for this department.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => project.link && navigate(project.link)}
                className="group relative cursor-pointer"
              >
                <div className="relative h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-6 shadow-sm transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:border-indigo-500/20 flex flex-col justify-between min-h-[180px]">

                  {/* Hiệu ứng nền Glow khi hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-[1.5rem]`} />

                  {/* Phần trên: Tiêu đề & Danh mục */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                    <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                      {project.category}
                    </span>
                  </div>

                  {/* Phần dưới: Nút Action & Icon */}
                  <div className="flex items-end justify-between mt-4">
                    {/* Nút "Open Tool" dạng viên thuốc (Pill) */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                      {safeT("openTool", "Open Tool")}
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>

                    {/* Icon nằm góc dưới bên phải với nền Gradient */}
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${project.gradient} ${project.shadow} text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-md`}>
                      <project.Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
