/**
 * Playwright browser setup with proxy support
 */

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Logger = require('./logger');

chromium.use(StealthPlugin());

const logger = new Logger('Browser');

class BrowserManager {
  constructor(proxies = []) {
    this.proxies = proxies;
    this.currentProxyIndex = 0;
  }

  /**
   * Get next proxy in rotation (or single proxy if only one)
   * @returns {string|null} Proxy URL or null if no proxies
   */
  getNextProxy() {
    if (this.proxies.length === 0) {
      return null;
    }

    if (this.proxies.length === 1) {
      // Single proxy - reuse (supports rotating residential proxies)
      return this.proxies[0];
    }

    // Multiple proxies - round-robin
    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return proxy;
  }

  /**
   * Launch Chromium browser with stealth and optional proxy
   * @param {string|null} proxyUrl - Optional proxy URL
   * @returns {Promise<import('playwright').Browser>}
   */
  async launch(proxyUrl = null) {
    const launchOptions = {
      headless: process.env.HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    };

    // Add proxy if provided
    if (proxyUrl) {
      const proxyParsed = new URL(proxyUrl);
      launchOptions.proxy = {
        server: `${proxyParsed.protocol}//${proxyParsed.host}`
      };

      if (proxyParsed.username && proxyParsed.password) {
        launchOptions.proxy.username = proxyParsed.username;
        launchOptions.proxy.password = proxyParsed.password;
      }

      logger.info(`Launching browser with proxy: ${proxyParsed.host}`);
    } else {
      logger.info('Launching browser without proxy');
    }

    try {
      const browser = await chromium.launch(launchOptions);
      return browser;
    } catch (error) {
      logger.error('Failed to launch browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Launch browser with automatic proxy rotation
   * @returns {Promise<{browser: import('playwright').Browser, proxy: string|null}>}
   */
  async launchWithRotation() {
    const proxy = this.getNextProxy();
    const browser = await this.launch(proxy);
    return { browser, proxy };
  }
}

module.exports = BrowserManager;
