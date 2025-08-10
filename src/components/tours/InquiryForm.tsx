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
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
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
      
      {/* Centered Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
          
          {/* Fixed Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Tour Inquiry</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-4">
              {state.succeeded ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Inquiry Sent!</h3>
                  <p className="text-sm text-gray-600">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form id="tour-inquiry-form" onSubmit={handleSubmit} className="space-y-3.5">
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
                  
                  {/* Name Field */}
                  <div>
                    <label htmlFor="form-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      id="form-name"
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                      placeholder="Your full name"
                    />
                    <ValidationError prefix="Name" field="name" errors={state.errors} className="text-red-500 text-xs mt-1" />
                  </div>
                  
                  {/* Email Field */}
                  <div>
                    <label htmlFor="form-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      id="form-email"
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                      placeholder="your@email.com"
                    />
                    <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-500 text-xs mt-1" />
                  </div>
                  
                  {/* Phone Field */}
                  <div>
                    <label htmlFor="form-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      id="form-phone"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                      placeholder="Optional"
                    />
                    <ValidationError prefix="Phone" field="phone" errors={state.errors} className="text-red-500 text-xs mt-1" />
                  </div>
                  
                  {/* Travel Date */}
                  <div>
                    <label htmlFor="form-date" className="block text-sm font-medium text-gray-700 mb-1">
                      Travel Date
                    </label>
                    <input
                      id="form-date"
                      type="date"
                      name="travel_date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent bg-white appearance-none"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                    />
                  </div>
                  
                  {/* Group Size */}
                  <div>
                    <label htmlFor="form-group" className="block text-sm font-medium text-gray-700 mb-1">
                      Group Size
                    </label>
                    <select
                      id="form-group"
                      name="group_size"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent bg-white appearance-none"
                      style={{ WebkitAppearance: 'none' }}
                    >
                      <option value="1">1 person</option>
                      <option value="2">2 people</option>
                      <option value="3-4">3-4 people</option>
                      <option value="5-8">5-8 people</option>
                      <option value="9+">9+ people</option>
                    </select>
                  </div>
                  
                  {/* Message Field */}
                  <div>
                    <label htmlFor="form-message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="form-message"
                      name="message"
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none"
                      placeholder="Any special requests or questions?"
                    />
                    <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-500 text-xs mt-1" />
                  </div>
                </form>
              )}
            </div>
          </div>
          
          {/* Fixed Footer with Buttons */}
          {!state.succeeded && (
            <div className="border-t px-5 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="tour-inquiry-form"
                  disabled={state.submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {state.submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Inquiry'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}