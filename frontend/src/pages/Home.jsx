import React, { useState, useEffect } from 'react'
import { ImageUploader } from '../components/features/ImageUploader'
import { VideoUploader } from '../components/features/VideoUploader'
import { ResultCard } from '../components/features/ResultCard'
import { VideoResultCard } from '../components/features/VideoResultCard'
import { Header } from '../components/layout/Header'
import { alarmSound } from '../utils/alarmSound'

export function Home() {
  const [analysisMode, setAnalysisMode] = useState('image') // 'image' or 'video'
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      alarmSound.initAudio()
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (selectedFile) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    if (selectedFile) {
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      setResult(null)
      setError(null)
    } else {
      setFile(null)
      setPreviewUrl(null)
    }
  }

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
  }

  const handleAnalyzeImage = async () => {
    if (!file || isLoading) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('http://localhost:3000/api/detect', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      const data = await response.json()

      if (!data.severity || typeof data.score !== 'number' || !data.explanation) {
        throw new Error('Invalid response format')
      }

      setResult(data)
    } catch (err) {
      setError('Could not analyze this image. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeVideo = async () => {
    if (!file || isLoading) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('frame_interval', 10)
      formData.append('severity_threshold', 'Low')

      const response = await fetch('http://localhost:3000/api/analyze-video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Request failed')
      }

      const data = await response.json()

      if (!data.detections || typeof data.distraction_percentage !== 'number') {
        throw new Error('Invalid response format')
      }

      setResult(data)

      // Play alarm if high severity detected
      if (data.detections.some((d) => d.severity === 'High')) {
        alarmSound.playAlarm(3000, 800, 600)
      }
    } catch (err) {
      setError(err.message || 'Could not analyze this video. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayAlarm = () => {
    alarmSound.playAlarm(3000, 800, 600)
  }

  return (
    <>
      <Header />
      <main className="container" style={{ paddingBottom: '3rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Mode Selector */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <button
              onClick={() => {
                setAnalysisMode('image')
                handleClear()
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                backgroundColor: analysisMode === 'image' ? '#3b82f6' : '#e5e7eb',
                color: analysisMode === 'image' ? 'white' : '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              📷 Image
            </button>
            <button
              onClick={() => {
                setAnalysisMode('video')
                handleClear()
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                backgroundColor: analysisMode === 'video' ? '#3b82f6' : '#e5e7eb',
                color: analysisMode === 'video' ? 'white' : '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              📹 Video
            </button>
          </div>

          {/* Image Analysis */}
          {analysisMode === 'image' && (
            <>
              <ImageUploader
                file={file}
                previewUrl={previewUrl}
                onFileSelect={handleFileSelect}
                onAnalyze={handleAnalyzeImage}
                onClear={handleClear}
                isLoading={isLoading}
              />

              {error && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    color: '#dc2626',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              {result && result.class && <ResultCard result={result} />}
            </>
          )}

          {/* Video Analysis */}
          {analysisMode === 'video' && (
            <>
              <VideoUploader
                file={file}
                onFileSelect={handleFileSelect}
                onAnalyze={handleAnalyzeVideo}
                onClear={handleClear}
                isLoading={isLoading}
              />

              {error && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    color: '#dc2626',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              {result && result.detections !== undefined && (
                <VideoResultCard result={result} onPlayAlarm={handlePlayAlarm} />
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
