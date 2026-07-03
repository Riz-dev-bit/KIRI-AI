/**
 * Configuration file loader with validation
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

const logger = new Logger('ConfigLoader');

class ConfigLoader {
  constructor(configDir = 'config') {
    this.configDir = configDir;
  }

  /**
   * Load GSuite accounts from gsuite.txt
   * @returns {string[]} Array of email addresses
   */
  loadGSuiteEmails() {
    const filePath = path.join(this.configDir, 'gsuite.txt');
    
    if (!fs.existsSync(filePath)) {
      logger.warn(`GSuite file not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const emails = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    logger.info(`Loaded ${emails.length} GSuite emails from ${filePath}`);
    return emails;
  }

  /**
   * Load shared GSuite password from password-gsuite.txt
   * @returns {string|null} Password or null if not found
   */
  loadGSuitePassword() {
    const filePath = path.join(this.configDir, 'password-gsuite.txt');
    
    if (!fs.existsSync(filePath)) {
      logger.warn(`GSuite password file not found: ${filePath}`);
      return null;
    }

    const password = fs.readFileSync(filePath, 'utf-8').trim();
    
    if (!password) {
      logger.error('GSuite password file is empty');
      return null;
    }

    logger.success('GSuite password loaded');
    return password;
  }

  /**
   * Load Gmail accounts from gmail.txt
   * Format: email|password|2fa_secret
   * @returns {Array<{email: string, password: string, twoFactorSecret: string|null}>}
   */
  loadGmailAccounts() {
    const filePath = path.join(this.configDir, 'gmail.txt');
    
    if (!fs.existsSync(filePath)) {
      logger.warn(`Gmail file not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const accounts = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const [email, password, twoFactorSecret] = line.split('|');
        return {
          email: email?.trim(),
          password: password?.trim(),
          twoFactorSecret: twoFactorSecret?.trim() || null
        };
      })
      .filter(acc => acc.email && acc.password);

    logger.info(`Loaded ${accounts.length} Gmail accounts from ${filePath}`);
    return accounts;
  }

  /**
   * Load proxy list from proxy.txt
   * Format: protocol://[user:pass@]host:port
   * @returns {string[]} Array of proxy URLs
   */
  loadProxies() {
    const filePath = path.join(this.configDir, 'proxy.txt');
    
    if (!fs.existsSync(filePath)) {
      logger.info('No proxy file found - running without proxy');
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const proxies = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    if (proxies.length === 0) {
      logger.info('Proxy file is empty - running without proxy');
    } else if (proxies.length === 1) {
      logger.info(`Using single proxy (rotating): ${proxies[0]}`);
    } else {
      logger.info(`Loaded ${proxies.length} proxies for round-robin rotation`);
    }

    return proxies;
  }

  /**
   * Load 9router.json config
   * @returns {{endpoint: string, password: string}|null}
   */
  load9RouterConfig() {
    const filePath = path.join(this.configDir, '9router.json');
    
    if (!fs.existsSync(filePath)) {
      logger.error(`9Router config not found: ${filePath}`);
      logger.error('Please create 9router.json with your 9Router instance credentials');
      return null;
    }

    try {
      const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      if (!config.endpoint || !config.password) {
        logger.error('Router config is incomplete - missing endpoint or password');
        return null;
      }

      logger.success(`Router configured: ${config.endpoint}`);
      return config;
    } catch (error) {
      logger.error('Failed to parse 9router.json', { error: error.message });
      return null;
    }
  }

  /**
   * Validate all required configuration files exist
   * @returns {boolean} True if all required configs are present
   */
  validate() {
    logger.section('Configuration Validation');

    const routerConfig = this.load9RouterConfig();
    if (!routerConfig) {
      logger.error('9Router configuration is required');
      return false;
    }

    const gsuiteEmails = this.loadGSuiteEmails();
    const gsuitePassword = this.loadGSuitePassword();
    const gmailAccounts = this.loadGmailAccounts();

    if (gsuiteEmails.length === 0 && gmailAccounts.length === 0) {
      logger.error('No accounts found - please add accounts to gsuite.txt or gmail.txt');
      return false;
    }

    if (gsuiteEmails.length > 0 && !gsuitePassword) {
      logger.error('GSuite emails found but password-gsuite.txt is missing');
      return false;
    }

    const totalAccounts = gsuiteEmails.length + gmailAccounts.length;
    logger.success(`Configuration valid - ${totalAccounts} accounts ready`);

    return true;
  }
}

module.exports = ConfigLoader;
