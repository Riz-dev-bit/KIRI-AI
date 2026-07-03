/**
 * KIRI-AI - Automated OAuth Token Management
 * 
 * Main entry point for token extraction and router import
 */

require('dotenv').config();

const ConfigLoader = require('./lib/utils/config-loader');
const BrowserManager = require('./lib/utils/browser');
const RouterClient = require('./lib/utils/router');
const GSuiteProvider = require('./lib/providers/gsuite');
const GmailProvider = require('./lib/providers/gmail');
const Logger = require('./lib/utils/logger');

const logger = new Logger('Main');

async function main() {
  try {
    logger.section('🚀 KIRI-AI - Starting Token Extraction');

    // Load configuration
    const configLoader = new ConfigLoader();
    
    if (!configLoader.validate()) {
      logger.error('Configuration validation failed - please check your config files');
      process.exit(1);
    }
    // Load all configs
    const gsuiteEmails = configLoader.loadGSuiteConfig();
    const gsuitePassword = configLoader.loadGSuitePassword();
    const gmailAccounts = configLoader.loadGmailConfig();
    const proxies = configLoader.loadProxyConfig();
    const routerConfig = configLoader.load9RouterConfig();

    // Initialize services
    const browserManager = new BrowserManager(proxies);
    const routerClient = new RouterClient(routerConfig);

    // Authenticate with 9Router
    await routerClient.authenticate();

    // Get delay from env or default to 5s
    const delayMs = parseInt(process.env.DELAY_BETWEEN_ACCOUNTS || '5000', 10);

    const results = {
      gsuite: { success: 0, failed: 0, skipped: 0 },
      gmail: { success: 0, failed: 0, skipped: 0 }
    };

    // Process GSuite accounts
    if (gsuiteEmails.length > 0) {
      const gsuiteProvider = new GSuiteProvider(browserManager, routerClient);
      const gsuiteResult = await gsuiteProvider.processAccounts(gsuiteEmails, gsuitePassword, delayMs);
      results.gsuite = gsuiteResult;
    }

    // Process Gmail accounts (if implemented)
    if (gmailAccounts.length > 0) {
      const gmailProvider = new GmailProvider(browserManager, routerClient);
      const gmailResult = await gmailProvider.processAccounts(gmailAccounts, delayMs);
      results.gmail = gmailResult;
    }

    // Final summary
    logger.section('📊 Final Summary');
    const totalSuccess = results.gsuite.success + results.gmail.success;
    const totalFailed = results.gsuite.failed + results.gmail.failed;
    const totalSkipped = results.gsuite.skipped + results.gmail.skipped;
    const totalProcessed = totalSuccess + totalFailed + totalSkipped;

    logger.success(`✅ Total Successful: ${totalSuccess}`);
    logger.info(`⏭️  Total Skipped: ${totalSkipped}`);
    logger.error(`❌ Total Failed: ${totalFailed}`);
    logger.info(`📈 Total Processed: ${totalProcessed}`);

    if (totalSuccess > 0) {
      const creditsPerMonth = totalSuccess * 50;
      logger.success(`💰 Monthly Credits: ${creditsPerMonth} (${totalSuccess} accounts × 50)`);
    }

    logger.section('✨ KIRI-AI - Complete');
    logger.info(`🔗 9Router: ${routerConfig.endpoint}`);

    process.exit(totalFailed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Fatal error', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Run
main();
