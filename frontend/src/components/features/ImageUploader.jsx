import React, { useRef } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import './ImageUploader.css'

export function ImageUploader({ file, previewUrl, onFileSelect, onAnalyze, onClear, isLoading }) {
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
       onFileSelect(droppedFile)
    }
  }

  const handleInputChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) onFileSelect(selected)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className="uploader-card">
      <CardHeader>
        <CardTitle>Upload Image</CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleInputChange}
          className="hidden-input"
          style={{ display: 'none' }}
        />

        {!file ? (
          <div 
            className="drop-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="icon-circle">
              <Upload size={24} />
            </div>
            <p className="drop-text-main">
              <span className="clickable">Click to upload</span> or drag and drop
            </p>
            <p className="drop-text-sub">SVG, PNG, JPG or GIF</p>
          </div>
        ) : (
          <div className="preview-container">
            {previewUrl && (
              <div className="image-wrapper">
                <img src={previewUrl} alt="Preview" />
                <button className="remove-btn" onClick={onClear} disabled={isLoading}>
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="file-details">
              <div className="file-info-row">
                <FileText size={16} className="text-secondary" />
                <span className="file-name">{file.name}</span>
              </div>
              <span className="file-size">{formatFileSize(file.size)}</span>
            </div>
          </div>
        )}

        <div className="actions-row">
          <Button 
            onClick={onAnalyze} 
            disabled={!file || isLoading} 
            isLoading={isLoading}
            className="action-btn"
          >
            Analyze Severity
          </Button>
          {(file) && (
            <Button 
                variant="secondary" 
                onClick={onClear} 
                disabled={isLoading}
                className="action-btn"
            >
                Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
