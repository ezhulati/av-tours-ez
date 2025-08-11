import React from 'react'

interface TourDisclaimerProps {
  variant?: 'full' | 'compact' | 'minimal'
  className?: string
}

export default function TourDisclaimer({ variant = 'compact', className = '' }: TourDisclaimerProps) {
  if (variant === 'minimal') {
    return (
      <div className={`bg-yellow-50 border border-yellow-400 rounded-lg p-3 text-xs text-gray-700 ${className}`}>
        <p className="font-semibold">
          ⚠️ Important: AlbaniaVisit.com is not a tour operator. We provide information only. 
          All bookings are made directly with third-party operators. You assume all travel risks. 
          <a href="/travel-disclaimer" className="text-accent hover:text-accent-600 font-bold ml-1">
            Read full disclaimer
          </a>
        </p>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-red-50 border-2 border-red-300 rounded-lg p-4 ${className}`}>
        <h4 className="font-bold text-red-900 mb-2 flex items-center">
          <span className="text-xl mr-2">⚠️</span>
          Important Safety & Legal Notice
        </h4>
        <div className="space-y-2 text-sm text-gray-800">
          <p className="font-semibold">
            Albania Visit Tours is NOT a tour operator. We are an information service only.
          </p>
          <p>
            When you click "Check Availability," you will be redirected to the actual tour operator's website 
            (BNAdventure.com). Any booking contract is between you and the tour operator directly.
          </p>
          <p className="font-semibold">
            By booking any tour, you acknowledge that you:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Assume ALL risks including injury, death, or property loss</li>
            <li>Release AlbaniaVisit.com from ANY and ALL liability</li>
            <li>Will not hold us responsible for tour quality, safety, or any issues</li>
            <li>Understand travel involves inherent dangers</li>
          </ul>
          <p className="font-bold text-red-900 mt-3">
            We strongly recommend purchasing comprehensive travel insurance.
          </p>
          <div className="mt-3 pt-3 border-t border-red-200">
            <a 
              href="/travel-disclaimer" 
              className="text-accent hover:text-accent-600 font-bold text-sm"
            >
              Read Complete Travel Disclaimer →
            </a>
            {' | '}
            <a 
              href="/terms" 
              className="text-accent hover:text-accent-600 font-bold text-sm"
            >
              Terms of Service →
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Full variant
  return (
    <div className={`bg-red-50 border-2 border-red-500 rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
        <span className="text-2xl mr-2">⚠️</span>
        CRITICAL SAFETY & LEGAL DISCLAIMER
      </h3>
      
      <div className="space-y-4 text-gray-800">
        <div className="bg-white border border-red-300 rounded p-4">
          <p className="font-bold text-lg text-red-900 mb-2">
            Albania Visit Tours is NOT a Tour Operator
          </p>
          <p>
            We are solely an informational website. We do not operate, control, or provide any tours. 
            When you click any booking button, you are leaving our site and contracting directly with 
            an independent tour operator (primarily BNAdventure.com). We have no control over tour 
            operations, safety, quality, or any aspect of the services provided.
          </p>
        </div>

        <div>
          <p className="font-bold mb-2">By proceeding to book this tour, you acknowledge and agree:</p>
          <ul className="space-y-2">
            <li className="flex">
              <span className="text-red-600 mr-2">•</span>
              <div>
                <strong>You assume ALL risks</strong> associated with this tour including but not limited to 
                injury, death, illness, property damage, financial loss, natural disasters, political unrest, 
                crime, and any other hazards of travel.
              </div>
            </li>
            <li className="flex">
              <span className="text-red-600 mr-2">•</span>
              <div>
                <strong>You completely release and discharge</strong> Albania Visit Tours from ANY and ALL 
                liability, claims, demands, or causes of action, whether caused by negligence or otherwise.
              </div>
            </li>
            <li className="flex">
              <span className="text-red-600 mr-2">•</span>
              <div>
                <strong>You agree to indemnify and hold harmless</strong> Albania Visit Tours from any 
                claims, including the cost of defense and attorney's fees.
              </div>
            </li>
            <li className="flex">
              <span className="text-red-600 mr-2">•</span>
              <div>
                <strong>You understand</strong> that tour activities can be dangerous and that adequate 
                medical facilities may not be available.
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-400 rounded p-3">
          <p className="font-bold text-gray-900 mb-1">
            🛡️ Travel Insurance Strongly Recommended
          </p>
          <p className="text-sm">
            We strongly advise purchasing comprehensive travel insurance including medical coverage, 
            emergency evacuation, trip cancellation, and coverage for adventure activities.
          </p>
        </div>

        <div className="bg-white border border-red-300 rounded p-4">
          <p className="font-bold text-gray-900 mb-2">Legal Jurisdiction</p>
          <p className="text-sm">
            Any disputes shall be governed by the laws of Texas, USA, with exclusive jurisdiction in 
            Dallas County, Texas. Claims must be filed within one year or are forever barred.
          </p>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t-2 border-red-300">
          <a 
            href="/travel-disclaimer" 
            className="flex-1 text-center bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition-colors"
          >
            Read Full Travel Disclaimer
          </a>
          <a 
            href="/terms" 
            className="flex-1 text-center bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700 transition-colors"
          >
            View Terms of Service
          </a>
        </div>
      </div>
    </div>
  )
}