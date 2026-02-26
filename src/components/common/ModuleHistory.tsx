import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClockIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  TableCellsIcon,
  DocumentChartBarIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  getBankStatementHistory,
  getContractHistory,
  getGLAHistory,
  getVarianceHistory,
  getUtilityBillingHistory,
  getExcelComparisonHistory,
  downloadFromHistory,
  type BankStatementSessionItem,
  type ContractSessionItem,
  type GLASessionItem,
  type AnalysisSessionItem,
} from '@services/history/history-apis';
import { downloadBankStatementFromHistory } from '@services/bank-statement/bank-statement-apis';

type ModuleKey = 'bank-statements' | 'contracts' | 'gla' | 'variance' | 'utility-billing' | 'excel-comparison';

interface ModuleHistoryProps {
  moduleKey: ModuleKey;
  refreshTrigger?: any;
  className?: string;
}

const fetchFnMap: Record<ModuleKey, (skip: number, limit: number) => Promise<any>> = {
  'bank-statements': getBankStatementHistory,
  'contracts': getContractHistory,
  'gla': getGLAHistory,
  'variance': getVarianceHistory,
  'utility-billing': getUtilityBillingHistory,
  'excel-comparison': getExcelComparisonHistory,
};

function formatDateVN(isoString: string | null): string {
  if (!isoString) return '';
  const dateString = isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function DownloadButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
      title={title}
    >
      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; text: string }> = {
    completed: { color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
    failed: { color: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
    processing: { color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  };
  const style = config[status] || config.processing;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${style.color}`} />
      <span className={`text-[11px] font-medium capitalize ${style.text}`}>{status}</span>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Shared row wrapper                                 */
/* -------------------------------------------------- */
interface HistoryItemWrapperProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  metadata?: React.ReactNode;
  time: string;
  onDownload?: (() => void) | null;
}

function HistoryItemWrapper({ icon: Icon, title, subtitle, metadata, time, onDownload }: HistoryItemWrapperProps) {
  const { t } = useTranslation();

  return (
    <div className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700/50 cursor-default">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
              {title}
            </span>
            {metadata}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 pl-2">
        <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{time}</span>
        <div className={`transition-opacity duration-200 ${onDownload ? 'opacity-0 group-hover:opacity-100' : 'hidden'}`}>
          {onDownload && <DownloadButton onClick={onDownload} title={t('Download')} />}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Per-module item components                         */
/* -------------------------------------------------- */

function BankStatementItem({ session }: { session: BankStatementSessionItem }) {
  const { t } = useTranslation();

  const handleDownload = async () => {
    try {
      const { blob, filename } = await downloadBankStatementFromHistory(session.session_id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading from history:', err);
    }
  };

  const banksDisplay = session.banks?.length > 2
    ? `${session.banks.slice(0, 2).join(', ')} +${session.banks.length - 2}`
    : session.banks?.join(', ');

  return (
    <HistoryItemWrapper
      icon={DocumentChartBarIcon}
      title={banksDisplay || 'Unknown Bank'}
      subtitle={`${session.file_count} ${t('files')} \u00b7 ${(session.total_transactions || 0).toLocaleString()} ${t('txns')}`}
      time={formatDateVN(session.processed_at)}
      onDownload={handleDownload}
    />
  );
}

function ContractItem({ contract }: { contract: ContractSessionItem }) {
  return (
    <HistoryItemWrapper
      icon={DocumentTextIcon}
      title={contract.contract_title || contract.file_name || 'Untitled Contract'}
      subtitle={[contract.contract_number, contract.tenant].filter(Boolean).join(' \u00b7 ') || 'No details'}
      time={formatDateVN(contract.processed_at)}
    />
  );
}

function GLAItem({ session }: { session: GLASessionItem }) {
  return (
    <HistoryItemWrapper
      icon={BuildingOffice2Icon}
      title={`${session.project_name} (${session.project_code})`}
      subtitle={[session.product_type, session.region, session.period_label].filter(Boolean).join(' \u00b7 ')}
      time={formatDateVN(session.processed_at)}
    />
  );
}

function AnalysisItem({ session }: { session: AnalysisSessionItem }) {
  return (
    <HistoryItemWrapper
      icon={TableCellsIcon}
      title={`${session.files_count} files processed`}
      metadata={<StatusBadge status={session.status} />}
      subtitle={session.analysis_type || 'General Analysis'}
      time={formatDateVN(session.completed_at || session.started_at)}
      onDownload={session.download_url ? () => downloadFromHistory(session.download_url!) : null}
    />
  );
}

function renderItem(moduleKey: ModuleKey, item: any) {
  switch (moduleKey) {
    case 'bank-statements': return <BankStatementItem session={item} />;
    case 'contracts': return <ContractItem contract={item} />;
    case 'gla': return <GLAItem session={item} />;
    case 'variance':
    case 'utility-billing':
    case 'excel-comparison': return <AnalysisItem session={item} />;
    default: return null;
  }
}

/* -------------------------------------------------- */
/*  Date grouping & bank filter helpers                */
/* -------------------------------------------------- */

function getDateLabel(isoString: string | null, t: (s: string) => string): string {
  if (!isoString) return t('Unknown');
  const dateString = isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z';
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  if (date >= today) return t('Today');
  if (date >= yesterday) return t('Yesterday');
  if (date >= weekAgo) return t('This week');
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getItemDate(moduleKey: ModuleKey, item: any): string | null {
  if (moduleKey === 'bank-statements') return item.processed_at;
  if (moduleKey === 'contracts') return item.processed_at;
  if (moduleKey === 'gla') return item.processed_at;
  return item.completed_at || item.started_at;
}

interface DateGroup {
  label: string;
  items: any[];
}

function groupByDate(moduleKey: ModuleKey, items: any[], t: (s: string) => string): DateGroup[] {
  const map = new Map<string, any[]>();
  for (const item of items) {
    const label = getDateLabel(getItemDate(moduleKey, item), t);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function extractBanks(items: BankStatementSessionItem[]): string[] {
  const bankSet = new Set<string>();
  for (const item of items) {
    item.banks?.forEach((b) => bankSet.add(b));
  }
  return Array.from(bankSet).sort();
}

function BankFilterBar({ banks, selected, onSelect }: { banks: string[]; selected: string | null; onSelect: (b: string | null) => void }) {
  const { t } = useTranslation();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const options = useMemo(
    () => banks.map((bank) => ({ label: bank, value: bank })),
    [banks]
  );

  const checkScroll = () => {
    if (scrollContainerRef.current && isExpanded) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    if (!isExpanded) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    window.addEventListener('resize', checkScroll);
    const timeout = setTimeout(checkScroll, 550);
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timeout);
    };
  }, [options, isExpanded]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth'
      });
    }
  };

  if (banks.length === 0) return null;

  const isAllSelected = selected === null;

  return (
    <div className="flex items-center w-full">
      {/* Toggle button */}
      <button
        onClick={() => {
          if (!isAllSelected) {
            onSelect(null);
            setIsExpanded(true);
          } else {
            setIsExpanded(!isExpanded);
          }
        }}
        className={`flex-shrink-0 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-300 shadow-sm border outline-none ${
          isAllSelected
            ? isExpanded
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-[#252525] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-[#2a2a2a]'
            : 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-500/30 dark:border-indigo-500/40 dark:text-indigo-300'
        }`}
      >
        <FunnelIcon className="w-3.5 h-3.5" />
        <span className="whitespace-nowrap">{t('All')}</span>
        <ChevronRightIcon
          className={`w-3 h-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Sliding horizontal scroll container */}
      <div
        className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isExpanded || !isAllSelected ? 'max-w-[800px] opacity-100 ml-2 flex-1' : 'max-w-0 opacity-0 ml-0'
        }`}
      >
        <div className="relative flex items-center w-full group">
          {/* Left arrow */}
          <div className={`absolute left-0 z-10 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-[#1c1c1c] dark:via-[#1c1c1c]/90 dark:to-transparent pr-4 py-1 transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              type="button"
              onClick={() => scroll('left')}
              className="h-6 w-6 flex items-center justify-center rounded-full border border-gray-200/80 dark:border-gray-700/80 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-[#252525] shadow-sm transition-colors outline-none"
            >
              <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
            </button>
          </div>

          {/* Bank list */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar scroll-smooth w-full py-0.5"
          >
            {options.map((option) => {
              const isActive = selected === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onSelect(isActive ? null : option.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border outline-none ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300'
                      : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Right arrow */}
          <div className={`absolute right-0 z-10 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-[#1c1c1c] dark:via-[#1c1c1c]/90 dark:to-transparent pl-4 py-1 transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="h-6 w-6 flex items-center justify-center rounded-full border border-gray-200/80 dark:border-gray-700/80 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-[#252525] shadow-sm transition-colors outline-none"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Main component                                     */
/* -------------------------------------------------- */

export default function ModuleHistory({ moduleKey, refreshTrigger, className = '' }: ModuleHistoryProps) {
  const { t } = useTranslation();
  const isAlwaysOpen = moduleKey === 'bank-statements';
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(isAlwaysOpen);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [bankFilter, setBankFilter] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchFnMap[moduleKey](0, 20);
      const list = data.sessions || data.contracts || [];
      setItems(list);
      setTotal(data.total || list.length);
      setHasLoaded(true);
    } catch (err) {
      console.error(`Error fetching ${moduleKey} history:`, err);
      setItems([]);
      setTotal(0);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((expanded || isAlwaysOpen) && !hasLoaded) {
      fetchData();
    }
  }, [expanded, hasLoaded, isAlwaysOpen]);

  useEffect(() => {
    if (isAlwaysOpen && !expanded) {
      setExpanded(true);
    }
  }, [isAlwaysOpen, expanded]);

  useEffect(() => {
    if (refreshTrigger && hasLoaded) {
      fetchData();
    }
  }, [refreshTrigger, hasLoaded]);

  // Bank filter (bank-statements only)
  const banks = useMemo(() =>
    moduleKey === 'bank-statements' ? extractBanks(items as BankStatementSessionItem[]) : [],
    [items, moduleKey]
  );

  const filteredItems = useMemo(() => {
    if (moduleKey !== 'bank-statements' || !bankFilter) return items;
    return items.filter((s: BankStatementSessionItem) => s.banks?.includes(bankFilter));
  }, [items, bankFilter, moduleKey]);
  const showDeletionWarning = hasLoaded && total >= 15;

  // Group by date
  const dateGroups = useMemo(
    () => groupByDate(moduleKey, filteredItems, t),
    [moduleKey, filteredItems, t]
  );

  // Stagger index counter across groups
  let staggerIdx = 0;

  return (
    <div className={`bg-white dark:bg-[#1c1c1c] rounded-xl border border-gray-200/80 dark:border-gray-800/80 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Stagger animation keyframes */}
      <style>{`
        @keyframes historySlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .history-stagger-item {
          animation: historySlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #4b5563; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0">
        <button
          onClick={() => {
            if (!isAlwaysOpen) setExpanded(!expanded);
          }}
          className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors focus:outline-none ${
            isAlwaysOpen
              ? 'cursor-default'
              : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
              {t('Recent History')}
            </h3>
            {hasLoaded && (
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                {total}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {(expanded || isAlwaysOpen) && hasLoaded && items.length > 0 && (
              <span
                className={`hidden md:inline text-[10px] truncate ${
                  showDeletionWarning
                    ? 'text-amber-700 dark:text-amber-300 font-medium'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {showDeletionWarning && (
                  <ExclamationTriangleIcon className="inline h-3.5 w-3.5 mr-1 align-[-1px]" />
                )}
                {t('History is automatically deleted after 14 days')}
              </span>
            )}
            {!isAlwaysOpen && (
              <ChevronRightIcon
                className={`h-4 w-4 text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${expanded ? 'rotate-90' : ''}`}
              />
            )}
          </div>
        </button>
      </div>

      {/* Expandable content */}
      {(expanded || isAlwaysOpen) && (
        <div
          className={`min-h-0 flex flex-col overflow-hidden border-t border-gray-100 dark:border-gray-800/60 px-2 pb-2 ${
            moduleKey === 'bank-statements'
              ? 'max-h-[420px] lg:max-h-none lg:flex-1'
              : 'max-h-[420px]'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <p className="text-[11px] font-medium text-gray-400">{t('Loading...')}</p>
            </div>
          ) : items.length === 0 && hasLoaded ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400">
              <ClockIcon className="h-6 w-6 opacity-40 mb-1" />
              <p className="text-[12px]">{t('No history yet')}</p>
            </div>
          ) : (
            <>
              {/* Bank filter chips */}
              {moduleKey === 'bank-statements' && banks.length > 1 && (
                <div className="pt-2 px-1 flex-shrink-0">
                  <BankFilterBar banks={banks} selected={bankFilter} onSelect={setBankFilter} />
                </div>
              )}

              {/* Date-grouped list */}
              <div className="mt-2 overflow-y-auto flex-1 min-h-0 flex flex-col gap-1 pr-1 custom-scrollbar">
                {dateGroups.map((group) => (
                  <div key={group.label}>
                    <div className="px-3 pt-2 pb-1 sticky top-0 z-10 bg-white/90 dark:bg-[#1c1c1c]/90 backdrop-blur-sm">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {group.label}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const idx = staggerIdx++;
                        return (
                          <div
                            key={item.session_id || item.id || idx}
                            className="history-stagger-item"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                          >
                            {renderItem(moduleKey, item)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && bankFilter && (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-400">
                    <p className="text-[12px]">{t('No results for')} "{bankFilter}"</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
