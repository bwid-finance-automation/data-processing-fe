import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { ScrollContainer } from '@components/common';

interface ParseHistorySectionProps {
  projectUuid: string | null;
  projectBankStatements: any[];
  filteredProjectBankStatements: any[];
  loadingProjectHistory: boolean;
  historyTimeFilter: string;
  historyBankFilter: string;
  historyFileTypeFilter: string;
  uniqueBanksInHistory: string[];
  expandedHistorySessions: Record<string, boolean>;
  downloadingSessionId: string | null;
  onTimeFilterChange: (value: string) => void;
  onBankFilterChange: (value: string) => void;
  onFileTypeFilterChange: (value: string) => void;
  onToggleExpand: (sessionId: string) => void;
  onDownloadFromHistory: (sessionId: string) => void;
  onNavigateToSession: (sessionId: string) => void;
  formatDate: (isoString: string) => string;
}

export default function ParseHistorySection({
  projectUuid,
  projectBankStatements,
  filteredProjectBankStatements,
  loadingProjectHistory,
  historyTimeFilter,
  historyBankFilter,
  historyFileTypeFilter,
  uniqueBanksInHistory,
  expandedHistorySessions,
  downloadingSessionId,
  onTimeFilterChange,
  onBankFilterChange,
  onFileTypeFilterChange,
  onToggleExpand,
  onDownloadFromHistory,
  onNavigateToSession,
  formatDate,
}: ParseHistorySectionProps) {
  const { t } = useTranslation();

  if (!projectUuid || (!projectBankStatements.length && !loadingProjectHistory)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-6 bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800"
    >
      {/* Modern Header with integrated filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
            <DocumentTextIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {t('Parse History')}
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                {filteredProjectBankStatements.length}{filteredProjectBankStatements.length !== projectBankStatements.length ? ` / ${projectBankStatements.length}` : ''}
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {t('Live for 7 days')}
            </p>
          </div>
        </div>

        {/* Compact Filters */}
        {projectBankStatements.length > 0 && !loadingProjectHistory && (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={historyTimeFilter}
              onChange={(e) => onTimeFilterChange(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600"
            >
              <option value="all">{t('All Time')}</option>
              <option value="24h">{t('Last 24h')}</option>
              <option value="week">{t('This Week')}</option>
            </select>

            {uniqueBanksInHistory.length > 0 && (
              <select
                value={historyBankFilter}
                onChange={(e) => onBankFilterChange(e.target.value)}
                className="h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600"
              >
                <option value="all">{t('All Banks')}</option>
                {uniqueBanksInHistory.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            )}

            <select
              value={historyFileTypeFilter}
              onChange={(e) => onFileTypeFilterChange(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600"
            >
              <option value="all">{t('All Types')}</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
              <option value="zip">ZIP</option>
            </select>

            {(historyTimeFilter !== 'all' || historyBankFilter !== 'all' || historyFileTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  onTimeFilterChange('all');
                  onBankFilterChange('all');
                  onFileTypeFilterChange('all');
                }}
                className="h-9 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                {t('Clear')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading state for project history */}
      {loadingProjectHistory && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('Loading history...')}</p>
        </div>
      )}

      {/* Project Bank Statements - Modern List */}
      {projectUuid && !loadingProjectHistory && filteredProjectBankStatements.length > 0 && (
        <ScrollContainer maxHeight="max-h-[600px]" className="space-y-3 pr-1">
          {filteredProjectBankStatements.map((session, sessionIdx) => {
            const uploadedFiles = session.uploaded_files || [];
            const uploadedZipFiles = uploadedFiles.filter((f: any) => f.file_name?.toLowerCase().endsWith('.zip')) || [];
            const uploadedPdfFiles = uploadedFiles.filter((f: any) => f.file_name?.toLowerCase().endsWith('.pdf')) || [];
            const uploadedExcelFiles = uploadedFiles.filter((f: any) => {
              const name = f.file_name?.toLowerCase();
              return name?.endsWith('.xlsx') || name?.endsWith('.xls');
            }) || [];

            let extractedExcelCount = 0;
            let extractedPdfCount = 0;
            uploadedZipFiles.forEach((zip: any) => {
              const meta = zip.metadata || {};
              extractedExcelCount += meta.extracted_excel_count || 0;
              extractedPdfCount += meta.extracted_pdf_count || 0;
            });

            const fallbackFiles = session.files || [];
            const fallbackPdfFiles = fallbackFiles.filter((f: any) => f.file_name?.toLowerCase().endsWith('.pdf')) || [];
            const fallbackExcelFiles = fallbackFiles.filter((f: any) => {
              const name = f.file_name?.toLowerCase();
              return name?.endsWith('.xlsx') || name?.endsWith('.xls');
            }) || [];

            const hasZip = uploadedZipFiles.length > 0;
            const hasPdf = uploadedPdfFiles.length > 0 || extractedPdfCount > 0 || fallbackPdfFiles.length > 0;
            const hasExcel = uploadedExcelFiles.length > 0 || extractedExcelCount > 0 || fallbackExcelFiles.length > 0;

            const displayExcelCount = uploadedExcelFiles.length + extractedExcelCount || fallbackExcelFiles.length;
            const displayPdfCount = uploadedPdfFiles.length + extractedPdfCount || fallbackPdfFiles.length;

            const isExpanded = expandedHistorySessions[session.session_id] ?? false;

            return (
              <motion.div
                key={session.session_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: sessionIdx * 0.03 }}
                className="group"
              >
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all duration-200">
                  {/* Main Row */}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Date & Info */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Date Block */}
                        <div className="flex-shrink-0 text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none">
                            {new Date(session.processed_at).getDate()}
                          </div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {new Date(session.processed_at).toLocaleDateString('en', { month: 'short' })}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {session.banks?.map((bank: string) => (
                              <span key={bank} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {bank}
                              </span>
                            ))}
                            {sessionIdx === 0 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                                {t('Latest')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatDate(session.processed_at).split(',')[1]?.trim() || formatDate(session.processed_at)}</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span>{session.file_count || displayExcelCount + displayPdfCount || 0} {t('files')}</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span>{(session.total_transactions || 0).toLocaleString()} {t('txns')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: File Types & Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* File Type Badges */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          {hasZip && (
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                              ZIP
                            </span>
                          )}
                          {hasExcel && (
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              Excel
                            </span>
                          )}
                          {hasPdf && (
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                              PDF
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleExpand(session.session_id)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={t('View Files')}
                          >
                            <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onNavigateToSession(session.session_id)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title={t('View Details')}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDownloadFromHistory(session.session_id)}
                            disabled={downloadingSessionId === session.session_id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors disabled:cursor-not-allowed"
                            title={t('Download Excel')}
                          >
                            {downloadingSessionId === session.session_id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">{t('Download')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Files Section */}
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      <div className="border-t border-gray-100 dark:border-gray-700/50 pt-3">
                        <div className="grid gap-2">
                          {session.files?.map((file: any, idx: number) => (
                            <div
                              key={file.uuid || idx}
                              className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  file.file_name?.toLowerCase().endsWith('.pdf')
                                    ? 'bg-orange-100 dark:bg-orange-900/40'
                                    : 'bg-emerald-100 dark:bg-emerald-900/40'
                                }`}>
                                  <span className={`text-xs font-bold ${
                                    file.file_name?.toLowerCase().endsWith('.pdf')
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    {file.file_name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'XLS'}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {file.file_name || '-'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {file.bank_name}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {(file.transaction_count || 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('txns')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </ScrollContainer>
      )}

      {/* Empty state when no history */}
      {!loadingProjectHistory && projectBankStatements.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <DocumentTextIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{t('No parse history yet')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('Process files to see history here')}</p>
        </div>
      )}

      {/* Empty state when filters result in no matches */}
      {!loadingProjectHistory && projectBankStatements.length > 0 && filteredProjectBankStatements.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{t('No matching results')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('Try adjusting your filters')}</p>
          <button
            onClick={() => {
              onTimeFilterChange('all');
              onBankFilterChange('all');
              onFileTypeFilterChange('all');
            }}
            className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            {t('Clear all filters')}
          </button>
        </div>
      )}
    </motion.div>
  );
}
