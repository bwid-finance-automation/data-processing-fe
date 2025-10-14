import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { processPythonAnalysis } from '@services/varianceApi';

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
      <div className="bg-white dark:bg-[#222] rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('uploadRun')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Excel Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('excelLabel')}
            </label>
            <input
              type="file"
              accept=".xlsx"
              multiple
              onChange={handleExcelChange}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('excelHelp')}</p>
            {excelFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected files:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                  {excelFiles.map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Mapping File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('mappingLabel')}
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleMappingChange}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('mappingHelp')}</p>
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
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={status === 'uploading' || status === 'processing'}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {t('processBtn')}
            </button>

            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                status === 'idle' ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                status === 'uploading' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                status === 'processing' ? 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100' :
                status === 'done' ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100' :
                'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100'
              }`}
            >
              {t(status)}
            </span>
          </div>

          {/* Progress Bar */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{progress}%</p>
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
      <div className="bg-white dark:bg-[#222] rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Python Analysis Info</h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p className="text-sm">
            Python Analysis uses predefined rules and thresholds to analyze variance in your financial data.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Customizable materiality thresholds</li>
              <li>Configurable variance percentages</li>
              <li>Support for multiple Excel files</li>
              <li>Mapping file for correlation rules</li>
              <li>Instant download of results</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Configuration Tips:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Set materiality in VND (e.g., 1,000,000,000)</li>
              <li>Use decimals or percentages (0.05 = 5%)</li>
              <li>Separate code prefixes with commas</li>
              <li>Leave optional fields empty for defaults</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PythonAnalysis;