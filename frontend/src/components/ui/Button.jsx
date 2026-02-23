import React from 'react'
import './Button.css'

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}) {
  return (
    <button 
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="spinner" style={{ marginRight: '0.5rem', width: '1em', height: '1em' }}></span>}
      {children}
    </button>
  )
}
