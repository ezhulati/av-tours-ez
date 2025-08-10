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
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal - Mobile optimized bottom sheet, desktop centered */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 sm:flex sm:items-center sm:justify-center">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[600px] flex flex-col sm:m-4 shadow-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tour Inquiry</h2>
              {tourTitle && (
                <p className="text-sm text-gray-600 mt-0.5">{tourTitle}</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {state.succeeded ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Inquiry Sent!</h3>
                <p className="text-gray-600">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form id="inquiry-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Hidden fields */}
                <input type="hidden" name="tour_title" value={tourTitle || ''} />
                <input type="hidden" name="tour_slug" value={tourSlug} />
                <input type="hidden" name="tour_operator" value={tourOperator || ''} />
                <input type="hidden" name="_subject" value={`[Tour Inquiry] ${tourTitle || 'General'}`} />
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="John Doe"
                  />
                  <ValidationError prefix="Name" field="name" errors={state.errors} />
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="john@example.com"
                  />
                  <ValidationError prefix="Email" field="email" errors={state.errors} />
                </div>
                
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                
                {/* Travel Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Travel Date
                  </label>
                  <input
                    type="date"
                    name="travel_date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                
                {/* Group Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Size
                  </label>
                  <select
                    name="group_size"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                  >
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3-4">3-4 people</option>
                    <option value="5-8">5-8 people</option>
                    <option value="9+">9+ people</option>
                  </select>
                </div>
                
                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Information
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                    placeholder="Tell us more about your travel plans..."
                  />
                </div>
              </form>
            )}
          </div>
          
          {/* Footer Buttons */}
          {!state.succeeded && (
            <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="inquiry-form"
                disabled={state.submitting}
                className="flex-1 px-4 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-600 disabled:opacity-50"
              >
                {state.submitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}