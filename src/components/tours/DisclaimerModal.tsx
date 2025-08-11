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
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10
    if (isAtBottom) {
      setScrolledToBottom(true)
    }
  }

  const handleAccept = () => {
    if (acknowledged && scrolledToBottom) {
      onAccept()
    }
  }

  const handleClose = () => {
    setAcknowledged(false)
    setScrolledToBottom(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-red-900">
            ⚠️ IMPORTANT LEGAL DISCLAIMER & RISK ACKNOWLEDGMENT
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6">
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
            <p className="font-bold text-gray-900">
              Before proceeding to book: {tourTitle}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              You must read and accept this legal disclaimer
            </p>
          </div>
        </div>

        <div 
          className="px-6 overflow-y-auto max-h-[40vh] space-y-4 text-sm"
          onScroll={handleScroll}
        >
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <h3 className="font-bold text-red-900 mb-2">
              ALBANIA VISIT TOURS IS NOT A TOUR OPERATOR
            </h3>
            <p className="text-gray-800">
              We are an information service only. When you proceed, you will be redirected to 
              BNAdventure.com, an independent tour operator. Your booking contract is with them, 
              not with us. We have no control over tour operations, safety, or quality.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2">
              COMPLETE ASSUMPTION OF RISK
            </h3>
            <p className="text-gray-800 mb-2">
              By proceeding, you voluntarily assume ALL risks including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Death, injury, or illness from any cause</li>
              <li>Accidents during tour activities or transportation</li>
              <li>Natural disasters, political unrest, or crime</li>
              <li>Property damage, loss, or theft</li>
              <li>Financial losses from cancellations or changes</li>
              <li>Inadequate medical facilities in remote areas</li>
              <li>Food poisoning or infectious diseases</li>
              <li>Equipment failure or guide negligence</li>
            </ul>
          </div>

          <div className="bg-gray-100 border border-gray-400 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-2">
              COMPLETE RELEASE OF LIABILITY
            </h3>
            <p className="text-gray-800">
              You hereby <strong>RELEASE, WAIVE, and DISCHARGE</strong> Albania Visit Tours from 
              ANY and ALL liability for any loss, damage, injury, or death, WHETHER CAUSED BY 
              NEGLIGENCE OR OTHERWISE. You cannot and will not sue us for anything related to 
              any tour or travel activity.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-400 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-2">
              INDEMNIFICATION AGREEMENT
            </h3>
            <p className="text-gray-800">
              You agree to <strong>INDEMNIFY and HOLD HARMLESS</strong> Albania Visit Tours from 
              any claims, damages, or expenses (including attorney's fees) arising from your 
              tour participation. If anyone sues us because of something that happens to you, 
              YOU must pay for our legal defense and any damages.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-400 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-2">
              TRAVEL INSURANCE RECOMMENDATION
            </h3>
            <p className="text-gray-800">
              We STRONGLY RECOMMEND purchasing comprehensive travel insurance including medical 
              coverage, emergency evacuation, trip cancellation, and adventure activity coverage. 
              Albania Visit Tours is not responsible if you travel without insurance.
            </p>
          </div>

          <div className="border-t-2 border-gray-300 pt-4">
            <p className="font-bold text-gray-900 mb-2">
              LEGAL JURISDICTION
            </p>
            <p className="text-gray-700">
              This agreement is governed by Texas law. Any disputes must be resolved in 
              Dallas County, Texas courts. Claims must be filed within one year or are barred.
            </p>
          </div>

          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-4">
            <p className="font-bold text-red-900">
              BY PROCEEDING, YOU CONFIRM THAT:
            </p>
            <ul className="mt-2 space-y-1 text-gray-800">
              <li>• You have read and understood this entire disclaimer</li>
              <li>• You voluntarily assume all risks</li>
              <li>• You release Albania Visit Tours from all liability</li>
              <li>• You agree to indemnify and hold us harmless</li>
              <li>• You understand we are not a tour operator</li>
              <li>• You acknowledge this is a binding legal agreement</li>
            </ul>
          </div>
        </div>

        {!scrolledToBottom && (
          <div className="px-6 py-2 bg-yellow-100 text-center text-sm text-gray-700">
            ↓ Please scroll down to read the entire disclaimer ↓
          </div>
        )}

        <div className="p-6 border-t bg-gray-50">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                disabled={!scrolledToBottom}
                className="mt-1"
              />
              <label 
                htmlFor="acknowledge" 
                className={`text-sm ${!scrolledToBottom ? 'text-gray-400' : 'text-gray-700'} cursor-pointer`}
              >
                <strong>I acknowledge and accept</strong> all terms in this disclaimer. I understand 
                I am assuming all risks and releasing Albania Visit Tours from all liability. 
                I agree this is a binding legal agreement.
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!acknowledged || !scrolledToBottom}
                className="flex-1 bg-accent hover:bg-accent-600 text-white"
              >
                I Accept All Risks - Proceed to Booking
              </Button>
            </div>

            <div className="text-center">
              <a 
                href="/travel-disclaimer" 
                target="_blank"
                className="text-xs text-accent hover:text-accent-600 underline"
              >
                View Full Travel Disclaimer
              </a>
              {' | '}
              <a 
                href="/terms" 
                target="_blank"
                className="text-xs text-accent hover:text-accent-600 underline"
              >
                View Terms of Service
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}