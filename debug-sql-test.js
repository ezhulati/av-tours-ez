// Debug SQL injection detection
const classicPayloads = [
  "' OR '1'='1",
  "' OR 1=1--",
  "' OR 'a'='a",
  "' OR 1=1#",
  "'; --",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "') OR ('1'='1",
  "') OR ('1'='1'--",
  "') OR ('1'='1'/*"
];

// Test patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE)\b)/gi,
  /(\bUNION\b.*\bSELECT\b)/gi,
  /(\bUNION\b)/gi,
  /(--|\/\*|\*\*)/g,
  /(\+\s*['"]|\|\|)/g,
  /(0x[0-9a-f]+)/gi,
  /(\b(SLEEP|WAITFOR|DELAY|pg_sleep|BENCHMARK)\b)/gi,
  /(\bAND\b.*=.*\bOR\b)/gi,
  /('\s*OR\s*'1'\s*=\s*'1)/gi,
  /('\s*OR\s*1\s*=\s*1)/gi,
  /('\s*OR\s*'[^']*'\s*=\s*'[^']*')/gi,
  /(\)\s*OR\s*\('[^']*'='[^']*')/gi,
  /(\)\s*OR\s*\('[^']*'='[^']*'.*\*\/)/gi,
  /('\s*OR\s*\d+\s*=\s*\d+)/gi,
  /(\)\s*OR\s*\()/gi,
  /('\s*;)/g,
  /(;\s*--)/g,
  /('\s*;.*--)/g,
  /('\s*OR\s*1\s*=\s*1\s*#)/gi,
  /('\s*OR\s*1\s*=\s*1\s*--)/gi,
  /('\s*OR\s*'[^']*'\s*=\s*'[^']*'\s*--)/gi,
  /('\s*OR\s*'[^']*'\s*=\s*'[^']*'\s*\/\*)/gi
];

function detectSQLInjection(input) {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

console.log('Testing SQL injection detection:');
classicPayloads.forEach(payload => {
  const detected = detectSQLInjection(payload);
  console.log(`"${payload}" -> ${detected}`);
  if (!detected) {
    console.log('  Checking individual patterns:');
    SQL_INJECTION_PATTERNS.forEach((pattern, i) => {
      if (pattern.test(payload)) {
        console.log(`    Pattern ${i} matched: ${pattern}`);
      }
    });
  }
});