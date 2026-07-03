/**
 * 9Router API client for token management
 */

const https = require('https');
const http = require('http');
const Logger = require('./logger');

const logger = new Logger('9Router');

class RouterClient {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.username = config.username;
    this.password = config.password;
    this.authToken = null;
  }

  /**
   * Make HTTP request
   * @private
   */
  async _request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.endpoint);
      const client = url.protocol === 'https:' ? https : http;

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = client.request(url, options, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Authenticate with 9Router
   * @returns {Promise<string>} Auth token
   */
  async authenticate() {
    try {
      logger.info('Authenticating with 9Router...');
      
      const response = await this._request('POST', '/api/auth/login', {
        username: this.username,
        password: this.password
      });

      this.authToken = response.token || response.access_token;
      
      if (!this.authToken) {
        throw new Error('No token in authentication response');
      }

      logger.success('9Router authentication successful');
      return this.authToken;
    } catch (error) {
      logger.error('9Router authentication failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get existing Kiri tokens from 9Router
   * @returns {Promise<Array<{email: string, refreshToken: string}>>}
   */
  async getExistingTokens() {
    try {
      if (!this.authToken) {
        await this.authenticate();
      }

      const response = await this._request('GET', '/api/oauth/kiro', null, this.authToken);
      
      // Response format may vary - handle both array and object with data property
      const tokens = Array.isArray(response) ? response : (response.data || []);
      
      logger.info(`Found ${tokens.length} existing tokens in 9Router`);
      return tokens;
    } catch (error) {
      logger.warn('Failed to fetch existing tokens - assuming empty', { error: error.message });
      return [];
    }
  }

  /**
   * Check if email already exists in 9Router
   * @param {string} email - Email to check
   * @param {Array} existingTokens - Cached list of existing tokens
   * @returns {boolean}
   */
  emailExists(email, existingTokens) {
    return existingTokens.some(token => 
      token.email?.toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Import refresh token to 9Router
   * @param {string} email - Account email
   * @param {string} refreshToken - Kiri refresh token
   * @returns {Promise<boolean>} True if successful
   */
  async importToken(email, refreshToken) {
    try {
      if (!this.authToken) {
        await this.authenticate();
      }

      await this._request('POST', '/api/oauth/kiro/import', {
        email,
        refreshToken
      }, this.authToken);

      logger.success(`Token imported: ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to import token for ${email}`, { error: error.message });
      return false;
    }
  }
}

module.exports = RouterClient;
