import * as XLSX from 'xlsx';

export const exportToExcel = (results) => {
  // Flatten the results data for Excel - with rate periods (normalized format)
  const excelData = [];

  results
    .filter(result => result.success)
    .forEach(result => {
      const data = result.data || {};
      const ratePeriods = data.rate_periods || [];

      // Base data that's the same for all rows from this contract
      const baseData = {
        'Customer Name': data.customer_name || data.tenant || '',
        'Contract No': data.contract_number || '',
        'Contract Date': data.contract_date || '',
        'Payment term': data.payment_terms_details || '',
        'Tax rate': '', // Leave blank as requested
        'Unit': '', // Leave blank as requested
        'Booking fee': '', // Leave blank as requested
        'Deposit': data.deposit_amount || '',
        'Handover Date': data.handover_date || '',
      };

      // If no rate periods, create one row with basic info
      if (ratePeriods.length === 0) {
        excelData.push({
          ...baseData,
          'Rent from': '',
          'Rent to': '',
          'No. Month of rent': '',
          'FOC from': '',
          'FOC to': '',
          'No month of FOC': '',
          'GFA': data.gfa || '',
          'Unit price/month': '',
          'Monthly Rental fee': '',
          'Service charge per m²/month': '',
          'Total service charge per month': '',
        });
      } else {
        // Create one row per rate period (normalized format)
        ratePeriods.forEach((period) => {
          // Calculate months between start and end dates
          let monthsOfRent = '';
          let focFrom = '';
          let focTo = '';
          let monthsOfFOC = '';

          if (period.start_date && period.end_date) {
            try {
              const start = new Date(period.start_date);
              const end = new Date(period.end_date);

              // Calculate month-to-month billing periods
              const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

              // If end day >= start day, it's a complete month, otherwise partial
              let months;
              if (end.getDate() >= start.getDate()) {
                months = monthDiff + 1;
              } else {
                months = monthDiff;
              }

              // Ensure at least 1 month
              months = Math.max(1, months);
              monthsOfRent = months.toString();
            } catch (e) {
              // If date parsing fails, leave blank
            }
          }

          // Check for FOC using foc_from and foc_to fields
          if (period.foc_from && period.foc_to) {
            try {
              const focStart = new Date(period.foc_from);
              const focEnd = new Date(period.foc_to);

              // Calculate month-to-month billing periods (same logic as rent)
              const monthDiff = (focEnd.getFullYear() - focStart.getFullYear()) * 12 + (focEnd.getMonth() - focStart.getMonth());

              let focMonths;
              if (focEnd.getDate() >= focStart.getDate()) {
                focMonths = monthDiff + 1;
              } else {
                focMonths = monthDiff;
              }

              // Ensure at least 1 month
              focMonths = Math.max(1, focMonths);

              focFrom = period.foc_from;
              focTo = period.foc_to;
              monthsOfFOC = focMonths.toString();
            } catch (e) {
              // If date parsing fails, leave blank
            }
          }

          // Calculate total monthly rental fee: monthly_rate_per_sqm × gfa
          const monthlyRatePerSqm = period.monthly_rate_per_sqm || '';
          let totalMonthlyRentalFee = '';
          if (monthlyRatePerSqm && data.gfa) {
            try {
              const rate = parseFloat(monthlyRatePerSqm);
              const gfa = parseFloat(data.gfa);
              if (!isNaN(rate) && !isNaN(gfa) && gfa > 0) {
                totalMonthlyRentalFee = (rate * gfa).toString();
              }
            } catch (e) {
              // If calculation fails, leave blank
            }
          }

          // Service charge - get raw rate and calculate total
          const serviceChargeRate = period.service_charge_rate_per_sqm || '';
          let totalServiceCharge = '';
          if (serviceChargeRate && data.gfa) {
            try {
              const rate = parseFloat(serviceChargeRate);
              const gfa = parseFloat(data.gfa);
              if (!isNaN(rate) && !isNaN(gfa) && gfa > 0) {
                totalServiceCharge = (rate * gfa).toString();
              }
            } catch (e) {
              // If calculation fails, leave blank
            }
          }

          excelData.push({
            ...baseData,
            'Rent from': period.start_date || '',
            'Rent to': period.end_date || '',
            'No. Month of rent': monthsOfRent,
            'FOC from': focFrom,
            'FOC to': focTo,
            'No month of FOC': monthsOfFOC,
            'GFA': data.gfa || '',
            'Unit price/month': monthlyRatePerSqm,
            'Monthly Rental fee': totalMonthlyRentalFee,
            'Service charge per m²/month': serviceChargeRate,
            'Total service charge per month': totalServiceCharge,
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
  // Filter successful results - with all fields including new Vietnamese contract fields
  const jsonData = results
    .filter(result => result.success)
    .map(result => {
      const data = result.data || {};
      return {
        source_file: result.source_file,
        contract_number: data.contract_number,
        customer_name: data.customer_name,
        contract_date: data.contract_date,
        handover_date: data.handover_date,
        deposit_amount: data.deposit_amount,
        payment_terms_details: data.payment_terms_details,
        gfa: data.gfa,
        gla_for_lease: data.gla_for_lease,
        service_charge_rate: data.service_charge_rate,
        service_charge_applies_to: data.service_charge_applies_to,
        service_charge_total: data.service_charge_total,
        type: data.type,
        tenant: data.tenant,
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
