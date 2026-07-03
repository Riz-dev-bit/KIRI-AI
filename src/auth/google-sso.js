/**
 * Google SSO authentication handler
 */

const { TOTP } = require('otpauth');
const Logger = require('../utils/logger');

const logger = new Logger('GoogleSSO');

class GoogleSSOHandler {
  /**
   * Perform Google SSO login
   * @param {import('playwright').Page} page - Playwright page
   * @param {string} email - Google account email
   * @param {string} password - Google account password
   * @param {string|null} twoFactorSecret - TOTP secret (optional)
   * @returns {Promise<boolean>} True if login successful
   */
  async login(page, email, password, twoFactorSecret = null) {
    try {
      logger.info(`Authenticating: ${email}`);

      // Navigate to Kiri signin page
      await page.goto('https://app.kiro.dev/signin', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Click Google SSO button
      logger.info('Clicking Google SSO button...');
      await page.click('button:has-text("Google"), a:has-text("Google"), [aria-label*="Google"]', { timeout: 10000 });

      // Wait for Google login page
      await page.waitForURL('**/accounts.google.com/**', { timeout: 15000 });
      logger.info('Redirected to Google login');

      // Enter email
      await page.fill('input[type="email"]', email, { timeout: 10000 });
      await page.click('button:has-text("Next"), #identifierNext', { timeout: 5000 });
      logger.info('Email submitted');

      // Wait for password field
      await page.waitForSelector('input[type="password"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Enter password
      await page.fill('input[type="password"]', password);
      await page.click('button:has-text("Next"), #passwordNext', { timeout: 5000 });
      logger.info('Password submitted');

      // Handle 2FA if secret is provided
      if (twoFactorSecret) {
        logger.info('2FA enabled - generating TOTP code...');
        await this.handle2FA(page, twoFactorSecret);
      }

      // Handle Google Workspace ToS (if appears)
      await this.handleWorkspaceToS(page);

      // Wait for OAuth consent and redirect to Kiri
      await this.waitForKiriRedirect(page);

      logger.success(`Login successful: ${email}`);
      return true;
    } catch (error) {
      logger.error(`Login failed for ${email}`, { error: error.message });
      return false;
    }
  }

  /**
   * Handle 2FA verification
   * @private
   */
  async handle2FA(page, secret) {
    try {
      // Wait for 2FA prompt
      await page.waitForSelector('input[type="tel"], input[name="totpPin"]', { timeout: 10000 });

      // Generate TOTP code
      const totp = new TOTP({ secret });
      const code = totp.generate();

      logger.info(`Generated 2FA code: ${code}`);

      // Enter code
      await page.fill('input[type="tel"], input[name="totpPin"]', code);
      await page.click('button:has-text("Next")');

      logger.success('2FA code submitted');
    } catch (error) {
      logger.warn('2FA prompt not found or failed - continuing anyway', { error: error.message });
    }
  }

  /**
   * Handle Google Workspace Terms of Service dialog
   * @private
   */
  async handleWorkspaceToS(page) {
    try {
      // Check for "I understand" button (Workspace ToS)
      const tosButton = await page.$('button:has-text("I understand"), button:has-text("Continue")');
      
      if (tosButton) {
        logger.info('Workspace ToS detected - accepting...');
        await tosButton.click();
        await page.waitForTimeout(2000);
        logger.success('Workspace ToS accepted');
      }
    } catch (error) {
      logger.info('No Workspace ToS dialog - continuing');
    }
  }

  /**
   * Wait for redirect back to Kiri after OAuth
   * @private
   */
  async waitForKiriRedirect(page) {
    try {
      logger.info('Waiting for OAuth consent and Kiri redirect...');

      // Wait for Kiri domain
      await page.waitForURL('**/app.kiro.dev/**', { 
        timeout: 60000,
        waitUntil: 'networkidle'
      });

      // Additional wait for token to be set in localStorage
      await page.waitForTimeout(3000);

      logger.success('Redirected to Kiri successfully');
    } catch (error) {
      logger.error('Timeout waiting for Kiri redirect', { error: error.message });
      throw error;
    }
  }
}

module.exports = GoogleSSOHandler;
