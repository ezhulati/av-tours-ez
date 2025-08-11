#!/usr/bin/env node

import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'
import { chromium, type Browser } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'

interface AgentConfig {
  checkInterval: number // How often to run checks (in milliseconds)
  batchSize: number // How many tours to check per run
  alertThreshold: number // Percentage of failures before alerting
  autoFix: boolean // Whether to automatically fix issues
  reportPath: string // Where to save reports
}

interface ValidationIssue {
  tourId: string
  title: string
  issue: string
  severity: 'critical' | 'warning' | 'info'
  timestamp: Date
  autoFixed: boolean
}

interface AgentReport {
  runId: string
  startTime: Date
  endTime: Date
  toursChecked: number
  issuesFound: ValidationIssue[]
  autoFixesApplied: number
  successRate: number
  recommendations: string[]
}

export class ImageValidationAgent {
  private config: AgentConfig
  private browser: Browser | null = null
  private supabase: any
  private isRunning: boolean = false
  private currentReport: AgentReport | null = null
  
  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      checkInterval: config.checkInterval || 3600000, // 1 hour default
      batchSize: config.batchSize || 10,
      alertThreshold: config.alertThreshold || 20, // Alert if >20% fail
      autoFix: config.autoFix ?? true,
      reportPath: config.reportPath || './agent-reports'
    }
    
    this.supabase = this.initSupabase()
  }
  
  private initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }
    
    return createClient(supabaseUrl, supabaseKey)
  }
  
  /**
   * Start the validation agent
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Agent is already running')
      return
    }
    
    this.isRunning = true
    console.log('🤖 Image Validation Agent Started')
    console.log(`📅 Check interval: ${this.config.checkInterval / 1000 / 60} minutes`)
    console.log(`📦 Batch size: ${this.config.batchSize} tours per check`)
    console.log(`🔧 Auto-fix: ${this.config.autoFix ? 'Enabled' : 'Disabled'}`)
    console.log('')
    
    // Run immediately, then on interval
    await this.runValidationCycle()
    
    if (this.isRunning) {
      setInterval(async () => {
        if (this.isRunning) {
          await this.runValidationCycle()
        }
      }, this.config.checkInterval)
    }
  }
  
  /**
   * Stop the validation agent
   */
  async stop() {
    this.isRunning = false
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
    console.log('🛑 Image Validation Agent Stopped')
  }
  
  /**
   * Run a single validation cycle
   */
  private async runValidationCycle() {
    const runId = `run_${Date.now()}`
    const startTime = new Date()
    
    console.log(`\n🔄 Starting validation cycle ${runId}`)
    console.log(`⏰ Time: ${startTime.toLocaleString()}`)
    console.log('-'.repeat(50))
    
    this.currentReport = {
      runId,
      startTime,
      endTime: new Date(),
      toursChecked: 0,
      issuesFound: [],
      autoFixesApplied: 0,
      successRate: 0,
      recommendations: []
    }
    
    try {
      // Initialize browser if needed
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      }
      
      // Get tours to check (prioritize recently updated or problematic ones)
      const tours = await this.getToursToCheck()
      
      if (tours.length === 0) {
        console.log('✅ No tours need checking')
        return
      }
      
      console.log(`📋 Checking ${tours.length} tours...`)
      
      // Check each tour
      for (const tour of tours) {
        await this.validateTour(tour)
        this.currentReport.toursChecked++
        
        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Calculate success rate
      const criticalIssues = this.currentReport.issuesFound.filter(i => i.severity === 'critical')
      this.currentReport.successRate = 
        ((this.currentReport.toursChecked - criticalIssues.length) / this.currentReport.toursChecked) * 100
      
      // Generate recommendations
      this.generateRecommendations()
      
      // Save report
      this.currentReport.endTime = new Date()
      await this.saveReport()
      
      // Print summary
      this.printCycleSummary()
      
      // Alert if needed
      if (this.currentReport.successRate < (100 - this.config.alertThreshold)) {
        await this.sendAlert()
      }
      
    } catch (error) {
      console.error('❌ Validation cycle failed:', error)
    }
  }
  
  /**
   * Get tours that need checking
   */
  private async getToursToCheck() {
    // Priority 1: Tours with no images
    const { data: noImageTours } = await this.supabase
      .from('affiliate_tours')
      .select('id, title, source_url, affiliate_url, image_gallery, updated_at')
      .eq('is_active', true)
      .or('image_gallery.is.null,image_gallery.eq.{}')
      .limit(Math.floor(this.config.batchSize / 2))
    
    // Priority 2: Tours not checked recently (>7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: oldTours } = await this.supabase
      .from('affiliate_tours')
      .select('id, title, source_url, affiliate_url, image_gallery, updated_at')
      .eq('is_active', true)
      .lt('updated_at', sevenDaysAgo)
      .limit(Math.ceil(this.config.batchSize / 2))
    
    return [...(noImageTours || []), ...(oldTours || [])]
  }
  
  /**
   * Validate a single tour
   */
  private async validateTour(tour: any) {
    console.log(`  🔍 Checking: ${tour.title}`)
    
    // Check 1: Has images?
    if (!tour.image_gallery || tour.image_gallery.length === 0) {
      const issue: ValidationIssue = {
        tourId: tour.id,
        title: tour.title,
        issue: 'No images found',
        severity: 'critical',
        timestamp: new Date(),
        autoFixed: false
      }
      
      if (this.config.autoFix && tour.source_url) {
        console.log(`    🔧 Auto-fixing: Scraping images...`)
        const fixed = await this.autoFixMissingImages(tour)
        issue.autoFixed = fixed
        if (fixed) {
          this.currentReport!.autoFixesApplied++
          console.log(`    ✅ Fixed: Added images`)
        } else {
          console.log(`    ⚠️  Could not auto-fix`)
        }
      }
      
      this.currentReport!.issuesFound.push(issue)
      return
    }
    
    // Check 2: Validate image accessibility (sample check)
    const sampleSize = Math.min(2, tour.image_gallery.length)
    const samplesToTest = tour.image_gallery.slice(0, sampleSize)
    let inaccessibleCount = 0
    
    for (const imageUrl of samplesToTest) {
      const isAccessible = await this.checkImageAccessibility(imageUrl)
      if (!isAccessible) {
        inaccessibleCount++
      }
    }
    
    if (inaccessibleCount > 0) {
      const issue: ValidationIssue = {
        tourId: tour.id,
        title: tour.title,
        issue: `${inaccessibleCount} of ${sampleSize} sampled images are inaccessible`,
        severity: 'warning',
        timestamp: new Date(),
        autoFixed: false
      }
      
      if (this.config.autoFix) {
        console.log(`    🔧 Auto-fixing: Re-scraping images...`)
        const fixed = await this.autoFixMissingImages(tour)
        issue.autoFixed = fixed
        if (fixed) {
          this.currentReport!.autoFixesApplied++
          console.log(`    ✅ Fixed: Updated images`)
        }
      }
      
      this.currentReport!.issuesFound.push(issue)
    }
    
    // Check 3: Minimum image count
    if (tour.image_gallery.length < 3) {
      this.currentReport!.issuesFound.push({
        tourId: tour.id,
        title: tour.title,
        issue: `Only ${tour.image_gallery.length} images (minimum recommended: 3)`,
        severity: 'info',
        timestamp: new Date(),
        autoFixed: false
      })
    }
  }
  
  /**
   * Auto-fix missing images by scraping
   */
  private async autoFixMissingImages(tour: any): Promise<boolean> {
    try {
      const url = tour.source_url || tour.affiliate_url
      if (!url) return false
      
      const page = await this.browser!.newPage()
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      
      // Simple image extraction
      const images = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img')
        const results = []
        
        for (let i = 0; i < imgs.length; i++) {
          const img = imgs[i]
          if (img.src && !img.src.includes('logo') && !img.src.includes('icon')) {
            results.push(img.src)
          }
        }
        
        return results
      })
      
      await page.close()
      
      if (images.length > 0) {
        // Update database
        const { error } = await this.supabase
          .from('affiliate_tours')
          .update({
            image_gallery: images,
            primary_image: images[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', tour.id)
        
        return !error
      }
      
      return false
    } catch (error) {
      console.error(`    ❌ Auto-fix failed:`, error)
      return false
    }
  }
  
  /**
   * Check if an image URL is accessible
   */
  private async checkImageAccessibility(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations() {
    if (!this.currentReport) return
    
    const criticalCount = this.currentReport.issuesFound.filter(i => i.severity === 'critical').length
    const warningCount = this.currentReport.issuesFound.filter(i => i.severity === 'warning').length
    
    if (criticalCount > 5) {
      this.currentReport.recommendations.push(
        'High number of tours without images. Consider running a full sync operation.'
      )
    }
    
    if (warningCount > 10) {
      this.currentReport.recommendations.push(
        'Many tours have inaccessible images. Source website may have changed structure.'
      )
    }
    
    if (this.currentReport.autoFixesApplied < criticalCount * 0.5) {
      this.currentReport.recommendations.push(
        'Auto-fix success rate is low. Manual intervention may be required.'
      )
    }
  }
  
  /**
   * Print cycle summary
   */
  private printCycleSummary() {
    if (!this.currentReport) return
    
    console.log('\n📊 Cycle Summary:')
    console.log(`  Tours checked: ${this.currentReport.toursChecked}`)
    console.log(`  Issues found: ${this.currentReport.issuesFound.length}`)
    console.log(`  Auto-fixes applied: ${this.currentReport.autoFixesApplied}`)
    console.log(`  Success rate: ${this.currentReport.successRate.toFixed(1)}%`)
    
    if (this.currentReport.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      this.currentReport.recommendations.forEach(rec => {
        console.log(`  - ${rec}`)
      })
    }
  }
  
  /**
   * Save report to file
   */
  private async saveReport() {
    if (!this.currentReport) return
    
    const filename = `agent-report-${this.currentReport.runId}.json`
    const filepath = path.join(this.config.reportPath, filename)
    
    try {
      await fs.mkdir(this.config.reportPath, { recursive: true })
      await fs.writeFile(filepath, JSON.stringify(this.currentReport, null, 2))
      console.log(`\n📄 Report saved: ${filepath}`)
    } catch (error) {
      console.error('Failed to save report:', error)
    }
  }
  
  /**
   * Send alert if threshold exceeded
   */
  private async sendAlert() {
    console.log('\n🚨 ALERT: Success rate below threshold!')
    console.log(`  Current: ${this.currentReport?.successRate.toFixed(1)}%`)
    console.log(`  Threshold: ${100 - this.config.alertThreshold}%`)
    
    // In a production environment, this would send an email/Slack notification
    // For now, just log to console
  }
}

/**
 * CLI for running the agent
 */
async function main() {
  const command = process.argv[2] || 'start'
  
  console.log('🤖 Image Validation Agent')
  console.log('========================\n')
  
  const agent = new ImageValidationAgent({
    checkInterval: 60000, // Check every minute for testing (use 3600000 for production)
    batchSize: 5,
    alertThreshold: 20,
    autoFix: true,
    reportPath: './agent-reports'
  })
  
  switch (command) {
    case 'start':
      console.log('Starting agent...')
      await agent.start()
      
      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\n\nShutting down agent...')
        await agent.stop()
        process.exit(0)
      })
      break
      
    case 'once':
      console.log('Running single validation cycle...')
      await agent.start()
      await agent.stop()
      break
      
    default:
      console.log('Usage: npm run agent [start|once]')
      console.log('  start - Start the agent (runs continuously)')
      console.log('  once  - Run a single validation cycle')
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { main }