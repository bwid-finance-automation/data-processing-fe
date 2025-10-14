import { useState, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [previousFile, setPreviousFile] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const previousInputRef = useRef(null);
  const currentInputRef = useRef(null);

  const handleFileSelect = (event, setFile) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const handleCompare = async () => {
    if (!previousFile || !currentFile) {
      setError('Please select both files before comparing');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('old_file', previousFile);
    formData.append('new_file', currentFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/compare`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename) => {
    window.open(`${API_BASE_URL}/api/download/${filename}`, '_blank');
  };

  const handleReset = () => {
    setPreviousFile(null);
    setCurrentFile(null);
    setResult(null);
    setError(null);
    if (previousInputRef.current) previousInputRef.current.value = '';
    if (currentInputRef.current) currentInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-ocean-50 to-primary-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-blue-glow mb-4">
            <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-ocean-600 bg-clip-text text-transparent mb-2">
            Excel Comparison Tool
          </h1>
          <p className="text-lg text-primary-600 font-medium">
            Compare Excel files and get highlighted results instantly
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-primary-200/50 overflow-hidden">
          {/* File Upload Section */}
          <div className="p-8">
            <div className="space-y-6 mb-8">
              {/* Previous Month File */}
              <div className="group">
                <label className="flex items-center gap-2 text-base font-semibold text-primary-800 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Previous Month File
                </label>
                <div className="relative">
                  <input
                    ref={previousInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileSelect(e, setPreviousFile)}
                    className="hidden"
                    id="previous-file"
                  />
                  <label
                    htmlFor="previous-file"
                    className="flex items-center justify-center gap-3 w-full px-6 py-4 text-base font-medium text-primary-700 bg-gradient-to-r from-primary-50 to-ocean-50 border-2 border-primary-300 rounded-xl cursor-pointer hover:from-primary-100 hover:to-ocean-100 hover:border-primary-500 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {previousFile ? previousFile.name : 'Choose Excel File'}
                  </label>
                </div>
              </div>

              {/* Current Month File */}
              <div className="group">
                <label className="flex items-center gap-2 text-base font-semibold text-ocean-800 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Current Month File
                </label>
                <div className="relative">
                  <input
                    ref={currentInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileSelect(e, setCurrentFile)}
                    className="hidden"
                    id="current-file"
                  />
                  <label
                    htmlFor="current-file"
                    className="flex items-center justify-center gap-3 w-full px-6 py-4 text-base font-medium text-ocean-700 bg-gradient-to-r from-ocean-50 to-primary-50 border-2 border-ocean-300 rounded-xl cursor-pointer hover:from-ocean-100 hover:to-primary-100 hover:border-ocean-500 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {currentFile ? currentFile.name : 'Choose Excel File'}
                  </label>
                </div>
              </div>
            </div>

            {/* Compare Button */}
            <button
              onClick={handleCompare}
              disabled={loading || !previousFile || !currentFile}
              className="w-full bg-gradient-to-r from-primary-600 via-ocean-500 to-primary-600 hover:from-primary-700 hover:via-ocean-600 hover:to-primary-700 text-white text-lg font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-ocean-glow disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Comparing Files...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Compare Files
                </span>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-8 mb-8">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-base font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="border-t-2 border-primary-200 bg-gradient-to-br from-primary-50 via-ocean-50 to-primary-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
                  <svg className="w-7 h-7 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Comparison Results
                </h2>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-900 px-4 py-2 rounded-xl bg-white hover:bg-primary-100 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Comparison
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg border-2 border-yellow-300 p-5 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-2 text-sm font-bold text-yellow-700 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Rows
                  </div>
                  <div className="text-3xl font-extrabold text-yellow-900">{result.statistics.new_rows}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border-2 border-blue-300 p-5 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-700 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Updated Rows
                  </div>
                  <div className="text-3xl font-extrabold text-blue-900">{result.statistics.updated_rows}</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border-2 border-green-300 p-5 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-700 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unchanged
                  </div>
                  <div className="text-3xl font-extrabold text-green-900">{result.statistics.unchanged_rows}</div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => handleDownload(result.output_file)}
                  className="group flex items-center justify-center gap-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-base font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Summary
                </button>

                <button
                  onClick={() => handleDownload(result.highlighted_file)}
                  className="group flex items-center justify-center gap-3 bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 text-white text-base font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Download Highlighted
                </button>
              </div>

              {/* File Info */}
              <div className="pt-5 border-t-2 border-primary-200">
                <div className="bg-white rounded-xl p-5 space-y-3 text-sm shadow-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-bold text-primary-800">Previous:</span>
                    <span className="text-primary-700 truncate font-medium">{result.old_filename}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-ocean-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-bold text-ocean-800">Current:</span>
                    <span className="text-ocean-700 truncate font-medium">{result.new_filename}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full shadow-lg border border-primary-200/50">
            <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-primary-800">FastAPI + React + Vite + Tailwind</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
