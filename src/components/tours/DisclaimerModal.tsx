import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface DisclaimerModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  tourTitle: string
}

export default function DisclaimerModal({ 
  isOpen, 
  onClose, 
  onAccept, 
  tourTitle 
}: DisclaimerModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  const handleAccept = () => {
    if (acknowledged) {
      onAccept()
    }
  }

  const handleClose = () => {
    setAcknowledged(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Important Booking Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Booking Partner
            </h3>
            <p className="text-sm text-gray-700">
              Albania Visit Tours partners with BNAdventure.com to provide tour bookings. 
              When you proceed, you'll be redirected to complete your booking directly with them.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">
              Terms & Conditions
            </h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                By proceeding with this booking, you acknowledge and agree that:
              </p>
              <ul className="space-y-1.5 ml-4">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Your booking contract will be directly with the tour operator</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Travel activities involve inherent risks that you voluntarily assume</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Albania Visit Tours acts solely as an information service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>We recommend purchasing comprehensive travel insurance</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>
              For complete terms, please review our{' '}
              <a href="/terms" target="_blank" className="text-accent hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/travel-disclaimer" target="_blank" className="text-accent hover:underline">
                Travel Disclaimer
              </a>
              . This agreement is governed by Texas law with exclusive jurisdiction in Dallas County.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              className="mt-1"
            />
            <label 
              htmlFor="terms" 
              className="text-sm text-gray-700 cursor-pointer select-none"
            >
              I have read and agree to the terms and conditions, including assumption of all travel risks 
              and release of liability
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!acknowledged}
              className="flex-1 bg-accent hover:bg-accent-600 text-white"
            >
              Continue to Booking
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}