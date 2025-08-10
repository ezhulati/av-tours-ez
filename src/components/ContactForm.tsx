import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ContactFormProps {
  subject?: string
}

export default function ContactForm({ subject }: ContactFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    subject: subject || ''
  })

  useEffect(() => {
    const handleOpenContact = () => setIsOpen(true)
    window.addEventListener('open-contact-form', handleOpenContact)
    return () => window.removeEventListener('open-contact-form', handleOpenContact)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Submit directly to Netlify Forms (general contact only goes to AlbaniaVisit)
      const netlifyFormData = new FormData()
      netlifyFormData.append('form-name', 'general-contact')
      netlifyFormData.append('name', formData.name)
      netlifyFormData.append('email', formData.email)
      netlifyFormData.append('phone', formData.phone || '')
      netlifyFormData.append('message', formData.message)
      netlifyFormData.append('subject', formData.subject)
      netlifyFormData.append('created-at', new Date().toISOString())

      const netlifyResponse = await fetch('/', {
        method: 'POST',
        body: netlifyFormData
      })

      if (netlifyResponse.ok || netlifyResponse.status === 200) {
        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          subject: subject || ''
        })
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
        }, 3000)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (err) {
      console.error('Contact form error:', err)
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
          <h2 className="text-2xl font-bold">Contact Us</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Get in touch with our team. We'd love to hear from you!
        </p>

        {success ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg">
            <p className="font-semibold">Thank you for your message!</p>
            <p className="text-sm mt-1">We'll get back to you within 24 hours.</p>
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

            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="What can we help you with?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message *</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Tell us how we can help..."
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
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}