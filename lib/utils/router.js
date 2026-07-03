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
        options.headers['Cookie'] = `auth_token=${token}`;
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
      logger.info('Authenticating with router...');
      
      const response = await fetch(`${this.endpoint}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: this.password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Token is in Set-Cookie header, not response body
      const setCookie = response.headers.get('set-cookie');
      if (!setCookie) {
        throw new Error('No auth_token cookie in response');
      }

      // Extract auth_token from Set-Cookie header
      const tokenMatch = setCookie.match(/auth_token=([^;]+)/);
      if (!tokenMatch) {
        throw new Error('Could not parse auth_token from cookie');
      }

      this.authToken = tokenMatch[1];
      logger.success('Router authentication successful');
      return this.authToken;
    } catch (error) {
      logger.error('Router authentication failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get existing tokens from router
   * @returns {Promise<Array<{email: string, refreshToken: string}>>}
   */
  async getExistingTokens() {
    try {
      if (!this.authToken) {
        await this.authenticate();
      }

      const ROUTER_ENDPOINT = process.env.ROUTER_OAUTH_ENDPOINT || '/api/oauth/kiro';
      const response = await this._request('GET', ROUTER_ENDPOINT, null, this.authToken);
      
      // Response format may vary - handle both array and object with data property
      const tokens = Array.isArray(response) ? response : (response.data || []);
      
      logger.info(`Found ${tokens.length} existing tokens in router`);
      return tokens;
    } catch (error) {
      logger.warn('Failed to fetch existing tokens - assuming empty', { error: error.message });
      return [];
    }
  }

  /**
   * Check if email already exists in router
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
   * Import refresh token to router
   * @param {string} email - Account email
   * @param {string} refreshToken - OAuth refresh token
   * @returns {Promise<boolean>} True if successful
   */
  async importToken(email, refreshToken) {
    try {
      if (!this.authToken) {
        await this.authenticate();
      }

      const ROUTER_IMPORT_ENDPOINT = process.env.ROUTER_IMPORT_ENDPOINT || '/api/oauth/kiro/import';
      await this._request('POST', ROUTER_IMPORT_ENDPOINT, {
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
