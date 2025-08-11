import { RobustImageScraper, syncAllTourImagesWithValidation } from './robustImageScraper'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

interface ValidationReport {
  timestamp: string
  summary: {
    totalTours: number
    toursWithImages: number
    toursWithoutImages: number
    toursFailed: number
    totalImagesFound: number
    averageImagesPerTour: number
    successRate: number
  }
  tourDetails: TourValidation[]
  recommendations: string[]
  criticalIssues: string[]
}

interface TourValidation {
  id: string
  title: string
  url: string
  status: 'success' | 'partial' | 'failed'
  imageCount: number
  imageTypes: {
    hero: number
    gallery: number
    content: number
    background: number
  }
  validation: {
    hasHeroImage: boolean
    hasGalleryImages: boolean
    minimumImagesMet: boolean
    allImagesAccessible: boolean
  }
  issues: string[]
  scrapeTime: number
}

export class ImageValidationReporter {
  private scraper: RobustImageScraper
  private supabase: any
  private minRequiredImages = 3
  private report: ValidationReport
  
  constructor() {
    this.scraper = new RobustImageScraper()
    this.supabase = this.initSupabase()
    this.report = this.initReport()
  }
  
  private initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }
    
    return createClient(supabaseUrl, supabaseKey)
  }
  
  private initReport(): ValidationReport {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalTours: 0,
        toursWithImages: 0,
        toursWithoutImages: 0,
        toursFailed: 0,
        totalImagesFound: 0,
        averageImagesPerTour: 0,
        successRate: 0
      },
      tourDetails: [],
      recommendations: [],
      criticalIssues: []
    }
  }
  
  /**
   * Run validation on a sample of tours
   */
  async validateSampleTours(limit: number = 10): Promise<ValidationReport> {
    console.log(`\n🔍 Starting validation of ${limit} sample tours...\n`)
    console.log('=' .repeat(60))
    
    try {
      // Get sample tours
      const { data: tours, error } = await this.supabase
        .from('affiliate_tours')
        .select('id, title, source_url, affiliate_url, image_gallery')
        .eq('is_active', true)
        .limit(limit)
      
      if (error || !tours) {
        throw new Error('Failed to fetch tours')
      }
      
      this.report.summary.totalTours = tours.length
      
      // Process each tour
      for (const tour of tours) {
        console.log(`\n📸 Validating: ${tour.title}`)
        console.log('-'.repeat(40))
        
        const validation = await this.validateTour(tour)
        this.report.tourDetails.push(validation)
        
        // Update summary
        if (validation.status === 'success') {
          this.report.summary.toursWithImages++
        } else if (validation.status === 'failed') {
          this.report.summary.toursFailed++
        }
        
        if (validation.imageCount === 0) {
          this.report.summary.toursWithoutImages++
        }
        
        this.report.summary.totalImagesFound += validation.imageCount
        
        // Print progress
        this.printTourValidation(validation)
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Calculate final statistics
      this.report.summary.averageImagesPerTour = 
        this.report.summary.totalImagesFound / this.report.summary.totalTours
      
      this.report.summary.successRate = 
        (this.report.summary.toursWithImages / this.report.summary.totalTours) * 100
      
      // Generate recommendations
      this.generateRecommendations()
      
      // Cleanup
      await this.scraper.cleanup()
      
      // Print final report
      this.printFinalReport()
      
      // Save report to file
      await this.saveReportToFile()
      
      return this.report
      
    } catch (error) {
      console.error('❌ Validation failed:', error)
      await this.scraper.cleanup()
      throw error
    }
  }
  
  /**
   * Validate a single tour
   */
  private async validateTour(tour: any): Promise<TourValidation> {
    const startTime = Date.now()
    const validation: TourValidation = {
      id: tour.id,
      title: tour.title,
      url: tour.source_url || tour.affiliate_url,
      status: 'failed',
      imageCount: 0,
      imageTypes: {
        hero: 0,
        gallery: 0,
        content: 0,
        background: 0
      },
      validation: {
        hasHeroImage: false,
        hasGalleryImages: false,
        minimumImagesMet: false,
        allImagesAccessible: true
      },
      issues: [],
      scrapeTime: 0
    }
    
    if (!validation.url) {
      validation.issues.push('No URL available for tour')
      return validation
    }
    
    try {
      // Scrape images
      const result = await this.scraper.scrapeTourImages(validation.url)
      
      if (!result.success) {
        validation.issues.push(`Scraping failed: ${result.error}`)
        validation.scrapeTime = Date.now() - startTime
        return validation
      }
      
      // Update counts
      validation.imageCount = result.images.length
      validation.imageTypes = {
        hero: result.stats.heroImages,
        gallery: result.stats.galleryImages,
        content: result.stats.contentImages,
        background: result.stats.backgroundImages
      }
      
      // Validate image requirements
      validation.validation.hasHeroImage = result.stats.heroImages > 0
      validation.validation.hasGalleryImages = result.stats.galleryImages > 0
      validation.validation.minimumImagesMet = result.images.length >= this.minRequiredImages
      
      if (!validation.validation.hasHeroImage) {
        validation.issues.push('No hero image found')
      }
      
      if (!validation.validation.hasGalleryImages) {
        validation.issues.push('No gallery images found')
      }
      
      if (!validation.validation.minimumImagesMet) {
        validation.issues.push(`Only ${result.images.length} images found (minimum: ${this.minRequiredImages})`)
      }
      
      // Sample validation of image accessibility
      if (result.images.length > 0) {
        const sampleSize = Math.min(3, result.images.length)
        const samplesToTest = result.images.slice(0, sampleSize)
        
        for (const image of samplesToTest) {
          const imageValidation = await this.scraper.validateImage(image.url)
          if (!imageValidation.accessible) {
            validation.validation.allImagesAccessible = false
            validation.issues.push(`Image not accessible: ${image.url.substring(0, 50)}...`)
          }
        }
      }
      
      // Determine overall status
      if (validation.imageCount === 0) {
        validation.status = 'failed'
      } else if (validation.issues.length > 0) {
        validation.status = 'partial'
      } else {
        validation.status = 'success'
      }
      
      validation.scrapeTime = Date.now() - startTime
      
    } catch (error) {
      validation.issues.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`)
      validation.scrapeTime = Date.now() - startTime
    }
    
    return validation
  }
  
  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations() {
    const avgImages = this.report.summary.averageImagesPerTour
    
    if (avgImages < 5) {
      this.report.recommendations.push(
        'Average image count is low. Consider implementing more comprehensive image extraction strategies.'
      )
    }
    
    if (this.report.summary.successRate < 80) {
      this.report.recommendations.push(
        'Success rate is below 80%. Review failed tours and adjust scraping strategies.'
      )
    }
    
    const toursWithoutHero = this.report.tourDetails.filter(
      t => !t.validation.hasHeroImage
    ).length
    
    if (toursWithoutHero > 0) {
      this.report.recommendations.push(
        `${toursWithoutHero} tours lack hero images. Consider fallback strategies for hero image selection.`
      )
    }
    
    const toursWithAccessibilityIssues = this.report.tourDetails.filter(
      t => !t.validation.allImagesAccessible
    ).length
    
    if (toursWithAccessibilityIssues > 0) {
      this.report.criticalIssues.push(
        `${toursWithAccessibilityIssues} tours have inaccessible images that need immediate attention.`
      )
    }
    
    if (this.report.summary.toursFailed > 0) {
      this.report.criticalIssues.push(
        `${this.report.summary.toursFailed} tours completely failed to scrape.`
      )
    }
  }
  
  /**
   * Print validation for a single tour
   */
  private printTourValidation(validation: TourValidation) {
    const statusEmoji = {
      success: '✅',
      partial: '⚠️',
      failed: '❌'
    }
    
    console.log(`Status: ${statusEmoji[validation.status]} ${validation.status.toUpperCase()}`)
    console.log(`Images found: ${validation.imageCount}`)
    
    if (validation.imageCount > 0) {
      console.log(`  - Hero: ${validation.imageTypes.hero}`)
      console.log(`  - Gallery: ${validation.imageTypes.gallery}`)
      console.log(`  - Content: ${validation.imageTypes.content}`)
      console.log(`  - Background: ${validation.imageTypes.background}`)
    }
    
    if (validation.issues.length > 0) {
      console.log('Issues:')
      validation.issues.forEach(issue => {
        console.log(`  ⚠️  ${issue}`)
      })
    }
    
    console.log(`Scrape time: ${validation.scrapeTime}ms`)
  }
  
  /**
   * Print final validation report
   */
  private printFinalReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 VALIDATION REPORT SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`\n📈 Statistics:`)
    console.log(`  Total tours validated: ${this.report.summary.totalTours}`)
    console.log(`  Tours with images: ${this.report.summary.toursWithImages}`)
    console.log(`  Tours without images: ${this.report.summary.toursWithoutImages}`)
    console.log(`  Tours failed: ${this.report.summary.toursFailed}`)
    console.log(`  Total images found: ${this.report.summary.totalImagesFound}`)
    console.log(`  Average images per tour: ${this.report.summary.averageImagesPerTour.toFixed(1)}`)
    console.log(`  Success rate: ${this.report.summary.successRate.toFixed(1)}%`)
    
    if (this.report.criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues:`)
      this.report.criticalIssues.forEach(issue => {
        console.log(`  - ${issue}`)
      })
    }
    
    if (this.report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`)
      this.report.recommendations.forEach(rec => {
        console.log(`  - ${rec}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
  }
  
  /**
   * Save report to JSON file
   */
  private async saveReportToFile() {
    const filename = `image-validation-report-${Date.now()}.json`
    const filepath = path.join(process.cwd(), 'reports', filename)
    
    try {
      // Create reports directory if it doesn't exist
      await fs.mkdir(path.dirname(filepath), { recursive: true })
      
      // Save report
      await fs.writeFile(filepath, JSON.stringify(this.report, null, 2))
      
      console.log(`\n📄 Report saved to: ${filepath}`)
    } catch (error) {
      console.error('Failed to save report:', error)
    }
  }
}

/**
 * Run full sync with validation
 */
export async function runFullSyncWithValidation() {
  console.log('\n🚀 Starting FULL IMAGE SYNC with validation...\n')
  console.log('This will process ALL tours and may take several minutes.')
  console.log('=' .repeat(60))
  
  try {
    const result = await syncAllTourImagesWithValidation()
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ SYNC COMPLETE')
    console.log('='.repeat(60))
    console.log(`Total tours processed: ${result.totalTours}`)
    console.log(`Successful syncs: ${result.successfulSyncs}`)
    console.log(`Failed syncs: ${result.failedSyncs}`)
    console.log(`Total images scraped: ${result.totalImagesScraped}`)
    console.log(`Success rate: ${(result.successfulSyncs / result.totalTours * 100).toFixed(1)}%`)
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'reports', `full-sync-report-${Date.now()}.json`)
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(result, null, 2))
    console.log(`\n📄 Detailed report saved to: ${reportPath}`)
    
    return result
  } catch (error) {
    console.error('❌ Full sync failed:', error)
    throw error
  }
}