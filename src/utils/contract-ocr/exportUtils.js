import * as XLSX from 'xlsx';

export const exportToExcel = (results) => {
  // Flatten the results data for Excel - with rate periods
  const excelData = [];

  results
    .filter(result => result.success)
    .forEach(result => {
      const data = result.data || {};
      const ratePeriods = data.rate_periods || [];

      // If no rate periods, create one row with basic info
      if (ratePeriods.length === 0) {
        excelData.push({
          'File Name': result.source_file || '',
          'Type': data.type || '',
          'Tenant': data.tenant || '',
          'GLA for Lease': data.gla_for_lease || '',
          'Start Date': '',
          'End Date': '',
          'Monthly Rate per Sqm': '',
          'Total Monthly Rate': '',
        });
      } else {
        // Create one row per rate period
        ratePeriods.forEach(period => {
          excelData.push({
            'File Name': result.source_file || '',
            'Type': data.type || '',
            'Tenant': data.tenant || '',
            'GLA for Lease': data.gla_for_lease || '',
            'Start Date': period.start_date || '',
            'End Date': period.end_date || '',
            'Monthly Rate per Sqm': period.monthly_rate_per_sqm || '',
            'Total Monthly Rate': period.total_monthly_rate || '',
          });
        });
      }
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
  // Filter successful results - with rate periods
  const jsonData = results
    .filter(result => result.success)
    .map(result => {
      const data = result.data || {};
      return {
        source_file: result.source_file,
        type: data.type,
        tenant: data.tenant,
        gla_for_lease: data.gla_for_lease,
        rate_periods: data.rate_periods || []
      };
    });

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
