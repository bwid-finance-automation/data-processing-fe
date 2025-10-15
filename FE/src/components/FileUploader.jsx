import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import './FileUploader.css'

const FileUploader = ({ onFilesSelected, accept = '.xlsx,.xls', multiple = true }) => {
  const onDrop = useCallback((acceptedFiles) => {
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple,
  })

  return (
    <div
      {...getRootProps()}
      className={`file-uploader ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload size={48} className="upload-icon" />
      {isDragActive ? (
        <p>Drop the files here...</p>
      ) : (
        <div className="upload-text">
          <p>Drag & drop Excel files here, or click to select files</p>
          <p className="upload-hint">Supported formats: .xlsx, .xls</p>
        </div>
      )}
    </div>
  )
}

export default FileUploader
