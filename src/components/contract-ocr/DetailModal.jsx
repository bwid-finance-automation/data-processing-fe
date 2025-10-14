import { useTranslation } from 'react-i18next';

export default function DetailModal({ contract, onClose }) {
  const { t } = useTranslation();
  const data = contract.data || {};

  const fields = [
    { label: t('fileName') || 'File Name', value: contract.source_file },
    { label: t('processingTime') || 'Processing Time', value: contract.processing_time ? `${contract.processing_time.toFixed(2)}s` : '-' },
    { label: t('contractTitle') || 'Contract Title', value: data.contract_title },
    { label: t('contractType') || 'Contract Type', value: data.contract_type },
    { label: t('tenant') || 'Tenant', value: data.tenant },
    { label: t('internalId') || 'Internal ID', value: data.internal_id },
    { label: 'ID', value: data.id },
    { label: t('masterRecordId') || 'Master Record ID', value: data.master_record_id },
    { label: 'PLC ID', value: data.plc_id },
    { label: t('unitForLease') || 'Unit for Lease', value: data.unit_for_lease },
    { label: t('type') || 'Type', value: data.type },
    { label: t('startDate') || 'Start Date', value: data.start_date },
    { label: t('endDate') || 'End Date', value: data.end_date },
    { label: t('monthlyRatePerSqm') || 'Monthly Rate per Sqm', value: data.monthly_rate_per_sqm },
    { label: t('glaForLease') || 'GLA for Lease', value: data.gla_for_lease },
    { label: t('totalMonthlyRate') || 'Total Monthly Rate', value: data.total_monthly_rate },
    { label: t('months') || 'Months', value: data.months },
    { label: t('totalRate') || 'Total Rate', value: data.total_rate },
    { label: t('status') || 'Status', value: data.status },
    { label: t('historical') || 'Historical', value: data.historical !== null ? (data.historical ? 'Yes' : 'No') : '-' },
    { label: t('historicalJournalEntry') || 'Historical Journal Entry', value: data.historical_journal_entry },
    { label: t('amortizationJournalEntry') || 'Amortization Journal Entry', value: data.amortization_journal_entry },
    { label: t('relatedBillingSchedule') || 'Related Billing Schedule', value: data.related_billing_schedule },
    { label: t('subsidiary') || 'Subsidiary', value: data.subsidiary },
    { label: t('ccsProductType') || 'CCS Product Type', value: data.ccs_product_type },
    { label: t('bwidProject') || 'BWID Project', value: data.bwid_project },
    { label: t('phase') || 'Phase', value: data.phase },
    { label: t('effectiveDate') || 'Effective Date', value: data.effective_date },
    { label: t('expirationDate') || 'Expiration Date', value: data.expiration_date },
    { label: t('contractValue') || 'Contract Value', value: data.contract_value },
    { label: t('paymentTerms') || 'Payment Terms', value: data.payment_terms },
    { label: t('terminationClauses') || 'Termination Clauses', value: data.termination_clauses },
    { label: t('governingLaw') || 'Governing Law', value: data.governing_law },
    { label: t('signaturesPresent') || 'Signatures Present', value: data.signatures_present !== null ? (data.signatures_present ? 'Yes' : 'No') : '-' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#222] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6]">
            {t('contractDetails') || 'Contract Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field, index) => {
              const value = field.value || '-';
              if (value === '-' || value === null || value === undefined) return null;

              return (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{field.label}</dt>
                  <dd className="mt-1 text-sm text-[#222] dark:text-[#f5efe6]">{value}</dd>
                </div>
              );
            })}
          </div>

          {/* Parties */}
          {data.parties_involved && data.parties_involved.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-[#222] dark:text-[#f5efe6]">
                {t('partiesInvolved') || 'Parties Involved'}
              </h3>
              <div className="space-y-2">
                {data.parties_involved.map((party, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-[#181818] p-3 rounded-lg">
                    <p className="font-medium text-[#222] dark:text-[#f5efe6]">{party.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('role')}: {party.role}</p>
                    {party.address && <p className="text-sm text-gray-600 dark:text-gray-400">{t('address')}: {party.address}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Obligations */}
          {data.key_obligations && data.key_obligations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-[#222] dark:text-[#f5efe6]">
                {t('keyObligations') || 'Key Obligations'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {data.key_obligations.map((obligation, index) => (
                  <li key={index}>{obligation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Special Conditions */}
          {data.special_conditions && data.special_conditions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-[#222] dark:text-[#f5efe6]">
                {t('specialConditions') || 'Special Conditions'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {data.special_conditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
