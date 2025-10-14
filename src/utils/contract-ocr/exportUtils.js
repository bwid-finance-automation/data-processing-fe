import * as XLSX from 'xlsx';

export const exportToExcel = (results) => {
  // Flatten the results data for Excel
  const excelData = results
    .filter(result => result.success)
    .map(result => {
      const data = result.data || {};
      return {
        'File Name': result.source_file || '',
        'Processing Time': result.processing_time || '',
        'Contract Title': data.contract_title || '',
        'Contract Type': data.contract_type || '',
        'Tenant': data.tenant || '',
        'Internal ID': data.internal_id || '',
        'ID': data.id || '',
        'Historical': data.historical !== null ? (data.historical ? 'Yes' : 'No') : '',
        'Master Record ID': data.master_record_id || '',
        'PLC ID': data.plc_id || '',
        'Unit for Lease': data.unit_for_lease || '',
        'Type': data.type || '',
        'Start Date': data.start_date || '',
        'End Date': data.end_date || '',
        'Monthly Rate per Sqm': data.monthly_rate_per_sqm || '',
        'GLA for Lease': data.gla_for_lease || '',
        'Total Monthly Rate': data.total_monthly_rate || '',
        'Months': data.months || '',
        'Total Rate': data.total_rate || '',
        'Status': data.status || '',
        'Historical Journal Entry': data.historical_journal_entry || '',
        'Amortization Journal Entry': data.amortization_journal_entry || '',
        'Related Billing Schedule': data.related_billing_schedule || '',
        'Subsidiary': data.subsidiary || '',
        'CCS Product Type': data.ccs_product_type || '',
        'BWID Project': data.bwid_project || '',
        'Phase': data.phase || '',
        'Effective Date': data.effective_date || '',
        'Expiration Date': data.expiration_date || '',
        'Contract Value': data.contract_value || '',
        'Payment Terms': data.payment_terms || '',
        'Termination Clauses': data.termination_clauses || '',
        'Governing Law': data.governing_law || '',
        'Signatures Present': data.signatures_present !== null ? (data.signatures_present ? 'Yes' : 'No') : '',
        'Parties': data.parties_involved?.map(p => p.name).join(', ') || '',
        'Key Obligations': data.key_obligations?.join(' | ') || '',
        'Special Conditions': data.special_conditions?.join(' | ') || '',
      };
    });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Auto-size columns
  const maxWidth = 50;
  const wscols = Object.keys(excelData[0] || {}).map(key => ({
    wch: Math.min(
      maxWidth,
      Math.max(
        key.length,
        ...excelData.map(row => String(row[key] || '').length)
      )
    )
  }));
  ws['!cols'] = wscols;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Contracts');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `contract_extraction_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, filename);
};

export const exportToJSON = (results) => {
  // Filter successful results
  const jsonData = results
    .filter(result => result.success)
    .map(result => ({
      source_file: result.source_file,
      processing_time: result.processing_time,
      ...result.data
    }));

  // Create blob and download
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.download = `contract_extraction_${timestamp}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
