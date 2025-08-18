import React, { useState, useEffect } from 'react'
import { AdvancedImage, lazyload, responsive, placeholder } from '@cloudinary/react'
import { cld, extractPublicId, getPlaceholderImage } from '@/lib/cloudinary'
import { auto } from '@cloudinary/url-gen/actions/resize'
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity'
import { quality, format } from '@cloudinary/url-gen/actions/delivery'

interface CloudinaryImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto'
  objectFit?: 'cover' | 'contain' | 'fill'
}

const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onLoad,
  onError,
  aspectRatio = 'auto',
  objectFit = 'cover'
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Extract public ID and handle different URL formats
  const publicId = extractPublicId(src)
  
  // Build Cloudinary transformation
  const buildImage = () => {
    let img = cld.image(publicId)
    
    // Handle external URLs
    if (src.startsWith('http') && !src.includes('cloudinary.com')) {
      img = img.setDeliveryType('fetch')
    }
    
    // Apply responsive transformations
    if (width && height) {
      img = img.resize(auto().gravity(autoGravity()).width(width).height(height))
    } else if (width) {
      img = img.resize(auto().width(width))
    }
    
    // Apply quality and format optimizations
    img = img
      .delivery(format('auto'))
      .delivery(quality(priority ? 'auto:best' : 'auto'))
    
    return img
  }
  
  const cldImg = buildImage()
  
  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }
  
  const handleError = () => {
    setImageError(true)
    onError?.()
  }
  
  // Fallback for error state
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ 
          width: width || '100%', 
          height: height || 'auto',
          aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio.replace(':', '/')
        }}
      >
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    )
  }
  
  // Apply plugins based on priority
  const plugins = priority ? [] : [lazyload(), responsive({ steps: [400, 800, 1200] })]
  
  return (
    <div className={`cloudinary-image-wrapper ${className}`}>
      {!isLoaded && !priority && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{
            backgroundImage: `url(${getPlaceholderImage(src)})`,
            backgroundSize: objectFit,
            backgroundPosition: 'center',
            filter: 'blur(5px)'
          }}
        />
      )}
      <AdvancedImage
        cldImg={cldImg}
        plugins={plugins}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={{
          width: width || '100%',
          height: height || 'auto',
          objectFit,
          aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio.replace(':', '/')
        }}
      />
    </div>
  )
}

export default CloudinaryImage