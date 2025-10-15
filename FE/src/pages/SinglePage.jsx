import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  createSession,
  cleanupSession,
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
} from '../services/api'
import FileUploader from '../components/FileUploader'
import {
  FileText,
  Database,
  Upload,
  Play,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import './SinglePage.css'

const SinglePage = () => {
  // State
  const [activeSection, setActiveSection] = useState('dashboard')
  const [systemStatus, setSystemStatus] = useState(null)
  const [masterDataStatus, setMasterDataStatus] = useState(null)
  const [inputFiles, setInputFiles] = useState([])
  const [masterDataFiles, setMasterDataFiles] = useState([])
  const [outputFiles, setOutputFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [loading, setLoading] = useState(true)

  // Create session and load data on mount, cleanup on unmount
  useEffect(() => {
    const initSession = async () => {
      try {
        await createSession()
        await loadAllData()
      } catch (error) {
        console.error('Failed to create session:', error)
        toast.error('Failed to initialize session')
      }
    }

    initSession()

    // Cleanup session when component unmounts or page closes
    return () => {
      cleanupSession().catch(console.error)
    }
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [sysStatus, masterStatus, input, masterData, output] = await Promise.all([
        getSystemStatus(),
        getMasterDataStatus(),
        listInputFiles(),
        listMasterDataFiles(),
        listOutputFiles(),
      ])
      setSystemStatus(sysStatus)
      setMasterDataStatus(masterStatus)
      setInputFiles(input)
      setMasterDataFiles(masterData)
      setOutputFiles(output)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAllData()
    toast.info('Data refreshed')
  }

  // Upload handlers
  const handleInputFilesSelected = async (files) => {
    setUploading(true)
    try {
      for (const file of files) {
        await uploadInputFile(file)
        toast.success(`Uploaded: ${file.name}`)
      }
      await loadAllData()
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleMasterDataFilesSelected = async (files) => {
    setUploading(true)
    try {
      for (const file of files) {
        await uploadMasterDataFile(file)
        toast.success(`Uploaded: ${file.name}`)
      }
      await loadAllData()
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileType, filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return

    try {
      await deleteFile(fileType, filename)
      toast.success(`Deleted: ${filename}`)
      await loadAllData()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    }
  }

  const handleDownload = async (filename, fileType = 'output') => {
    setDownloading(filename)
    try {
      const blob = await downloadFile(fileType, filename)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(`Downloaded: ${filename}`)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    } finally {
      setDownloading(null)
    }
  }

  const handleProcess = async () => {
    if (inputFiles.length === 0) {
      toast.warning('Please upload input files first')
      return
    }

    setProcessing(true)
    setProcessResult(null)

    try {
      const response = await processBilling()

      if (response.success) {
        setProcessResult(response)
        toast.success('Processing completed successfully!')
        await loadAllData()
      } else {
        toast.error(response.error || 'Processing failed')
        setProcessResult(response)
      }
    } catch (error) {
      console.error('Error processing:', error)
      toast.error('Processing failed: ' + error.message)
      setProcessResult({
        success: false,
        error: error.message,
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const isMasterDataReady =
    masterDataStatus?.customers_count > 0 &&
    masterDataStatus?.units_count > 0 &&
    masterDataStatus?.subsidiary_config_exists &&
    masterDataStatus?.utility_mapping_exists

  if (loading) {
    return (
      <div className="single-page">
        <div className="loading-container">
          <div className="loading"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="single-page">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>Utility Billing Automation</h1>
          <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveSection('dashboard')}
        >
          <Database size={18} />
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeSection === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveSection('upload')}
        >
          <Upload size={18} />
          Upload Files
        </button>
        <button
          className={`tab-btn ${activeSection === 'process' ? 'active' : ''}`}
          onClick={() => setActiveSection('process')}
        >
          <Play size={18} />
          Process
        </button>
        <button
          className={`tab-btn ${activeSection === 'results' ? 'active' : ''}`}
          onClick={() => setActiveSection('results')}
        >
          <FileText size={18} />
          Results
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div className="section">
            <h2 className="section-title">System Overview</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FileText size={32} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Input Files</div>
                  <div className="stat-value">{inputFiles.length}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Database size={32} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Master Data Files</div>
                  <div className="stat-value">{masterDataFiles.length}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FileText size={32} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Output Files</div>
                  <div className="stat-value">{outputFiles.length}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Master Data Status</h3>
              <div className="status-grid">
                <div className="status-item">
                  {isMasterDataReady ? (
                    <CheckCircle className="status-icon success" size={24} />
                  ) : (
                    <AlertCircle className="status-icon warning" size={24} />
                  )}
                  <div>
                    <div className="status-label">System Status</div>
                    <div className="status-value">
                      {isMasterDataReady ? 'Ready' : 'Configuration Required'}
                    </div>
                  </div>
                </div>

                <div className="status-item">
                  <div>
                    <div className="status-label">Customers</div>
                    <div className="status-value">
                      {masterDataStatus?.customers_count || 0}
                    </div>
                  </div>
                </div>

                <div className="status-item">
                  <div>
                    <div className="status-label">Active Units</div>
                    <div className="status-value">
                      {masterDataStatus?.units_count || 0}
                    </div>
                  </div>
                </div>

                <div className="status-item">
                  <div>
                    <div className="status-label">Last Updated</div>
                    <div className="status-value">
                      {masterDataStatus?.last_updated
                        ? new Date(masterDataStatus.last_updated).toLocaleString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {!isMasterDataReady && (
                <div className="alert alert-warning">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Action Required:</strong> Please upload master data files
                    before processing.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* UPLOAD SECTION */}
        {activeSection === 'upload' && (
          <div className="section">
            <h2 className="section-title">Upload Files</h2>

            {/* Input Files */}
            <div className="card">
              <h3 className="card-title">Input Files (Utility Readings)</h3>
              <p className="card-description">
                Upload water/electricity reading files. Supports North and South formats.
              </p>
              <FileUploader onFilesSelected={handleInputFilesSelected} multiple={true} />
              {uploading && (
                <div className="uploading-status">
                  <div className="loading"></div>
                  <span>Uploading files...</span>
                </div>
              )}
            </div>

            {inputFiles.length > 0 && (
              <div className="card">
                <h3 className="card-title">Uploaded Input Files ({inputFiles.length})</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inputFiles.map((file) => (
                      <tr key={file.filename}>
                        <td>
                          <div className="file-name">
                            <FileText size={16} />
                            {file.filename}
                          </div>
                        </td>
                        <td>{formatFileSize(file.size)}</td>
                        <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteFile('input', file.filename)}
                            title="Delete file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Master Data Files */}
            <div className="card">
              <h3 className="card-title">Master Data Files</h3>
              <p className="card-description">
                Upload: Customers_Master.xlsx, UnitForLease_Master.xlsx, Config_Mapping.xlsx
              </p>
              <FileUploader
                onFilesSelected={handleMasterDataFilesSelected}
                multiple={true}
              />
            </div>

            {masterDataFiles.length > 0 && (
              <div className="card">
                <h3 className="card-title">
                  Uploaded Master Data Files ({masterDataFiles.length})
                </h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterDataFiles.map((file) => (
                      <tr key={file.filename}>
                        <td>
                          <div className="file-name">
                            <FileText size={16} />
                            {file.filename}
                          </div>
                        </td>
                        <td>{formatFileSize(file.size)}</td>
                        <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteFile('master-data', file.filename)}
                            title="Delete file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROCESS SECTION */}
        {activeSection === 'process' && (
          <div className="section">
            <h2 className="section-title">Process Billing</h2>

            <div className="card">
              <h3 className="card-title">Ready to Process</h3>

              {inputFiles.length === 0 ? (
                <div className="alert alert-warning">
                  <AlertCircle size={20} />
                  <div>
                    <strong>No input files found</strong>
                    <p>Please upload input files before processing.</p>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">
                  <CheckCircle size={20} />
                  <div>
                    <strong>{inputFiles.length} file(s) ready for processing</strong>
                    <p>Click the button below to start processing.</p>
                  </div>
                </div>
              )}

              <div className="file-list">
                <h4>Input Files:</h4>
                <ul>
                  {inputFiles.map((file) => (
                    <li key={file.filename}>{file.filename}</li>
                  ))}
                </ul>
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={handleProcess}
                disabled={processing || inputFiles.length === 0}
              >
                {processing ? (
                  <>
                    <div className="loading"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Start Processing
                  </>
                )}
              </button>
            </div>

            {processResult && (
              <div className="card">
                <h3 className="card-title">Processing Results</h3>

                {processResult.success ? (
                  <>
                    <div className="alert alert-success">
                      <CheckCircle size={20} />
                      <div>
                        <strong>Processing completed successfully!</strong>
                        <p>{processResult.message}</p>
                      </div>
                    </div>

                    {processResult.stats && (
                      <div className="stats-grid">
                        <div className="stat-item">
                          <div className="stat-label">Input Records</div>
                          <div className="stat-value">
                            {processResult.stats.total_input_records}
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Invoices Generated</div>
                          <div className="stat-value">
                            {processResult.stats.total_invoices}
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Line Items</div>
                          <div className="stat-value">
                            {processResult.stats.total_line_items}
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Processing Time</div>
                          <div className="stat-value">
                            {processResult.stats.processing_time_seconds.toFixed(2)}s
                          </div>
                        </div>
                      </div>
                    )}

                    {processResult.validation_issues &&
                      processResult.validation_issues.length > 0 && (
                        <div className="alert alert-warning">
                          <AlertCircle size={20} />
                          <div>
                            <strong>
                              {processResult.validation_issues.length} validation issue(s)
                              found
                            </strong>
                            <p>Review the validation report for details.</p>
                          </div>
                        </div>
                      )}

                    <button
                      className="btn btn-success"
                      onClick={() => setActiveSection('results')}
                    >
                      View Results
                    </button>
                  </>
                ) : (
                  <div className="alert alert-error">
                    <AlertCircle size={20} />
                    <div>
                      <strong>Processing failed</strong>
                      <p>{processResult.error || processResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RESULTS SECTION */}
        {activeSection === 'results' && (
          <div className="section">
            <h2 className="section-title">Results & Downloads</h2>

            <div className="card">
              <h3 className="card-title">Output Files</h3>

              {outputFiles.length === 0 ? (
                <div className="empty-state">
                  <FileText size={64} />
                  <h4>No output files yet</h4>
                  <p>Process utility billing files to generate ERP output files.</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Generated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outputFiles.map((file) => (
                      <tr key={file.filename}>
                        <td>
                          <div className="file-name">
                            <FileText size={16} />
                            {file.filename}
                          </div>
                        </td>
                        <td>{formatFileSize(file.size)}</td>
                        <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDownload(file.filename)}
                            disabled={downloading === file.filename}
                          >
                            {downloading === file.filename ? (
                              <>
                                <div className="loading"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download size={16} />
                                Download
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h3 className="card-title">About Output Files</h3>
              <div className="info-grid">
                <div className="info-item">
                  <h4>ERP CSV Format</h4>
                  <p>
                    Output files are formatted with 45 columns ready for direct import into
                    your ERP system.
                  </p>
                </div>
                <div className="info-item">
                  <h4>Validation Reports</h4>
                  <p>
                    Validation reports contain details about data matching and any issues
                    found during processing.
                  </p>
                </div>
                <div className="info-item">
                  <h4>File Naming</h4>
                  <p>
                    Files are named with timestamp: INV_ERP_YYYYMMDD_HHMMSS.csv for easy
                    identification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default SinglePage
