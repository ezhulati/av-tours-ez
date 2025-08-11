import React from 'react'

interface EUConsumerRightsProps {
  className?: string
  compact?: boolean
}

export default function EUConsumerRights({ className = '', compact = false }: EUConsumerRightsProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      {!compact && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">EU Consumer Rights</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Package Travel Rights:</strong> If your tour qualifies as a package under EU regulations, 
                you may have additional rights including financial protection and right of withdrawal.
              </p>
              <p>
                <strong>Dispute Resolution:</strong> EU residents can use the{' '}
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Online Dispute Resolution platform
                </a>{' '}
                for complaints.
              </p>
              <p>
                <strong>Consumer Protection:</strong> Tours are operated by licensed providers. 
                We act as an intermediary connecting you with trusted tour operators.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {compact && (
        <div className="text-xs text-blue-800">
          <strong>EU Residents:</strong> Additional consumer rights may apply.{' '}
          <a 
            href="https://ec.europa.eu/consumers/odr/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Dispute Resolution
          </a>
        </div>
      )}
    </div>
  )
}