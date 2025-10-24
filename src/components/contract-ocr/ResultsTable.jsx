import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DetailModal from './DetailModal';

export default function ResultsTable({ results, onExportExcel, onExportJSON }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filteredResults = results.results.filter(result => {
    if (!result.success) return false;

    const matchesSearch = searchTerm === '' ||
      result.source_file?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.data?.tenant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.data?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.data?.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.data?.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === '' || result.data?.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleViewDetails = (result) => {
    setSelectedContract(result);
    setShowModal(true);
  };

  return (
    <>
      <div className="bg-[#f7f6f3] dark:bg-[#222] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-[#222] dark:text-[#f5efe6]">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('extractionResults') || 'Extraction Results'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {results.successful} {t('of') || 'of'} {results.total_files} {t('contractsProcessedSuccessfully') || 'contracts processed successfully'}
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('exportToExcel') || 'Export to Excel'}
            </button>
            <button
              onClick={onExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              {t('exportJSON') || 'Export JSON'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {t('successful') || 'Successful'}
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{results.successful}</p>
              </div>
              <svg className="w-10 h-10 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {t('failed') || 'Failed'}
                </p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{results.failed}</p>
              </div>
              <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {t('totalFiles') || 'Total Files'}
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{results.total_files}</p>
              </div>
              <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Token Usage Card */}
          {results.total_token_usage && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {t('totalTokens') || 'Total Tokens'}
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {results.total_token_usage.total_tokens.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {results.total_token_usage.prompt_tokens.toLocaleString()} prompt + {results.total_token_usage.completion_tokens.toLocaleString()} completion
                  </p>
                </div>
                <svg className="w-10 h-10 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Cost Estimate Banner */}
        {results.total_cost_estimate && (
          <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-full p-3">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {t('estimatedCost') || 'Estimated API Cost'}
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                    ${results.total_cost_estimate.total_cost.toFixed(6)}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Input: ${results.total_cost_estimate.input_cost.toFixed(6)} · Output: ${results.total_cost_estimate.output_cost.toFixed(6)} · Model: {results.total_cost_estimate.model}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                  {t('avgCostPerContract') || 'Avg per contract'}
                </p>
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  ${(results.total_cost_estimate.total_cost / results.successful).toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder={t('searchByFileName') || 'Search by file name, customer, contract #, or tenant...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#181818] text-[#222] dark:text-[#f5efe6]"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#181818] text-[#222] dark:text-[#f5efe6]"
          >
            <option value="">{t('allTypes') || 'All Types'}</option>
            <option value="Retail Lease">{t('retailLease') || 'Retail Lease'}</option>
            <option value="Commercial Lease">{t('commercialLease') || 'Commercial Lease'}</option>
            <option value="Office Lease">{t('officeLease') || 'Office Lease'}</option>
            <option value="Residential Lease">{t('residentialLease') || 'Residential Lease'}</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('fileName') || 'File Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('contractNumber') || 'Contract #'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('customerName') || 'Customer'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('contractDate') || 'Contract Date'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('handoverDate') || 'Handover Date'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('depositAmount') || 'Deposit'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('gfa') || 'GFA (Sqm)'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('glaForLease') || 'GLA (Sqm)'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('serviceChargeTotal') || 'Service Charge'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('tokens') || 'Tokens'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('cost') || 'Cost'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#222] divide-y divide-gray-200 dark:divide-gray-700">
              {filteredResults.map((result, index) => {
                const numPeriods = result.data?.rate_periods?.length || 0;

                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#222] dark:text-[#f5efe6]">
                      {result.source_file || 'Unknown'}
                      {numPeriods > 1 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                          {numPeriods} periods
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.data?.contract_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.data?.customer_name || result.data?.tenant || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.data?.contract_date || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.data?.handover_date || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.data?.deposit_amount || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.data?.gfa || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.data?.gla_for_lease || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.data?.service_charge_total || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.token_usage ? (
                        <span className="inline-flex items-center gap-1" title={`Prompt: ${result.token_usage.prompt_tokens.toLocaleString()}, Completion: ${result.token_usage.completion_tokens.toLocaleString()}`}>
                          <svg className="w-4 h-4 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          {result.token_usage.total_tokens.toLocaleString()}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {result.cost_estimate ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium" title={`Input: $${result.cost_estimate.input_cost.toFixed(6)}, Output: $${result.cost_estimate.output_cost.toFixed(6)}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ${result.cost_estimate.total_cost.toFixed(6)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(result)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        {t('viewDetails') || 'View Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('noResultsFound') || 'No results found matching your filters.'}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedContract && (
        <DetailModal
          contract={selectedContract}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
