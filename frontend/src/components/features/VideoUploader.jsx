import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import './VideoUploader.css'

export function VideoUploader({ file, onFileSelect, onAnalyze, onClear, isLoading }) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const videoFile = e.dataTransfer.files[0]
      if (videoFile.type.startsWith('video/')) {
        onFileSelect(videoFile)
      } else {
        alert('Please drop a valid video file')
      }
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const videoFile = e.target.files[0]
      if (videoFile.type.startsWith('video/')) {
        onFileSelect(videoFile)
      } else {
        alert('Please select a valid video file')
      }
    }
  }

  return (
    <Card>
      <div className="upload-container">
        <h2 className="upload-title">📹 Analyze Driving Video</h2>
        
        {!file ? (
          <div
            className={`drag-drop-area ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="drag-drop-content">
              <div className="drag-drop-icon">📤</div>
              <p className="drag-drop-text">Drag & drop your video here</p>
              <p className="drag-drop-subtext">or click to select (MP4, AVI, MOV, MKV)</p>
            </div>
            <input
              type="file"
              id="video-input"
              accept="video/*"
              className="file-input"
              onChange={handleFileInput}
              disabled={isLoading}
            />
            <label htmlFor="video-input" className="file-input-label">
              Choose Video
            </label>
          </div>
        ) : (
          <div className="file-info">
            <div className="file-icon">🎬</div>
            <div className="file-details">
              <p className="file-name">{file.name}</p>
              <p className="file-size">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button onClick={onClear} disabled={isLoading} className="btn-remove">
              ✕
            </Button>
          </div>
        )}

        {file && (
          <div className="button-group">
            <Button
              onClick={onAnalyze}
              disabled={isLoading}
              className="btn-analyze"
            >
              {isLoading ? '⏳ Analyzing...' : '🔍 Analyze Video'}
            </Button>
            <p className="analysis-note">
              Processing will analyze frames every 10 frames for accuracy
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
