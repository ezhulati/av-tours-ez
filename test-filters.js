/**
 * Test script for tour filtering system
 * Run with: node test-filters.js
 */

const baseUrl = 'http://localhost:4321/api/tours';

// Test cases for different filter combinations
const testCases = [
  {
    name: 'No filters - should return all tours',
    params: {},
    expected: 'Should return tours with default pagination'
  },
  {
    name: 'Filter by country - Albania',
    params: { country: 'Albania' },
    expected: 'Should return only tours in Albania'
  },
  {
    name: 'Filter by difficulty - easy',
    params: { difficulty: 'easy' },
    expected: 'Should return only easy tours'
  },
  {
    name: 'Filter by price range',
    params: { price_min: 50, price_max: 200 },
    expected: 'Should return tours within price range'
  },
  {
    name: 'Filter by duration',
    params: { duration_min: 1, duration_max: 3 },
    expected: 'Should return tours with 1-3 days duration'
  },
  {
    name: 'Filter by group size - small',
    params: { group_size: 'small' },
    expected: 'Should return small group tours'
  },
  {
    name: 'Combined filters',
    params: { 
      country: 'Albania', 
      difficulty: 'moderate',
      price_max: 300 
    },
    expected: 'Should return moderate tours in Albania under €300'
  },
  {
    name: 'Sort by price',
    params: { sort: 'price' },
    expected: 'Should return tours sorted by price (low to high)'
  },
  {
    name: 'Sort by duration',
    params: { sort: 'duration' },
    expected: 'Should return tours sorted by duration'
  },
  {
    name: 'Pagination - page 2',
    params: { page: 2, limit: 6 },
    expected: 'Should return page 2 with 6 items per page'
  }
];

async function testFilters() {
  console.log('🔍 Testing Tour Filtering System\n');
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of testCases) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    
    const params = new URLSearchParams();
    Object.entries(test.params).forEach(([key, value]) => {
      params.set(key, value.toString());
    });
    
    const url = `${baseUrl}?${params}`;
    console.log(`   URL: ${url}`);
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`   ❌ FAILED: HTTP ${response.status}`);
        failedTests++;
        continue;
      }
      
      // Validate response structure
      if (!data.items || !data.pagination) {
        console.log(`   ❌ FAILED: Invalid response structure`);
        console.log(`   Response:`, JSON.stringify(data, null, 2).slice(0, 200));
        failedTests++;
        continue;
      }
      
      // Log results
      console.log(`   ✅ SUCCESS`);
      console.log(`   - Items returned: ${data.items.length}`);
      console.log(`   - Total items: ${data.pagination.total}`);
      console.log(`   - Total pages: ${data.pagination.totalPages}`);
      console.log(`   - Current page: ${data.pagination.page}`);
      
      // Validate specific filters
      if (test.params.country) {
        const allMatch = data.items.every(item => 
          item.countries.includes(test.params.country)
        );
        console.log(`   - Country filter: ${allMatch ? '✅' : '❌'}`);
      }
      
      if (test.params.difficulty) {
        const allMatch = data.items.every(item => 
          item.difficulty === test.params.difficulty
        );
        console.log(`   - Difficulty filter: ${allMatch ? '✅' : '❌'}`);
      }
      
      if (test.params.price_min !== undefined || test.params.price_max !== undefined) {
        const allMatch = data.items.every(item => {
          if (item.priceMin === null) return true; // Skip tours without price
          if (test.params.price_min && item.priceMin < test.params.price_min) return false;
          if (test.params.price_max && item.priceMax > test.params.price_max) return false;
          return true;
        });
        console.log(`   - Price filter: ${allMatch ? '✅' : '❌'}`);
      }
      
      if (test.params.sort === 'price') {
        const sorted = data.items.every((item, i) => {
          if (i === 0) return true;
          const prevPrice = data.items[i-1].priceMin || Number.MAX_VALUE;
          const currPrice = item.priceMin || Number.MAX_VALUE;
          return prevPrice <= currPrice;
        });
        console.log(`   - Price sorting: ${sorted ? '✅' : '❌'}`);
      }
      
      if (test.params.sort === 'duration') {
        const sorted = data.items.every((item, i) => {
          if (i === 0) return true;
          const prevDuration = data.items[i-1].durationDays || Number.MAX_VALUE;
          const currDuration = item.durationDays || Number.MAX_VALUE;
          return prevDuration <= currDuration;
        });
        console.log(`   - Duration sorting: ${sorted ? '✅' : '❌'}`);
      }
      
      // Show sample results
      if (data.items.length > 0) {
        console.log(`   - Sample tour: "${data.items[0].title}"`);
        if (data.items[0].priceMin) {
          console.log(`     Price: €${data.items[0].priceMin}`);
        }
        if (data.items[0].durationDays) {
          console.log(`     Duration: ${data.items[0].durationDays} days`);
        }
        if (data.items[0].difficulty) {
          console.log(`     Difficulty: ${data.items[0].difficulty}`);
        }
        console.log(`     Countries: ${data.items[0].countries.join(', ')}`);
      }
      
      passedTests++;
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passedTests}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failedTests}/${testCases.length}`);
  console.log(`   Success Rate: ${Math.round((passedTests/testCases.length) * 100)}%\n`);
}

// Run tests
testFilters().catch(console.error);