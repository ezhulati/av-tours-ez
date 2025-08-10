import React, { useState, useEffect } from 'react'
import { useForm, ValidationError } from '@formspree/react'

interface InquiryFormProps {
  tourId: string
  tourSlug: string
  tourTitle?: string
  tourOperator?: string
  inquiryType?: 'tour' | 'general'
}

export default function InquiryForm({ tourId, tourSlug, tourTitle, tourOperator, inquiryType = 'tour' }: InquiryFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, handleSubmit] = useForm("mvgqdvgr")
  
  useEffect(() => {
    const handleOpenInquiry = () => setIsOpen(true)
    window.addEventListener('open-inquiry-form', handleOpenInquiry)
    return () => window.removeEventListener('open-inquiry-form', handleOpenInquiry)
  }, [])

  useEffect(() => {
    // Reset form and close modal on successful submission
    if (state.succeeded) {
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    }
  }, [state.succeeded])

  useEffect(() => {
    // Prevent body scroll and viewport changes when modal is open
    if (isOpen) {
      // Save current viewport height
      const viewportHeight = window.innerHeight
      document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`)
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      
      // Prevent zoom on input focus (mobile)
      const metaViewport = document.querySelector('meta[name=viewport]')
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
      }
    } else {
      // Restore normal behavior
      document.body.style.overflow = 'unset'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
      document.body.style.height = 'unset'
      
      // Restore zoom capability
      const metaViewport = document.querySelector('meta[name=viewport]')
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1')
      }
    }
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
      document.body.style.height = 'unset'
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Full screen backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Centered Modal - Compact Version */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          
          {/* Compact Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-base font-semibold text-gray-900">Tour Inquiry</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Compact Form Content */}
          <div className="px-4 py-3">
            {state.succeeded ? (
              <div className="text-center py-6">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-base font-medium text-gray-900">Inquiry Sent!</h3>
                <p className="text-sm text-gray-600 mt-1">We'll contact you soon.</p>
              </div>
            ) : (
              <form id="tour-inquiry-form" onSubmit={handleSubmit} className="space-y-2.5">
                {/* Hidden fields - KEEP THESE EXACTLY AS THEY ARE */}
                {tourTitle && (
                  <input type="hidden" name="tour_title" value={tourTitle} />
                )}
                {tourSlug && (
                  <input type="hidden" name="tour_slug" value={tourSlug} />
                )}
                {tourOperator && (
                  <input type="hidden" name="tour_operator" value={tourOperator} />
                )}
                <input type="hidden" name="_subject" value={`[OPERATOR INQUIRY] Tour: ${tourTitle || 'General'} - ${tourOperator || 'BNAdventure'}`} />
                <input type="hidden" name="forward_to" value="info@bnadventures.com" />
                <input type="hidden" name="inquiry_type" value="tour_operator" />
                
                {/* Name & Email Row */}
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                {/* Phone & Date Row */}
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Travel Date
                    </label>
                    <input
                      type="date"
                      name="travel_date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent appearance-none"
                      style={{ 
                        WebkitAppearance: 'none', 
                        MozAppearance: 'none',
                        backgroundColor: '#ffffff',
                        backgroundImage: 'none',
                        color: '#111827'
                      }}
                    />
                  </div>
                </div>
                
                {/* Group Size - Full Width */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Group Size
                  </label>
                  <select
                    name="group_size"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  >
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3-4">3-4 people</option>
                    <option value="5-8">5-8 people</option>
                    <option value="9+">9+ people</option>
                  </select>
                </div>
                
                {/* Message Field - Smaller */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Message <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    name="message"
                    rows={2}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none"
                    placeholder="Any special requests?"
                  />
                </div>
              </form>
            )}
          </div>
          
          {/* Compact Footer */}
          {!state.succeeded && (
            <div className="border-t px-4 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="tour-inquiry-form"
                  disabled={state.submitting}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-600 disabled:opacity-50"
                >
                  {state.submitting ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}