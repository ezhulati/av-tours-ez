// Test script to verify filter functionality
const BASE_URL = "http://localhost:4321";

async function testFilters() {
  console.log("Testing Tour Filters API...");
  
  const tests = [
    { name: "No filters", params: "" },
    { name: "Country: Albania", params: "country=Albania" },
    { name: "Difficulty: easy", params: "difficulty=easy" },
    { name: "Price range", params: "price_min=100&price_max=500" },
    { name: "Combined", params: "country=Albania&difficulty=moderate" }
  ];
  
  for (const test of tests) {
    console.log("\n" + test.name);
    const url = BASE_URL + "/api/tours" + (test.params ? "?" + test.params : "");
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log("Found: " + (data.items ? data.items.length : 0) + " tours");
      if (data.items && data.items[0]) {
        console.log("Sample: " + data.items[0].title);
      }
    } catch (error) {
      console.error("Error: " + error.message);
    }
  }
}

setTimeout(() => {
  testFilters().then(() => {
    console.log("\nTests completed\!");
    process.exit(0);
  });
}, 3000);
