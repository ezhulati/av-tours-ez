import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface InquiryFormProps {
  tourId: string
  tourSlug: string
  tourTitle?: string
  inquiryType?: 'tour' | 'general'
}

export default function InquiryForm({ tourId, tourSlug, tourTitle, tourOperator, inquiryType = 'tour' }: InquiryFormProps & { tourOperator?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  // CSRF token not needed for Netlify Forms
  // const [csrfToken, setCsrfToken] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    travelDate: '',
    groupSize: 1
  })

  useEffect(() => {
    const handleOpenInquiry = () => setIsOpen(true)
    window.addEventListener('open-inquiry-form', handleOpenInquiry)
    return () => window.removeEventListener('open-inquiry-form', handleOpenInquiry)
  }, [])

  // CSRF token fetching removed - not needed for Netlify Forms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // CSRF validation removed - not needed for Netlify Forms

    try {
      // Submit to Netlify Function
      const urlParams = new URLSearchParams(window.location.search)
      
      const response = await fetch('/.netlify/functions/tour-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          message: formData.message,
          tour_title: tourTitle || '',
          tour_slug: tourSlug || '',
          travelDate: formData.travelDate || '',
          groupSize: formData.groupSize,
          utm_source: urlParams.get('utm_source') || '',
          utm_medium: urlParams.get('utm_medium') || '',
          utm_campaign: urlParams.get('utm_campaign') || ''
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          travelDate: '',
          groupSize: 1
        })
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
        }, 3000)
      } else {
        throw new Error(result.error || 'Failed to send inquiry')
      }
    } catch (err) {
      console.error('Inquiry submission error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsOpen(false)}>
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Tour Inquiry</h2>
            <p className="text-xs text-gray-500 mt-1">Direct to tour operator</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {tourTitle && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Tour: <strong>{tourTitle}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              You're contacting the <strong>tour operator</strong> directly for availability and booking.
            </p>
          </div>
        )}
        
        {/* Option to contact AlbaniaVisit instead */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
          <p className="text-sm text-blue-900">
            <strong>Need general help?</strong> 
            <button 
              type="button"
              onClick={() => {
                setIsOpen(false);
                // Trigger the general contact form
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('open-contact-form'));
                }, 100);
              }}
              className="text-blue-700 underline hover:text-blue-800 ml-1"
            >
              Contact AlbaniaVisit instead
            </button>
          </p>
        </div>

        {success ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg">
            <p className="font-semibold">Thank you for your inquiry!</p>
            <p className="text-sm mt-1">The tour operator will respond within 24-48 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Travel Date</label>
                <input
                  type="date"
                  value={formData.travelDate}
                  onChange={(e) => setFormData({...formData, travelDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Group Size</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.groupSize}
                  onChange={(e) => setFormData({...formData, groupSize: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message *</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Tell us about your travel plans, special requirements, or questions..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Sending...' : 'Send Inquiry'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}