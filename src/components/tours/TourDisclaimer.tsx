import React from 'react'

interface TourDisclaimerProps {
  variant?: 'full' | 'compact' | 'minimal'
  className?: string
}

export default function TourDisclaimer({ variant = 'compact', className = '' }: TourDisclaimerProps) {
  if (variant === 'minimal') {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 text-xs text-gray-600 ${className}`}>
        <p>
          Tours provided by independent operators. 
          <a href="/terms" className="text-accent hover:underline ml-1">Terms apply</a>.
        </p>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Booking Information:</strong> Tours are operated by independent partners. 
              Albania Visit Tours provides information and facilitates bookings only.
            </p>
            <p className="text-xs text-gray-600">
              By booking, you acknowledge travel risks and agree to our{' '}
              <a href="/terms" className="text-accent hover:underline">terms</a> and{' '}
              <a href="/travel-disclaimer" className="text-accent hover:underline">travel policies</a>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Full variant - still available but more professional
  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Important Booking Information
      </h3>
      
      <div className="space-y-4 text-sm text-gray-700">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">
            About Our Service
          </p>
          <p>
            Albania Visit Tours is an information and booking facilitation service. All tours are 
            operated by independent partners, primarily BNAdventure.com. When you book, your contract 
            is directly with the tour operator.
          </p>
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-2">Travel Terms & Conditions</p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>All travel activities involve inherent risks that participants assume</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>We recommend comprehensive travel insurance for all bookings</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Tour operators maintain their own terms, conditions, and policies</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Albania Visit Tours' liability is limited as outlined in our terms of service</span>
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-3">
            This booking is subject to our terms of service and travel policies. 
            Disputes are governed by Texas law with jurisdiction in Dallas County.
          </p>
          <div className="flex gap-4">
            <a 
              href="/terms" 
              className="text-accent hover:text-accent-600 font-medium text-sm"
            >
              Terms of Service →
            </a>
            <a 
              href="/travel-disclaimer" 
              className="text-accent hover:text-accent-600 font-medium text-sm"
            >
              Travel Policies →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}