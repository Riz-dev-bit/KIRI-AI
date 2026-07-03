/**
 * GSuite account provider
 */

const Logger = require('../utils/logger');
const GoogleSSOHandler = require('../auth/google-sso');
const TokenExtractor = require('../auth/token-extractor');

const logger = new Logger('GSuiteProvider');

class GSuiteProvider {
  constructor(browserManager, routerClient) {
    this.browserManager = browserManager;
    this.routerClient = routerClient;
    this.ssoHandler = new GoogleSSOHandler();
    this.tokenExtractor = new TokenExtractor();
  }

  /**
   * Process single GSuite account
   * @param {string} email - GSuite email
   * @param {string} password - GSuite password
   * @param {Array} existingTokens - List of existing tokens in 9Router
   * @returns {Promise<{success: boolean, email: string, error?: string}>}
   */
  async processAccount(email, password, existingTokens) {
    let browser = null;
    let proxy = null;

    try {
      logger.info(`Processing GSuite account: ${email}`);

      // Check if already exists in 9Router
      if (this.routerClient.emailExists(email, existingTokens)) {
        logger.warn(`Skipping ${email} - already exists in 9Router`);
        return { success: false, email, skipped: true };
      }

      // Launch browser with proxy rotation
      const launchResult = await this.browserManager.launchWithRotation();
      browser = launchResult.browser;
      proxy = launchResult.proxy;

      const context = await browser.newContext();
      const page = await context.newPage();

      // Perform Google SSO login
      const loginSuccess = await this.ssoHandler.login(page, email, password);

      if (!loginSuccess) {
        throw new Error('Google SSO login failed');
      }

      // Extract refresh token
      const refreshToken = await this.tokenExtractor.extractWithRetry(page);

      if (!refreshToken) {
        throw new Error('Failed to extract refresh token');
      }

      logger.success(`Refresh token extracted: ${email}`);

      // Import to 9Router
      const importSuccess = await this.routerClient.importToken(email, refreshToken);

      if (!importSuccess) {
        throw new Error('Failed to import token to 9Router');
      }

      await browser.close();

      return { success: true, email };
    } catch (error) {
      logger.error(`Failed to process ${email}`, { error: error.message });

      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          logger.warn('Failed to close browser', { error: closeError.message });
        }
      }

      return { success: false, email, error: error.message };
    }
  }

  /**
   * Process multiple GSuite accounts
   * @param {string[]} emails - Array of GSuite emails
   * @param {string} password - Shared password for all accounts
   * @param {number} delayMs - Delay between accounts
   * @returns {Promise<{success: number, failed: number, skipped: number, results: Array}>}
   */
  async processAccounts(emails, password, delayMs = 5000) {
    logger.section(`Processing ${emails.length} GSuite Accounts`);

    // Fetch existing tokens from 9Router once
    const existingTokens = await this.routerClient.getExistingTokens();

    const results = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      logger.progress(i + 1, emails.length, email);

      const result = await this.processAccount(email, password, existingTokens);
      results.push(result);

      if (result.success) {
        successCount++;
        // Add to existingTokens to prevent duplicate processing in same run
        existingTokens.push({ email });
      } else if (result.skipped) {
        skippedCount++;
      } else {
        failedCount++;
      }

      // Delay between accounts (except last one)
      if (i < emails.length - 1) {
        logger.info(`Waiting ${delayMs}ms before next account...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    logger.section('GSuite Processing Complete');
    logger.success(`✅ Successful: ${successCount}`);
    logger.info(`⏭️  Skipped: ${skippedCount}`);
    logger.error(`❌ Failed: ${failedCount}`);

    return {
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
      results
    };
  }
}

module.exports = GSuiteProvider;
