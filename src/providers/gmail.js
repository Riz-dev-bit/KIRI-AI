/**
 * Gmail account provider (COMING SOON)
 * 
 * Gmail authentication requires additional security handling:
 * - Phone verification challenges
 * - Suspicious login detection
 * - Device confirmation prompts
 * - More aggressive bot detection
 * 
 * This provider is planned for future implementation.
 * Contributions welcome!
 */

const Logger = require('../utils/logger');

const logger = new Logger('GmailProvider');

class GmailProvider {
  constructor(browserManager, routerClient) {
    this.browserManager = browserManager;
    this.routerClient = routerClient;
  }

  /**
   * Process Gmail accounts (NOT YET IMPLEMENTED)
   */
  async processAccounts(accounts, delayMs = 5000) {
    logger.warn('Gmail provider is not yet implemented');
    logger.info('Gmail accounts require additional security handling');
    logger.info('Please use GSuite accounts for now, or contribute to this feature!');
    logger.info('See: https://github.com/YOUR_USERNAME/KIRI-AI/blob/main/CONTRIBUTING.md');
    
    return {
      success: 0,
      failed: 0,
      skipped: accounts.length,
      results: accounts.map(acc => ({ 
        success: false, 
        email: acc.email, 
        skipped: true,
        error: 'Gmail provider not yet implemented'
      }))
    };
  }
}

module.exports = GmailProvider;
