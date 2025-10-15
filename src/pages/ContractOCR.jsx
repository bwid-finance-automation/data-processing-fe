import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import FileUpload from '@components/contract-ocr/FileUpload';
import ProcessingStatus from '@components/contract-ocr/ProcessingStatus';
import ResultsTable from '@components/contract-ocr/ResultsTable';
import { processContracts } from '@services/contract-ocr/contract-ocr-apis';
import { exportToExcel, exportToJSON } from '@utils/contract-ocr/exportUtils';

export default function ContractOCR() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
    setResults(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setProgress({ current: 0, total: files.length });

    try {
      const data = await processContracts(files, (current, total) => {
        setProgress({ current, total });
      });

      setResults(data);
    } catch (error) {
      console.error('Error processing contracts:', error);
      alert('Error processing contracts: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportExcel = () => {
    if (results && results.results) {
      exportToExcel(results.results);
    }
  };

  const handleExportJSON = () => {
    if (results && results.results) {
      exportToJSON(results.results);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setResults(null);
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/project/2')}
          className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t('backButton')}</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#222] dark:text-[#f5efe6] mb-2">
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

        {/* Processing Status */}
        {processing && (
          <div className="mb-8">
            <ProcessingStatus progress={progress} />
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
      </div>
    </div>
  );
}
