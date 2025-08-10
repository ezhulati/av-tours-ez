import React, { useState, useEffect } from 'react'
import { useForm, ValidationError } from '@formspree/react'
import { Button } from '@/components/ui/button'

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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-hidden pointer-events-auto transform transition-all">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
            <div className="flex-1 pr-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {inquiryType === 'tour' ? 'Tour Inquiry' : 'General Inquiry'}
              </h2>
              {tourTitle && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{tourTitle}</p>
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
          
          {/* Form Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
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
                <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-gray-50 focus:bg-white appearance-none"
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
                  <select
                    id="group-size"
                    name="group_size"
                    className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-gray-50 focus:bg-white appearance-none"
                    style={{ backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3-4">3-4 people</option>
                    <option value="5-8">5-8 people</option>
                    <option value="9+">9+ people</option>
                  </select>
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
                
                {/* Submit Buttons - Sticky on mobile */}
                <div className="sticky bottom-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 bg-white border-t border-gray-100 mt-6">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-3 text-base font-semibold border-gray-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={state.submitting}
                      className="flex-1 py-3 text-base font-semibold bg-accent hover:bg-accent-600"
                    >
                      {state.submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send Inquiry'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}