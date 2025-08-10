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

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col pointer-events-auto transform transition-all sm:m-4">
          
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 flex-shrink-0">
            <div className="flex-1 pr-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {inquiryType === 'tour' ? 'Tour Inquiry' : 'General Inquiry'}
              </h2>
              {tourTitle && (
                <p className="text-sm text-gray-600 mt-1 truncate">{tourTitle}</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-5 sm:p-6">
              {state.succeeded ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Inquiry Sent!</h3>
                  <p className="text-gray-600 px-4">Thank you for your interest! We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form id="inquiry-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Hidden fields for tour information */}
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
                    <label htmlFor="inquiry-name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      id="inquiry-name"
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-gray-50 focus:bg-white"
                      placeholder="John Doe"
                    />
                    <ValidationError 
                      prefix="Name" 
                      field="name"
                      errors={state.errors}
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  
                  {/* Email Field */}
                  <div>
                    <label htmlFor="inquiry-email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      id="inquiry-email"
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-gray-50 focus:bg-white"
                      placeholder="john@example.com"
                    />
                    <ValidationError 
                      prefix="Email" 
                      field="email"
                      errors={state.errors}
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  
                  {/* Phone Field */}
                  <div>
                    <label htmlFor="inquiry-phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="inquiry-phone"
                      type="tel"
                      name="phone"
                      className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-gray-50 focus:bg-white"
                      placeholder="+1 (555) 000-0000"
                    />
                    <ValidationError 
                      prefix="Phone" 
                      field="phone"
                      errors={state.errors}
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  
                  {/* Travel Date Field */}
                  <div>
                    <label htmlFor="travel-date" className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Travel Date
                    </label>
                    <input
                      id="travel-date"
                      type="date"
                      name="travel_date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-gray-50 focus:bg-white"
                      style={{ colorScheme: 'light' }}
                    />
                    <ValidationError 
                      prefix="Travel Date" 
                      field="travel_date"
                      errors={state.errors}
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  
                  {/* Group Size Field */}
                  <div>
                    <label htmlFor="group-size" className="block text-sm font-semibold text-gray-700 mb-2">
                      Group Size
                    </label>
                    <div className="relative">
                      <select
                        id="group-size"
                        name="group_size"
                        className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-gray-50 focus:bg-white appearance-none pr-10"
                      >
                        <option value="1">1 person</option>
                        <option value="2">2 people</option>
                        <option value="3-4">3-4 people</option>
                        <option value="5-8">5-8 people</option>
                        <option value="9+">9+ people</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                    <ValidationError 
                      prefix="Group Size" 
                      field="group_size"
                      errors={state.errors}
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  
                  {/* Message Field */}
                  <div>
                    <label htmlFor="inquiry-message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      id="inquiry-message"
                      name="message"
                      rows={4}
                      className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-gray-50 focus:bg-white resize-none"
                      placeholder="Tell us more about your travel plans, preferences, or any questions you have..."
                    />
                    <ValidationError 
                      prefix="Message" 
                      field="message"
                      errors={state.errors}
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
          
          {/* Footer Buttons - Fixed */}
          {!state.succeeded && (
            <div className="flex-shrink-0 p-5 sm:p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 px-4 text-base font-semibold border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="inquiry-form"
                  disabled={state.submitting}
                  className="flex-1 py-3 px-4 text-base font-semibold bg-accent text-white rounded-xl hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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