import { Cloudinary } from '@cloudinary/url-gen'
import { auto } from '@cloudinary/url-gen/actions/resize'
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity'
import { quality, format } from '@cloudinary/url-gen/actions/delivery'

// Initialize Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName: 'dwnmuolg8'
  }
})

// Helper function to extract public ID from various URL formats
export function extractPublicId(imageUrl: string): string {
  // Handle local images (start with /)
  if (imageUrl.startsWith('/')) {
    // Remove leading slash and file extension
    return imageUrl.slice(1).replace(/\.[^/.]+$/, '')
  }
  
  // Handle full URLs
  if (imageUrl.includes('cloudinary.com')) {
    // Extract public ID from Cloudinary URL
    const match = imageUrl.match(/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    return match ? match[1] : imageUrl
  }
  
  // For external URLs, use fetch transformation
  return imageUrl
}

// Create optimized image URL for tour cards
export function getOptimizedCardImage(imageUrl: string, width = 400, height = 300) {
  const publicId = extractPublicId(imageUrl)
  
  // If it's an external URL, use fetch
  if (imageUrl.startsWith('http') && !imageUrl.includes('cloudinary.com')) {
    return cld
      .image(publicId)
      .setDeliveryType('fetch')
      .resize(auto().gravity(autoGravity()).width(width).height(height))
      .delivery(format('auto'))
      .delivery(quality('auto'))
      .toURL()
  }
  
  return cld
    .image(publicId)
    .resize(auto().gravity(autoGravity()).width(width).height(height))
    .delivery(format('auto'))
    .delivery(quality('auto'))
    .toURL()
}

// Create optimized image URL for hero/gallery images
export function getOptimizedHeroImage(imageUrl: string, width = 1920) {
  const publicId = extractPublicId(imageUrl)
  
  if (imageUrl.startsWith('http') && !imageUrl.includes('cloudinary.com')) {
    return cld
      .image(publicId)
      .setDeliveryType('fetch')
      .resize(auto().width(width))
      .delivery(format('auto'))
      .delivery(quality('auto:best'))
      .toURL()
  }
  
  return cld
    .image(publicId)
    .resize(auto().width(width))
    .delivery(format('auto'))
    .delivery(quality('auto:best'))
    .toURL()
}

// Create responsive image URLs for different breakpoints
export function getResponsiveImageSet(imageUrl: string, sizes = [400, 800, 1200, 1920]) {
  return sizes.map(size => ({
    width: size,
    url: getOptimizedHeroImage(imageUrl, size)
  }))
}

// Get placeholder/blur URL for lazy loading
export function getPlaceholderImage(imageUrl: string) {
  const publicId = extractPublicId(imageUrl)
  
  if (imageUrl.startsWith('http') && !imageUrl.includes('cloudinary.com')) {
    return cld
      .image(publicId)
      .setDeliveryType('fetch')
      .resize(auto().width(20))
      .delivery(format('auto'))
      .delivery(quality('auto:low'))
      .effect('blur:1000')
      .toURL()
  }
  
  return cld
    .image(publicId)
    .resize(auto().width(20))
    .delivery(format('auto'))
    .delivery(quality('auto:low'))
    .effect('blur:1000')
    .toURL()
}