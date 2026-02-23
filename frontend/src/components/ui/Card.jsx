import React from 'react'
import './Card.css'

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`ui-card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return <div className={`ui-card-header ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`ui-card-title ${className}`}>{children}</h3>
}

export function CardContent({ children, className = '' }) {
  return <div className={`ui-card-content ${className}`}>{children}</div>
}
