import { enhancedTourCopy } from '../src/data/enhancedTours'

console.log('=== AlbaniaVisit Enhanced Tours Verification ===\n')

const requiredFields = [
  'id',
  'slug',
  'enhancedTitle',
  'tagline',
  'heroDescription',
  'highlights',
  'callToAction',
  'uniqueFeatures',
  'emoji',
  'badges'
]

const optionalFields = ['pricing', 'dates']

let allValid = true
const issues: string[] = []

const tourSlugs = Object.keys(enhancedTourCopy)
console.log(`Total tours found: ${tourSlugs.length}\n`)

tourSlugs.forEach((slug, index) => {
  const tour = enhancedTourCopy[slug]
  const tourNumber = index + 1
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!tour[field as keyof typeof tour]) {
      allValid = false
      issues.push(`Tour ${tourNumber} (${slug}): Missing required field '${field}'`)
    }
  })
  
  // Check array fields have content
  if (tour.highlights && tour.highlights.length === 0) {
    allValid = false
    issues.push(`Tour ${tourNumber} (${slug}): Highlights array is empty`)
  }
  
  if (tour.uniqueFeatures && tour.uniqueFeatures.length === 0) {
    allValid = false
    issues.push(`Tour ${tourNumber} (${slug}): UniqueFeatures array is empty`)
  }
  
  if (tour.badges && tour.badges.length === 0) {
    allValid = false
    issues.push(`Tour ${tourNumber} (${slug}): Badges array is empty`)
  }
  
  // Check content quality
  if (tour.heroDescription && tour.heroDescription.length < 50) {
    issues.push(`Tour ${tourNumber} (${slug}): Hero description seems too short (${tour.heroDescription.length} chars)`)
  }
  
  if (tour.tagline && tour.tagline.length < 10) {
    issues.push(`Tour ${tourNumber} (${slug}): Tagline seems too short`)
  }
})

// Display results
if (allValid && issues.length === 0) {
  console.log('✅ ALL TOURS VERIFIED SUCCESSFULLY!\n')
  console.log('Summary:')
  console.log(`- ${tourSlugs.length} tours with complete enhanced content`)
  console.log('- All required fields present')
  console.log('- All arrays have content')
  console.log('- All descriptions meet minimum length requirements')
} else {
  console.log('❌ ISSUES FOUND:\n')
  issues.forEach(issue => console.log(`  - ${issue}`))
}

// List all tour titles for final review
console.log('\n=== All Enhanced Tour Titles ===\n')
tourSlugs.forEach((slug, index) => {
  const tour = enhancedTourCopy[slug]
  console.log(`${index + 1}. ${tour.enhancedTitle} - "${tour.tagline}"`)
})

console.log('\n=== Verification Complete ===')