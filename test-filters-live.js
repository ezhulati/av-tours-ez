// Test the live filter functionality
async function testFilters() {
  const baseUrl = 'http://localhost:4321/api/tours';
  
  console.log('🧪 Testing Tour Filters - Live API\n');
  console.log('================================\n');
  
  const tests = [
    {
      name: 'No filters - should return all tours',
      params: {},
    },
    {
      name: 'Country filter - Albania only',
      params: { country: 'Albania' },
    },
    {
      name: 'Difficulty filter - Easy tours',
      params: { difficulty: 'easy' },
    },
    {
      name: 'Price filter - Budget tours under €100',
      params: { priceMin: '0', priceMax: '100' },
    },
    {
      name: 'Duration filter - Day trips',
      params: { durationMin: '0', durationMax: '1' },
    },
    {
      name: 'Combined filters - Albania + Easy + Under €200',
      params: { 
        country: 'Albania', 
        difficulty: 'easy',
        priceMax: '200'
      },
    },
  ];
  
  for (const test of tests) {
    console.log(`📋 Test: ${test.name}`);
    
    const url = new URL(baseUrl);
    Object.entries(test.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`❌ Failed: HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ Success: ${data.items.length} tours found`);
      
      if (data.items.length > 0) {
        console.log(`   Sample: "${data.items[0].title}"`);
      }
      
      // Validate filter results
      if (test.params.country) {
        const hasCountry = data.items.every(tour => 
          tour.countries.includes(test.params.country)
        );
        console.log(`   Country validation: ${hasCountry ? '✅' : '❌'}`);
      }
      
      if (test.params.difficulty) {
        const hasDifficulty = data.items.every(tour => 
          tour.difficulty === test.params.difficulty
        );
        console.log(`   Difficulty validation: ${hasDifficulty ? '✅' : '❌'}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('================================');
  console.log('📊 Filter testing complete!\n');
}

// Run the test
testFilters().catch(console.error);