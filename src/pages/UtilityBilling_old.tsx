import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, CloudArrowUpIcon, DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import {
  createSession,
  uploadInputFile,
  uploadMasterDataFile,
  listInputFiles,
  listMasterDataFiles,
  listOutputFiles,
  deleteFile,
  downloadFile,
  processBilling,
  getSystemStatus,
  getMasterDataStatus,
} from '@services/billingApi';

export default function UtilityBilling() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // File lists
  const [inputFiles, setInputFiles] = useState([]);
  const [masterDataFiles, setMasterDataFiles] = useState([]);
  const [outputFiles, setOutputFiles] = useState([]);

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);

  // Status
  const [systemStatus, setSystemStatus] = useState(null);
  const [masterDataStatus, setMasterDataStatus] = useState(null);

  // Processing results
  const [processingResult, setProcessingResult] = useState(null);

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setLoading(true);
      const response = await createSession();
      setSessionId(response.session_id);
      toast.success(t('sessionCreated'));
    } catch (error) {
      toast.error(t('sessionFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load file lists
  const loadFiles = async () => {
    if (!sessionId) return;

    try {
      const [input, masterData, output] = await Promise.all([
        listInputFiles(sessionId),
        listMasterDataFiles(sessionId),
        listOutputFiles(sessionId),
      ]);

      setInputFiles(input);
      setMasterDataFiles(masterData);
      setOutputFiles(output);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Load status
  const loadStatus = async () => {
    if (!sessionId) return;

    try {
      const [system, masterData] = await Promise.all([
        getSystemStatus(sessionId),
        getMasterDataStatus(sessionId),
      ]);

      setSystemStatus(system);
      setMasterDataStatus(masterData);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  // Reload data
  useEffect(() => {
    if (sessionId) {
      loadFiles();
      loadStatus();
    }
  }, [sessionId]);

  // Handle file upload
  const handleFileUpload = async (file, type) => {
    if (!sessionId) {
      toast.error(t('noActiveSession'));
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      const uploadFunction = type === 'input' ? uploadInputFile : uploadMasterDataFile;

      await uploadFunction(sessionId, file, (progress) => {
        setUploadProgress(progress);
      });

      toast.success(`${file.name} ${t('fileUploaded')}`);
      await loadFiles();
      await loadStatus();
    } catch (error) {
      toast.error(error.message || t('uploadFailed'));
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle file delete
  const handleFileDelete = async (fileType, filename) => {
    if (!sessionId) return;

    try {
      await deleteFile(sessionId, fileType, filename);
      toast.success(t('fileDeleted'));
      await loadFiles();
      await loadStatus();
    } catch {
      toast.error(t('deleteFailed'));
    }
  };

  // Handle file download
  const handleFileDownload = async (fileType, filename) => {
    if (!sessionId) return;

    try {
      await downloadFile(sessionId, fileType, filename);
      toast.success(t('fileDownloaded'));
    } catch {
      toast.error(t('downloadFailed'));
    }
  };

  // Handle process billing
  const handleProcessBilling = async () => {
    if (!sessionId) {
      toast.error(t('noActiveSession'));
      return;
    }

    try {
      setProcessing(true);
      toast.info(t('processingData'));

      const result = await processBilling(sessionId);

      if (result.success) {
        setProcessingResult(result);
        toast.success(t('processingSuccess'));
        await loadFiles();
        await loadStatus();
      } else {
        toast.error(result.message || t('processingFailed'));
        setProcessingResult(result);
      }
    } catch (error) {
      toast.error(error.message || t('processingFailed'));
    } finally {
      setProcessing(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // File upload component
  const FileUploadZone = ({ title, type, acceptedFiles = '.xlsx,.xls' }) => (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
      <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('dragDropOrClick')} {acceptedFiles}
      </p>
      <input
        type="file"
        accept={acceptedFiles}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) handleFileUpload(file, type);
          e.target.value = null;
        }}
        className="hidden"
        id={`upload-${type}`}
        disabled={loading}
      />
      <label
        htmlFor={`upload-${type}`}
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('uploading') : t('chooseFile')}
      </label>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
        </div>
      )}
    </div>
  );

  // File list component
  const FileList = ({ title, files, fileType }) => (
    <div className="theme-surface rounded-lg border border-[color:var(--app-border)] p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{title}</h3>
      {files.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noFilesUploaded')}</p>
      ) : (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 theme-surface-muted rounded-lg border border-[color:var(--app-border)]"
            >
              <div className="flex items-center gap-3 flex-1">
                <DocumentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.filename}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {formatDate(file.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(fileType === 'output' || fileType === 'validation') && (
                  <button
                    onClick={() => handleFileDownload(fileType, file.filename)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    title={t('download')}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                )}
                {(fileType === 'input' || fileType === 'master-data') && (
                  <button
                    onClick={() => handleFileDelete(fileType, file.filename)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title={t('delete')}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading && !sessionId) {
    return (
      <div className="min-h-screen theme-bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('initializingSession')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-app py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/project/2')}
          className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t('backToProjects')}</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold theme-text-primary mb-2">
            {t('utilityBillingTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('utilityBillingSubtitle')}
          </p>
        </div>

        {/* Status Cards */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">{t('inputFiles')}</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{systemStatus.input_files_count}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400">{t('masterDataFiles')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{systemStatus.master_data_files_count}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-600 dark:text-purple-400">{t('outputFiles')}</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{systemStatus.output_files_count}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('systemStatus')}</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 capitalize">{systemStatus.status}</p>
            </div>
          </div>
        )}

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUploadZone title={t('uploadCSInput')} type="input" />
          <FileUploadZone title={t('uploadMasterData')} type="master-data" />
        </div>

        {/* Master Data Status */}
        {masterDataStatus && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">{t('masterDataStatus')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">{t('customers')}: </span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {masterDataStatus.customers_count || t('notUploaded')}
                </span>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">{t('units')}: </span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {masterDataStatus.units_count || t('notUploaded')}
                </span>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">{t('config')}: </span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {masterDataStatus.subsidiary_config_exists ? '✓' : '✗'}
                </span>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">{t('lastUpdated')}: </span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {masterDataStatus.last_updated ? new Date(masterDataStatus.last_updated).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="mb-8">
          <button
            onClick={handleProcessBilling}
            disabled={processing || !sessionId || inputFiles.length === 0 || masterDataFiles.length === 0}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? t('processingBilling') : t('processBilling')}
          </button>
          {inputFiles.length === 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{t('uploadAtLeastOneInput')}</p>
          )}
          {masterDataFiles.length === 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{t('uploadMasterDataFiles')}</p>
          )}
        </div>

        {/* Processing Result */}
        {processingResult && (
          <div className={`border rounded-lg p-6 mb-8 ${
            processingResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${
              processingResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
            }`}>
              {processingResult.success ? t('processingComplete') : t('processingFailed')}
            </h3>
            <p className={`mb-4 ${
              processingResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {processingResult.message}
            </p>
            {processingResult.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('inputRecords')}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{processingResult.stats.total_input_records}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('invoicesGenerated')}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{processingResult.stats.total_invoices}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('lineItems')}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{processingResult.stats.total_line_items}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('processingTime')}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{processingResult.stats.processing_time_seconds.toFixed(2)}s</p>
                </div>
              </div>
            )}
            {processingResult.validation_issues && processingResult.validation_issues.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                  {processingResult.validation_issues.length} {t('validationIssues')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* File Lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FileList title={t('inputFiles')} files={inputFiles} fileType="input" />
          <FileList title={t('masterDataFiles')} files={masterDataFiles} fileType="master-data" />
          <FileList title={t('outputFiles')} files={outputFiles} fileType="output" />
        </div>
      </div>
    </div>
  );
}
