import React, { useEffect, useState } from 'react'

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
  const [countdown, setCountdown] = useState<number | null>(null)
  
  useEffect(() => {
    if (isOpen) {
      // Reset countdown when modal opens (no auto-redirect)
      setCountdown(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Extract domain from URL for display
  let displayDomain = ''
  try {
    const url = new URL(partnerUrl)
    displayDomain = url.hostname.replace('www.', '')
  } catch {
    displayDomain = 'partner site'
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
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
                Continue to Tour Operator
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                You'll be redirected to book directly with the tour operator
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">You'll be redirected to:</p>
            <p className="font-semibold text-gray-900">
              {partnerName || 'Partner Site'}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {displayDomain}
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <svg 
                className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" 
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
              <p>
                <strong className="text-gray-700">Secure & Trusted:</strong> We only feature verified tour operators
              </p>
            </div>
            
            <div className="flex items-start gap-2">
              <svg 
                className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p>
                <strong className="text-gray-700">Check Availability:</strong> View real-time dates and pricing on the operator's site
              </p>
            </div>

            <div className="flex items-start gap-2">
              <svg 
                className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                <strong className="text-gray-700">Direct Booking:</strong> You'll book directly with the operator at their best available rates
              </p>
            </div>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="btn-outline w-full sm:flex-1"
            >
              Stay on AlbaniaVisit
            </button>
            <button
              onClick={onContinue}
              className="btn-primary w-full sm:flex-1 flex items-center justify-center gap-1 text-sm px-3"
            >
              <span>Continue</span>
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
            AlbaniaVisit helps you find and connect with trusted tour operators
          </p>
        </div>
      </div>
    </div>
  )
}
