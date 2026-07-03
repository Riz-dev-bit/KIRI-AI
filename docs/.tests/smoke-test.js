/**
 * Smoke test - validate configuration files
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '../..');

const tests = [
  {
    name: 'Config directory exists',
    check: () => fs.existsSync(rootDir)
  },
  {
    name: '9Router config exists',
    check: () => fs.existsSync(path.join(rootDir, '9router.json'))
  },
  {
    name: '9Router config is valid JSON',
    check: () => {
      try {
        const config = JSON.parse(fs.readFileSync(path.join(rootDir, '9router.json'), 'utf-8'));
        return config.endpoint && config.password;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'At least one account source exists (gsuite.txt or gmail.txt)',
    check: () => {
      const gsuiteExists = fs.existsSync(path.join(rootDir, 'gsuite.txt'));
      const gmailExists = fs.existsSync(path.join(rootDir, 'gmail.txt'));
      return gsuiteExists || gmailExists;
    }
  },
  {
    name: 'GSuite password exists if gsuite.txt exists',
    check: () => {
      const gsuiteExists = fs.existsSync(path.join(rootDir, 'gsuite.txt'));
      if (!gsuiteExists) return true; // Not applicable
      return fs.existsSync(path.join(rootDir, 'password-gsuite.txt'));
    }
  }
];

console.log('\n🧪 Running smoke tests...\n');

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const result = test.check();
  if (result) {
    console.log(`✅ ${test.name}`);
    passed++;
  } else {
    console.log(`❌ ${test.name}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('⚠️  Some tests failed. Please check your configuration.');
  console.log('📖 See README.md for setup instructions.\n');
  process.exit(1);
} else {
  console.log('✨ All tests passed! Ready to run.\n');
  process.exit(0);
}
