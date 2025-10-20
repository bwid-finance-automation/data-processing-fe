import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { processPythonAnalysis } from '@services/variance/variance-apis';

const PythonAnalysis = () => {
  const { t } = useTranslation();
  const [excelFiles, setExcelFiles] = useState([]);
  const [mappingFile, setMappingFile] = useState(null);
  const [config, setConfig] = useState({
    materiality_vnd: '',
    recurring_pct_threshold: '',
    revenue_opex_pct_threshold: '',
    bs_pct_threshold: '',
    recurring_code_prefixes: '',
    min_trend_periods: '',
    gm_drop_threshold_pct: '',
    dep_pct_only_prefixes: '',
    customer_column_hints: '',
  });
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, done, failed
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleExcelChange = (e) => {
    setExcelFiles(Array.from(e.target.files));
  };

  const handleMappingChange = (e) => {
    setMappingFile(e.target.files[0]);
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (excelFiles.length === 0) {
      alert(t('noExcelSelected'));
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setMessage('Uploading files...');

    const formData = new FormData();

    excelFiles.forEach((file) => {
      formData.append('excel_files', file);
    });

    if (mappingFile) {
      formData.append('mapping_file', mappingFile);
    }

    Object.entries(config).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    try {
      const blob = await processPythonAnalysis(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
        if (percentCompleted === 100) {
          setStatus('processing');
          setMessage('Processing analysis...');
        }
      });

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'variance_analysis_python.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('done');
      setMessage('Processing completed! File downloaded.');
      setProgress(100);
    } catch (error) {
      setStatus('failed');
      setMessage(`Error: ${error.response?.data?.detail || error.message}`);
      console.error('Analysis error:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-[#222] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('uploadRun')}</h2>
          <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Excel Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('excelLabel')}
            </label>

            {/* Custom File Upload Button */}
            <div className="relative">
              <input
                type="file"
                id="python-excel-upload"
                accept=".xlsx"
                multiple
                onChange={handleExcelChange}
                className="hidden"
              />
              <label
                htmlFor="python-excel-upload"
                className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  excelFiles.length > 0
                    ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    excelFiles.length > 0
                      ? 'bg-blue-500 dark:bg-blue-600'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {excelFiles.length > 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      )}
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {excelFiles.length > 0 ? `${excelFiles.length} file(s) selected` : 'Choose Excel files'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {excelFiles.length > 0 ? 'Click to change files' : 'Click to browse'}
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('excelHelp')}</p>

            {/* Selected Files List */}
            {excelFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {excelFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mapping File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('mappingLabel')}
            </label>

            {/* Custom Mapping File Upload Button */}
            <div className="relative">
              <input
                type="file"
                id="python-mapping-upload"
                accept=".xlsx"
                onChange={handleMappingChange}
                className="hidden"
              />
              <label
                htmlFor="python-mapping-upload"
                className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  mappingFile
                    ? 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    mappingFile
                      ? 'bg-purple-500 dark:bg-purple-600'
                      : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {mappingFile ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      )}
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {mappingFile ? 'Mapping file selected' : 'Choose mapping file (Optional)'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {mappingFile ? mappingFile.name : 'Click to browse'}
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('mappingHelp')}</p>

            {/* Selected Mapping File */}
            {mappingFile && (
              <div className="mt-3">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{mappingFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(mappingFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t-2 border-gray-200 dark:border-gray-700 my-4"></div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('materiality')}
              </label>
              <input
                type="number"
                name="materiality_vnd"
                value={config.materiality_vnd}
                onChange={handleConfigChange}
                placeholder="1000000000"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('materialityHelp')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('recurringPct')}
              </label>
              <input
                type="text"
                name="recurring_pct_threshold"
                value={config.recurring_pct_threshold}
                onChange={handleConfigChange}
                placeholder="0.05 or 5%"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('recurringPctHelp')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('revenuePct')}
              </label>
              <input
                type="text"
                name="revenue_opex_pct_threshold"
                value={config.revenue_opex_pct_threshold}
                onChange={handleConfigChange}
                placeholder="0.10 or 10%"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('revenuePctHelp')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('bsPct')}
              </label>
              <input
                type="text"
                name="bs_pct_threshold"
                value={config.bs_pct_threshold}
                onChange={handleConfigChange}
                placeholder="0.05 or 5%"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('bsPctHelp')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('prefixes')}
              </label>
              <input
                type="text"
                name="recurring_code_prefixes"
                value={config.recurring_code_prefixes}
                onChange={handleConfigChange}
                placeholder="6321,635,515"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('prefixesHelp')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('minTrend')}
              </label>
              <input
                type="number"
                name="min_trend_periods"
                value={config.min_trend_periods}
                onChange={handleConfigChange}
                placeholder="3"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('minTrendHelp')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('gmDropLabel')}
              </label>
              <input
                type="text"
                name="gm_drop_threshold_pct"
                value={config.gm_drop_threshold_pct}
                onChange={handleConfigChange}
                placeholder="0.01 or 1%"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('gmDropHelp')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('depPctLabel')}
              </label>
              <input
                type="text"
                name="dep_pct_only_prefixes"
                value={config.dep_pct_only_prefixes}
                onChange={handleConfigChange}
                placeholder="217,632"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('depPctHelp')}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 italic">{t('pctNote')}</p>

          <div className="border-t-2 border-gray-200 dark:border-gray-700 my-4"></div>

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={status === 'uploading' || status === 'processing'}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              {t('processBtn')}
            </button>

            {status !== 'idle' && (
              <div className="flex items-center justify-center">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${
                    status === 'uploading' ? 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700' :
                    status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700' :
                    status === 'done' ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700' :
                    'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    status === 'uploading' ? 'bg-yellow-500 animate-pulse' :
                    status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    status === 'done' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}></span>
                  {t(status)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 min-w-[3rem] text-right">
                  {progress}%
                </span>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                status === 'done' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                status === 'failed' ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>

      {/* Info Panel */}
      <div className="bg-white dark:bg-[#222] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('pythonAnalysisInfo')}</h2>
          <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm leading-relaxed">
              {t('pythonAnalysisInfoDesc')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center">
              <span className="w-1 h-5 bg-purple-500 rounded-full mr-2"></span>
              {t('pythonFeatures')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature1')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature2')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature3')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature4')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature5')}</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-3 flex items-center">
              <span className="w-1 h-5 bg-amber-500 rounded-full mr-2"></span>
              {t('pythonConfigTips')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonTip1')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonTip2')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonTip3')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonTip4')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PythonAnalysis;