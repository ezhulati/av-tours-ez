import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { microcopy } from '@/lib/microcopy'

interface RedirectModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  partnerName: string
  partnerUrl: string
}

export default function RedirectModalOptimized({ 
  isOpen, 
  onClose, 
  onContinue, 
  partnerName,
  partnerUrl 
}: RedirectModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  useEffect(() => {
    if (isOpen) {
      // Reset countdown when modal opens (no auto-redirect)
      setCountdown(null)
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  // Extract domain from URL for display
  let displayDomain = ''
  try {
    const url = new URL(partnerUrl)
    displayDomain = url.hostname.replace('www.', '')
  } catch {
    displayDomain = 'partner site'
  }

  const modalContent = (
    <>
      {/* Full screen container */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        {/* Backdrop */}
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={onClose}
        />
        
        {/* Modal */}
        <div 
          style={{ 
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '28rem',
            maxHeight: '85vh',
            overflowY: 'auto',
            zIndex: 1000000
          }}
        >
          {/* Header with icon */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-accent" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {microcopy.redirect.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {microcopy.redirect.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">{microcopy.redirect.partnerLabel}</p>
              <p className="font-semibold text-gray-900">
                {partnerName || 'BNAdventure'}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {displayDomain}
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              {microcopy.redirect.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <svg 
                    className={`w-5 h-5 ${index === 2 ? 'text-accent' : 'text-gray-700'} flex-shrink-0 mt-0.5`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d={benefit.icon}
                    />
                  </svg>
                  <p>
                    <strong className="text-gray-700">{benefit.title}:</strong> {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer with actions */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="btn-outline w-full sm:flex-1"
              >
                {microcopy.redirect.stayButton}
              </button>
              <button
                onClick={onContinue}
                className="btn-primary w-full sm:flex-1 flex items-center justify-center gap-1 text-sm px-3"
              >
                <span>{microcopy.redirect.continueButton}</span>
                <svg 
                  className="w-4 h-4 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-3">
              {microcopy.redirect.footer}
            </p>
          </div>
        </div>
      </div>
    </>
  )

  // Use React Portal to render at document body
  return ReactDOM.createPortal(
    modalContent,
    document.body
  )
}