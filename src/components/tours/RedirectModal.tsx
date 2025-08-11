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

export default function RedirectModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  partnerName,
  partnerUrl 
}: RedirectModalProps) {
  const [mounted, setMounted] = useState(false)
  const [accepted, setAccepted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  useEffect(() => {
    if (isOpen) {
      setAccepted(false) // Reset acceptance when modal opens
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

  const handleContinue = () => {
    if (accepted) {
      onContinue()
    }
  }

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
            maxWidth: '32rem',
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
              <div className="flex items-start gap-2">
                <svg 
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>{microcopy.redirect.benefits[0]}</p>
              </div>
              
              <div className="flex items-start gap-2">
                <svg 
                  className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>{microcopy.redirect.benefits[1]}</p>
              </div>
              
              <div className="flex items-start gap-2">
                <svg 
                  className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>{microcopy.redirect.benefits[2]}</p>
              </div>
            </div>

            {/* Acknowledgment checkbox with helper text */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-accent focus:ring-accent focus:ring-2 transition-all"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {microcopy.redirect.checkbox.label}{' '}
                      <a 
                        href={microcopy.redirect.checkbox.termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {microcopy.redirect.checkbox.termsLink}
                      </a>
                    </span>
                    {!accepted && (
                      <p className="text-xs text-gray-500 mt-1">
                        {microcopy.redirect.checkbox.helper}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer with actions - Perfect responsive layout */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="modal-footer-buttons">
              <button
                onClick={onClose}
                className="btn-outline"
              >
                {microcopy.redirect.buttons.back}
              </button>
              <button
                onClick={handleContinue}
                disabled={!accepted}
                className={`btn-primary flex items-center justify-center gap-2 whitespace-nowrap ${
                  !accepted ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ minWidth: '220px' }}
              >
                <span>{microcopy.redirect.buttons.continue}</span>
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