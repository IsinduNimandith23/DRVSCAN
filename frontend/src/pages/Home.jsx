import React, { useState, useEffect } from 'react'
import { ImageUploader } from '../components/features/ImageUploader'
import { ResultCard } from '../components/features/ResultCard'
import { Header } from '../components/layout/Header'

export function Home() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

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

  const handleAnalyze = async () => {
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

  return (
    <>
      <Header />
      <main className="container" style={{ paddingBottom: '3rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ImageUploader 
            file={file} 
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            isLoading={isLoading}
          />
          
          {error && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fee2e2', 
              border: '1px solid #fecaca', 
              borderRadius: '0.5rem', 
              color: '#dc2626',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {result && <ResultCard result={result} />}
        </div>
      </main>
    </>
  )
}
