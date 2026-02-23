import React from 'react'
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import './ResultCard.css'

export function ResultCard({ result }) {
  if (!result) return null

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'Low':
        return {
          color: 'var(--success-color)',
          bgColor: '#dcfce7',
          icon: CheckCircle
        }
      case 'Medium':
        return {
          color: 'var(--warning-color)',
          bgColor: '#fef3c7',
          icon: AlertTriangle
        }
      case 'High':
        return {
          color: 'var(--danger-color)',
          bgColor: '#fee2e2',
          icon: AlertCircle
        }
      default:
        return {
          color: 'var(--text-secondary)',
          bgColor: 'var(--background-color)',
          icon: AlertCircle
        }
    }
  }

  const { color, bgColor, icon: Icon } = getSeverityConfig(result.severity)

  return (
    <Card className="result-card-container">
      <CardHeader>
        <div className="result-header">
           <CardTitle>Analysis Result</CardTitle>
           <div 
             className="badge" 
             style={{ 
               backgroundColor: bgColor, 
               color: color === 'var(--success-color)' ? '#166534' : color === 'var(--warning-color)' ? '#92400e' : '#991b1b',
               borderColor: color
             }}
           >
             <Icon size={18} />
             <span>{result.severity}</span>
           </div>
        </div>
      </CardHeader>
      <CardContent>
         <div className="result-grid">
            <div className="score-section">
                <span className="label">Confidence Score</span>
                <div className="score-display">
                    <span className="score-big" style={{ color: color }}>{(result.score * 100).toFixed(0)}</span>
                    <span className="score-unit">/ 100</span>
                </div>
            </div>
             
             <div className="explanation-section">
                <span className="label">Assessment Details</span>
                <p className="explanation-text">{result.explanation}</p>
             </div>
         </div>
      </CardContent>
    </Card>
  )
}
