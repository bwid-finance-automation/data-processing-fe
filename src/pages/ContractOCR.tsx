import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from '@components/contract-ocr/FileUpload';
import ProcessingStatus from '@components/contract-ocr/ProcessingStatus';
import ResultsTable from '@components/contract-ocr/ResultsTable';
import { processContracts, processContractWithUnits, exportContractWithUnitsToExcel } from '@services/contract-ocr/contract-ocr-apis';
import { exportToExcel, exportToJSON } from '@utils/contract-ocr/exportUtils';
import ModuleHistory from '@components/common/ModuleHistory';

export default function ContractOCR() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const excelFileRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [unitBreakdownFile, setUnitBreakdownFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    document.title = `${t('contractOCRProject')} - BW Industrial`;
  }, [t]);

  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
    setResults(null);
  };

  const handleUnitBreakdownFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUnitBreakdownFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);

    try {
      if (unitBreakdownFile && files.length === 1) {
        console.log('Processing with unit breakdown...');
        setProgress({ current: 0, total: 1 });

        const data = await processContractWithUnits(
          files[0],
          unitBreakdownFile,
          (uploadProgress) => {
            console.log(`Upload progress: ${uploadProgress}%`);
          }
        );

        setResults({
          success: data.success,
          total_files: data.total_units,
          successful: data.success ? data.total_units : 0,
          failed: data.success ? 0 : 1,
          results: data.unit_contracts.map(contract => ({
            success: true,
            data: contract,
            source_file: `${contract.unit_for_lease} - ${files[0].name}`
          })),
          unit_breakdown_mode: true,
          gfa_validation: data.gfa_validation,
          base_contract: data.base_contract
        });
      } else {
        console.log('Processing batch contracts...');
        setProgress({ current: 0, total: files.length });

        const data = await processContracts(files, (current, total) => {
          setProgress({ current, total });
        });

        setResults(data);
      }

    } catch (error) {
      console.error('Error processing contracts:', error);
      alert('Error processing contracts: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportExcel = async () => {
    if (!results || !results.results) {
      alert('Please process contracts first before exporting');
      return;
    }

    try {
      if (results.unit_breakdown_mode && unitBreakdownFile && files.length === 1) {
        console.log('Exporting with unit breakdown using backend...');
        await exportContractWithUnitsToExcel(files[0], unitBreakdownFile);
        alert('Excel file downloaded successfully with unit information!');
      } else {
        exportToExcel(results.results);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel: ' + error.message);
    }
  };

  const handleExportJSON = () => {
    if (results && results.results) {
      exportToJSON(results.results);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setUnitBreakdownFile(null);
    setResults(null);
    setProgress({ current: 0, total: 0 });
    if (excelFileRef.current) excelFileRef.current.value = '';
  };

  const handleRemoveExcel = () => {
    setUnitBreakdownFile(null);
    if (excelFileRef.current) excelFileRef.current.value = '';
    setResults(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen theme-bg-app py-8 px-6">
      <div className="w-full max-w-[85vw] mx-auto">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/project/2')}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 theme-surface rounded-lg border border-[color:var(--app-border)] hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        >
          <span className="text-lg font-bold">←</span>
          <span className="font-medium">{t('backButton')}</span>
        </motion.button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold theme-text-primary mb-2">
            {t('contractOCRProject')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('contractOCRDesc')}
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <FileUpload
            onFilesSelected={handleFilesSelected}
            selectedFiles={files}
            onProcess={handleProcess}
            onClear={handleClear}
            processing={processing}
          />
        </div>

        {/* Optional Unit Breakdown Excel */}
        <div className="mb-8">
          <div className="bg-[#f7f6f3] dark:bg-[#222] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#222] dark:text-[#f5efe6] flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Unit Breakdown Excel (Optional)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {files.length === 1
                    ? 'Upload Excel to create individual contracts for each unit'
                    : 'Only available when uploading a single contract file'
                  }
                </p>
              </div>
            </div>

            {files.length === 1 && (
              <div className="space-y-3">
                {!unitBreakdownFile ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input
                      ref={excelFileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleUnitBreakdownFileChange}
                      disabled={processing}
                      className="hidden"
                      id="excel-file-input"
                    />
                    <label htmlFor="excel-file-input" className="cursor-pointer block">
                      <svg className="mx-auto h-12 w-12 text-green-500 dark:text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-[#222] dark:text-[#f5efe6] font-medium mb-1">
                        Click to select Excel file
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Required columns: Unit, GFA
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="theme-surface p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-[#222] dark:text-[#f5efe6]">{unitBreakdownFile.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(unitBreakdownFile.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveExcel}
                        disabled={processing}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove Excel file"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {unitBreakdownFile && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        Processing will create individual contract records for each unit in the Excel file
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {files.length > 1 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Unit breakdown is only available for single contract processing</p>
              </div>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {processing && (
          <div className="mb-8">
            <ProcessingStatus progress={progress} />
          </div>
        )}

        {/* GFA Validation (for unit breakdown mode) */}
        {results && results.unit_breakdown_mode && results.gfa_validation && !processing && (
          <div className={`mb-8 rounded-xl border p-6 ${
            results.gfa_validation.valid
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <h3 className="text-lg font-semibold mb-3 text-[#222] dark:text-[#f5efe6]">
              {results.gfa_validation.valid ? '✅ GFA Validation Passed' : '⚠️ GFA Validation Warning'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Contract GLA</p>
                <p className="font-medium text-[#222] dark:text-[#f5efe6]">
                  {results.gfa_validation.contract_gla?.toFixed(2)} sqm
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Unit GFA Total</p>
                <p className="font-medium text-[#222] dark:text-[#f5efe6]">
                  {results.gfa_validation.total_unit_gfa?.toFixed(2)} sqm
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Difference</p>
                <p className="font-medium text-[#222] dark:text-[#f5efe6]">
                  {results.gfa_validation.difference?.toFixed(2)} sqm ({results.gfa_validation.difference_pct?.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Tolerance</p>
                <p className="font-medium text-[#222] dark:text-[#f5efe6]">
                  {results.gfa_validation.tolerance_pct}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && !processing && (
          <div className="mb-8">
            <ResultsTable
              results={results}
              onExportExcel={handleExportExcel}
              onExportJSON={handleExportJSON}
            />
          </div>
        )}

        {/* Empty State */}
        {!processing && !results && files.length === 0 && (
          <div className="text-center py-16 bg-[#f7f6f3] dark:bg-[#222] rounded-xl border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="mt-6 text-xl font-medium text-[#222] dark:text-[#f5efe6]">
              {t('noContractsUploaded') || 'No contracts uploaded'}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('uploadContractsToStart') || 'Upload contract files to get started with extraction'}
            </p>
          </div>
        )}

        {/* History Section */}
        <ModuleHistory
          moduleKey="contracts"
          refreshTrigger={results}
          className="mt-6"
        />
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400 text-sm border-t border-[color:var(--app-border)]"
      >
        <p>{t('contractOCRSystem')}</p>
      </motion.footer>
    </div>
  );
}
