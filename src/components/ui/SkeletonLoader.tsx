import React from 'react'

interface SkeletonLoaderProps {
  type?: 'card' | 'detail' | 'image' | 'text' | 'button'
  className?: string
  count?: number
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'text', 
  className = '',
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
            {/* Image skeleton */}
            <div className="h-48 bg-gray-200 animate-pulse" />
            
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6" />
              
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32" />
              </div>
            </div>
          </div>
        )
        
      case 'detail':
        return (
          <div className={`space-y-6 ${className}`}>
            {/* Hero image skeleton */}
            <div className="h-[50vh] md:h-[60vh] bg-gray-200 animate-pulse rounded-lg" />
            
            {/* Title and info */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded-full animate-pulse w-24" />
                <div className="h-8 bg-gray-200 rounded-full animate-pulse w-20" />
                <div className="h-8 bg-gray-200 rounded-full animate-pulse w-28" />
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
            </div>
          </div>
        )
        
      case 'image':
        return (
          <div className={`bg-gray-200 animate-pulse ${className}`}>
            <svg 
              className="w-full h-full text-gray-300" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M20 5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5zm-2 14H6V5h12v14zm-3-7l-3 4-2-2-3 4h10l-2-6z" />
            </svg>
          </div>
        )
        
      case 'button':
        return (
          <div className={`h-12 min-h-[48px] bg-gray-200 rounded-lg animate-pulse ${className}`} />
        )
        
      case 'text':
      default:
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
          </div>
        )
    }
  }
  
  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>
            {renderSkeleton()}
          </div>
        ))}
      </>
    )
  }
  
  return renderSkeleton()
}

// Tour Card Skeleton
export const TourCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
    {/* Image skeleton */}
    <div className="relative h-56 bg-gray-200">
      <div className="absolute top-3 left-3 h-6 w-20 bg-gray-300 rounded" />
      <div className="absolute top-3 right-3 h-8 w-8 bg-gray-300 rounded-full" />
    </div>
    
    {/* Content skeleton */}
    <div className="p-5 space-y-3">
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      
      {/* Description */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
      
      {/* Meta info */}
      <div className="flex gap-3 pt-2">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
      
      {/* Price and button */}
      <div className="flex justify-between items-center pt-3">
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-12" />
          <div className="h-6 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-11 bg-gray-200 rounded-lg w-32" />
      </div>
    </div>
  </div>
)

// Gallery Skeleton
export const GallerySkeleton: React.FC = () => (
  <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] max-h-[800px] bg-gray-200 animate-pulse">
    {/* Navigation buttons */}
    <div className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-300 rounded-lg" />
    <div className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-300 rounded-lg" />
    
    {/* View all button */}
    <div className="absolute top-4 right-4 h-10 w-28 bg-gray-300 rounded-lg" />
    
    {/* Counter */}
    <div className="absolute top-4 left-4 h-8 w-16 bg-gray-300 rounded-lg" />
    
    {/* Image icon */}
    <div className="flex items-center justify-center h-full">
      <svg 
        className="w-24 h-24 text-gray-300" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M20 5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5zm-2 14H6V5h12v14zm-3-7l-3 4-2-2-3 4h10l-2-6z" />
      </svg>
    </div>
  </div>
)

export default SkeletonLoader