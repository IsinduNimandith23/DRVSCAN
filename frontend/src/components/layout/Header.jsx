import React from 'react'
import { Car } from 'lucide-react'
import './Header.css'

export function Header() {
  return (
    <header className="app-header">
      <div className="container header-container">
        <div className="logo-section">
          <Car className="app-logo-icon" size={32} />
          <div>
            <h1 className="app-title">Driver Distraction Severity Detector</h1>
            <p className="app-subtitle">AI-powered driver safety analysis system</p>
          </div>
        </div>
      </div>
    </header>
  )
}
