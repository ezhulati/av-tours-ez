import { validateTourPrice, formatPriceDisplay, validateScrapedPrice } from './src/lib/pricing/priceValidator'

console.log('🧪 Testing Price Validation System\n')
console.log('='.repeat(60))

// Test cases with realistic scenarios
const testCases = [
  // Invalid prices (too low)
  { input: '$1', expected: 'invalid', description: 'Unrealistically low price' },
  { input: '€19', expected: 'invalid', description: 'Below minimum threshold' },
  { input: '$5', expected: 'invalid', description: 'Way too low' },
  
  // Valid prices
  { input: '€45', expected: 'valid', description: 'Valid single price' },
  { input: '€75-150', expected: 'valid', description: 'Valid price range' },
  { input: 'From €85', expected: 'valid', description: 'Valid "from" price' },
  { input: '€250', expected: 'valid', description: 'Valid higher price' },
  
  // False positives (should be invalid)
  { input: 'Save €20', expected: 'invalid', description: 'Discount amount, not price' },
  { input: '$15 off', expected: 'invalid', description: 'Discount text' },
  { input: 'Was €100', expected: 'invalid', description: 'Original price reference' },
  { input: 'Children €10', expected: 'invalid', description: 'Child pricing' },
  { input: '$50 deposit', expected: 'invalid', description: 'Deposit amount' },
  
  // No price
  { input: null, expected: 'invalid', description: 'Null price' },
  { input: '', expected: 'invalid', description: 'Empty string' },
  { input: 'Price on request', expected: 'invalid', description: 'Price on request' },
  { input: 'Contact for price', expected: 'invalid', description: 'Contact for pricing' },
]

console.log('\n📋 Running validation tests:\n')

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const validation = validateTourPrice(test.input)
  const result = validation.isValid ? 'valid' : 'invalid'
  const success = result === test.expected
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.description}`)
    console.log(`   Input: "${test.input}" → ${result} (as expected)`)
    passed++
  } else {
    console.log(`❌ Test ${index + 1}: ${test.description}`)
    console.log(`   Input: "${test.input}" → ${result} (expected: ${test.expected})`)
    console.log(`   Reason: ${validation.reason}`)
    failed++
  }
})

console.log('\n' + '='.repeat(60))
console.log(`📊 Results: ${passed} passed, ${failed} failed`)

// Test display formatting
console.log('\n\n🎨 Testing Price Display Formatting:\n')
console.log('='.repeat(60))

const displayTests = [
  { price: '€45', tourName: 'Blue Eye Tour' },
  { price: '€1', tourName: 'Suspicious Tour' },
  { price: null, tourName: 'No Price Tour' },
  { price: 'From €85', tourName: 'Range Tour' },
  { price: '€75-150', tourName: 'Multi Price Tour' },
]

displayTests.forEach(test => {
  const display = formatPriceDisplay(test.price, 'BNAdventure')
  console.log(`\n📍 ${test.tourName}:`)
  console.log(`   Input: ${test.price || 'null'}`)
  console.log(`   Primary: ${display.primary}`)
  if (display.secondary) {
    console.log(`   Secondary: ${display.secondary}`)
  }
  if (display.isEstimate) {
    console.log(`   Is Estimate: ${display.isEstimate}`)
  }
})

// Test scraped price validation
console.log('\n\n🔍 Testing Scraped Price Validation:\n')
console.log('='.repeat(60))

const scrapedTests = [
  { price: '€45.00', title: 'Blue Eye Adventure' },
  { price: '$1', title: 'Test Tour' },
  { price: 'Save $20', title: 'Discount Tour' },
  { price: null, title: 'No Price Tour' },
  { price: '€250', title: 'Premium Tour' },
]

scrapedTests.forEach(test => {
  const result = validateScrapedPrice(test.price, test.title)
  console.log(`\n📍 ${test.title}:`)
  console.log(`   Scraped: ${test.price || 'null'}`)
  console.log(`   Valid: ${result.valid ? '✅' : '❌'}`)
  if (result.valid) {
    console.log(`   Price: ${result.price}`)
  } else {
    console.log(`   Warning: ${result.warning}`)
  }
})

console.log('\n\n✨ Testing complete!')