import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import './VideoResultCard.css'

export function VideoResultCard({ result, onPlayAlarm }) {
  const [expandedDetection, setExpandedDetection] = useState(null)
  const [alarmPlaying, setAlarmPlaying] = useState(false)

  // Sort detections by timestamp
  const sortedDetections = [...result.detections].sort((a, b) => a.timestamp - b.timestamp)

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High':
        return '#ef4444'
      case 'Medium':
        return '#f59e0b'
      case 'Low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const getSeverityBgColor = (severity) => {
    switch (severity) {
      case 'High':
        return '#fee2e2'
      case 'Medium':
        return '#fef3c7'
      case 'Low':
        return '#dcfce7'
      default:
        return '#f3f4f6'
    }
  }

  const handleTriggerAlarm = () => {
    setAlarmPlaying(true)
    if (onPlayAlarm) {
      onPlayAlarm()
    }
    setTimeout(() => setAlarmPlaying(false), 3000)
  }

  const getDistractionEmoji = (className) => {
    const emojiMap = {
      'texting_right': '📱',
      'talking_phone_right': '☎️',
      'texting_left': '📱',
      'talking_phone_left': '☎️',
      'operating_radio': '📻',
      'drinking': '🥤',
      'reaching_behind': '🫳',
      'hair_makeup': '💄',
      'talking_passenger': '💬',
      'safe_driving': '✅',
    }
    return emojiMap[className] || '⚠️'
  }

  // Show alarm if there are High severity detections
  const hasHighSeverity = result.detections.some(d => d.severity === 'High')

  return (
    <Card>
      <div className="result-container">
        <div className="result-header">
          <h2 className="result-title">📊 Video Analysis Results</h2>
          {hasHighSeverity && (
            <div className="alert-badge">
              🚨 ALERT
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Frames Analyzed</div>
            <div className="stat-value">{result.total_frames_analyzed}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Distracted Frames</div>
            <div className="stat-value" style={{ color: result.distracted_frames > 0 ? '#ef4444' : '#10b981' }}>
              {result.distracted_frames}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Distraction Rate</div>
            <div className="stat-value" style={{
              color: result.distraction_percentage > 50 ? '#ef4444' : result.distraction_percentage > 20 ? '#f59e0b' : '#10b981'
            }}>
              {result.distraction_percentage}%
            </div>
          </div>
        </div>

        {/* Alarm Trigger Section */}
        {hasHighSeverity && (
          <div className="alarm-section">
            <div className="alarm-warning">
              ⚠️ High severity distractions detected! Driver needs immediate attention.
            </div>
            <Button
              onClick={handleTriggerAlarm}
              className={`btn-alarm ${alarmPlaying ? 'playing' : ''}`}
            >
              {alarmPlaying ? '🔊 Alarm Active!' : '🔔 Trigger Alarm'}
            </Button>
          </div>
        )}

        {/* Detections List */}
        {sortedDetections.length > 0 ? (
          <div className="detections-section">
            <h3 className="detections-title">
              📋 Complete Timeline ({sortedDetections.length} frames)
            </h3>

            <div className="detections-list">
              {sortedDetections.map((detection, idx) => (
                <div
                  key={idx}
                  className="detection-item"
                  style={{ 
                    borderLeft: `4px solid ${getSeverityColor(detection.severity)}`,
                    backgroundColor: detection.class === 'safe_driving' ? '#f0fdf4' : '#f9fafb'
                  }}
                  onClick={() => setExpandedDetection(expandedDetection === idx ? null : idx)}
                >
                  <div className="detection-header">
                    <div className="detection-emoji">
                      {getDistractionEmoji(detection.class)}
                    </div>
                    <div className="detection-info-compact">
                      <div className="detection-time">
                        ⏱️ {detection.timestamp_formatted}
                      </div>
                      <div className="detection-class">
                        {detection.class === 'safe_driving' ? '✅ Driver Focused' : detection.class.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div
                      className="detection-severity-badge"
                      style={{
                        backgroundColor: getSeverityBgColor(detection.severity),
                        color: getSeverityColor(detection.severity),
                      }}
                    >
                      {detection.severity}
                    </div>
                  </div>

                  {expandedDetection === idx && (
                    <div className="detection-details">
                      <p><strong>Confidence:</strong> {(detection.confidence * 100).toFixed(1)}%</p>
                      <p><strong>Frame:</strong> #{detection.frame_number}</p>
                      <p><strong>Details:</strong> {detection.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-detections">
            <div className="check-icon">✅</div>
            <p className="no-detections-text">No distractions detected!</p>
            <p className="no-detections-subtext">Driver appears to be focused on the road.</p>
          </div>
        )}
      </div>
    </Card>
  )
}
