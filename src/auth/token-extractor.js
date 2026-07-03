/**
 * Extract Kiri refresh token from browser context
 */

const Logger = require('../utils/logger');

const logger = new Logger('TokenExtractor');

class TokenExtractor {
  /**
   * Extract refresh token from localStorage
   * @param {import('playwright').Page} page - Playwright page
   * @returns {Promise<string|null>} Refresh token or null
   */
  async extractFromLocalStorage(page) {
    try {
      logger.info('Extracting token from localStorage...');

      const refreshToken = await page.evaluate(() => {
        // Kiri uses AWS Cognito - scan for Cognito keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('CognitoIdentityServiceProvider') && key.includes('refreshToken')) {
            return localStorage.getItem(key);
          }
        }

        // Fallback: scan all keys for anything that looks like a refresh token
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          
          if (value && typeof value === 'string' && value.length > 100) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.refreshToken) {
                return parsed.refreshToken;
              }
            } catch {
              // Not JSON, check if value itself looks like a token
              if (key.toLowerCase().includes('refresh') || key.toLowerCase().includes('token')) {
                return value;
              }
            }
          }
        }

        return null;
      });

      if (refreshToken) {
        logger.success('Refresh token extracted from localStorage');
        return refreshToken;
      }

      logger.warn('No refresh token found in localStorage');
      return null;
    } catch (error) {
      logger.error('Failed to extract token from localStorage', { error: error.message });
      return null;
    }
  }

  /**
   * Extract refresh token with retry logic
   * @param {import('playwright').Page} page - Playwright page
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} delayMs - Delay between retries
   * @returns {Promise<string|null>}
   */
  async extractWithRetry(page, maxRetries = 5, delayMs = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info(`Token extraction attempt ${attempt}/${maxRetries}`);

      const token = await this.extractFromLocalStorage(page);
      
      if (token) {
        return token;
      }

      if (attempt < maxRetries) {
        logger.info(`Waiting ${delayMs}ms before retry...`);
        await page.waitForTimeout(delayMs);
      }
    }

    logger.error('All token extraction attempts failed');
    return null;
  }
}

module.exports = TokenExtractor;
