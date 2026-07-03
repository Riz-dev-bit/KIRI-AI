#!/usr/bin/env node
/**
 * KIRI-AI - Import tokens to 9Router
 * Usage: node import-to-9router.js [kiro-tokens.json]
 */

const DatabaseImporter = require('./lib/utils/db-importer');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const tokenFile = args[0] || path.join(process.cwd(), 'kiro-tokens.json');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 KIRI-AI - Auto Import to 9Router Database');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const importer = new DatabaseImporter();
    console.log(`📂 Reading tokens from: ${tokenFile}\n`);

    const stats = await importer.importFromFile(tokenFile);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  📊 Import Summary');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Imported:  ${stats.success}`);
    console.log(`⏭️  Skipped:   ${stats.skipped} (already exist)`);
    console.log(`❌ Failed:    ${stats.failed}`);
    console.log(`📈 Total:     ${stats.success + stats.skipped + stats.failed}\n`);

    if (stats.success > 0) {
      console.log('💡 Restart 9Router to reload connections:');
      console.log('   pkill -f 9router && 9router\n');
    }

    process.exit(stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    
    if (error.message.includes('better-sqlite3')) {
      console.error('\n💡 Install dependency:');
      console.error('   npm install better-sqlite3\n');
    }
    
    process.exit(1);
  }
}

main();
