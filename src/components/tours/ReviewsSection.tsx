import React, { useState } from 'react'
import type { Review } from '@/data/partnerReviews'

interface ReviewsSectionProps {
  reviews: Review[]
  tourOperator: string
  averageRating: number
  totalReviews: number
}

export default function ReviewsSection({ 
  reviews, 
  tourOperator,
  averageRating,
  totalReviews
}: ReviewsSectionProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  
  const toggleReview = (id: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedReviews(newExpanded)
  }
  
  // Generate star display
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }
  
  return (
    <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
      {/* Header with trust context */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Traveler Reviews</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Reviews from travelers who booked with</span>
          <span className="font-semibold text-gray-900">{tourOperator}</span>
        </div>
      </div>
      
      {/* Rating Summary */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
            <div className="flex">{renderStars(Math.round(averageRating))}</div>
          </div>
          <span className="text-sm text-gray-600 mt-1">
            Based on {totalReviews} verified reviews
          </span>
        </div>
        
        {/* Trust badges */}
        <div className="ml-auto flex gap-2">
          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verified Reviews
          </div>
        </div>
      </div>
      
      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const isExpanded = expandedReviews.has(review.id)
          const needsExpansion = review.text.length > 150
          const displayText = needsExpansion && !isExpanded 
            ? review.text.slice(0, 150) + '...' 
            : review.text
          
          return (
            <div key={review.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{review.author}</span>
                    {review.verified && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span>{formatDate(review.date)}</span>
                    {review.tourType && (
                      <>
                        <span>•</span>
                        <span>{review.tourType}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {review.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}
              
              <p className="text-gray-700 leading-relaxed">
                {displayText}
              </p>
              
              {needsExpansion && (
                <button
                  onClick={() => toggleReview(review.id)}
                  className="text-accent hover:underline text-sm font-medium mt-2"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
              
              {/* Source attribution */}
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Review from {review.source === 'trustpilot' ? 'Trustpilot' : 'TripAdvisor'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Disclaimer */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-xs text-gray-500 leading-relaxed">
          These reviews are from travelers who booked tours with {tourOperator}, our trusted booking partner. 
          AlbaniaVisit carefully selects partners based on their reputation and service quality.
        </p>
      </div>
    </div>
  )
}