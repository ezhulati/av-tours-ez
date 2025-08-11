import React from 'react'
import type { TourCardDTO } from '@/lib/dto'
import { getOptimizedImageUrl, generateResponsiveSrcSet } from '@/lib/imageOptimizationHelper'

interface TourCardProps {
  tour: TourCardDTO
  loading?: boolean
  priority?: boolean
}


export default function TourCardOptimized({ tour, loading = false, priority = false }: TourCardProps) {
  if (loading) {
    return (
      <article className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-gray-200" />
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded mb-4" />
          <div className="flex justify-between mb-4">
            <div className="h-6 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </article>
    )
  }

  // Detect development environment
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  
  // Generate responsive sizes for card images
  const cardSizes = [320, 640, 768, 1024]
  const srcsetWebp = generateResponsiveSrcSet(tour.primaryImageUrl, cardSizes, 'webp', isDev)
  const srcsetAvif = generateResponsiveSrcSet(tour.primaryImageUrl, cardSizes, 'avif', isDev)
  const srcsetJpg = generateResponsiveSrcSet(tour.primaryImageUrl, cardSizes, 'jpg', isDev)

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
      <div className="aspect-[4/3] relative bg-gray-100">
        <picture>
          {/* AVIF - Best compression */}
          <source
            type="image/avif"
            srcSet={srcsetAvif}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* WebP - Good compression */}
          <source
            type="image/webp"
            srcSet={srcsetWebp}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* JPEG fallback */}
          <img 
            src={isDev ? tour.primaryImageUrl : getOptimizedImageUrl(tour.primaryImageUrl, 640, 'jpg', isDev)}
            srcSet={srcsetJpg}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            alt={tour.title}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            decoding={priority ? 'sync' : 'async'}
            className="w-full h-full object-cover"
            width="640"
            height="480"
          />
        </picture>
        {tour.featured && (
          <span className="absolute top-4 left-4 bg-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
            Featured
          </span>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">
          <a href={`/tours/${tour.slug}`} className="hover:text-accent">
            {tour.title}
          </a>
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {tour.shortDescription}
        </p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {tour.durationDisplay && (
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                {tour.durationDisplay}
              </span>
            )}
            {tour.difficulty && (
              <span className="text-sm bg-gray-100 px-2 py-1 rounded capitalize">
                {tour.difficulty}
              </span>
            )}
          </div>
          <span className={tour.priceMin ? "font-bold text-lg" : "text-sm text-gray-600"}>
            {tour.priceMin ? `From €${tour.priceMin}` : 'Check availability'}
          </span>
        </div>
        <a 
          href={`/tours/${tour.slug}`}
          className="flex items-center justify-center w-full bg-accent text-white py-2.5 px-4 rounded-lg hover:bg-accent-600 transition font-medium min-h-[40px]"
        >
          View Details
        </a>
      </div>
    </article>
  )
}