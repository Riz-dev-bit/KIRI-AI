const { randomUUID } = require('crypto');
const path = require('path');
const Logger = require(path.join(__dirname, 'logger'));
const logger = new Logger('DatabaseImporter');

class DatabaseImporter {
  constructor(dbPath = null) {
    this.dbPath = dbPath || require('path').join(require('os').homedir(), '.9router/db/data.sqlite');
  }

  /**
   * Import tokens directly to 9Router database
   * @param {Array} tokens - Array of {email, refreshToken, extractedAt}
   * @returns {Promise<{success: number, failed: number, skipped: number}>}
   */
  async importTokens(tokens) {
    let Database;
    try {
      Database = require('better-sqlite3');
    } catch (err) {
      throw new Error('better-sqlite3 not installed. Run: npm install better-sqlite3');
    }

    const db = new Database(this.dbPath);
    const stats = { success: 0, failed: 0, skipped: 0 };

    try {
      // Get existing Kiro connections
      const existing = db.prepare(`
        SELECT email, data FROM providerConnections WHERE provider = 'kiro'
      `).all();

      const existingEmails = new Set(
        existing
          .map(row => {
            try {
              const data = JSON.parse(row.data);
              return data.email || row.email;
            } catch {
              return row.email;
            }
          })
          .filter(Boolean)
          .map(e => e.toLowerCase())
      );

      logger.info(`Found ${existingEmails.size} existing Kiro accounts in database`);

      // Insert new tokens
      const insertStmt = db.prepare(`
        INSERT INTO providerConnections 
        (id, provider, authType, name, email, priority, isActive, data, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const token of tokens) {
        const email = token.email.toLowerCase();

        // Skip if already exists
        if (existingEmails.has(email)) {
          logger.warn(`Skipped (already exists): ${token.email}`);
          stats.skipped++;
          continue;
        }

        try {
          const now = new Date().toISOString();
          const id = randomUUID();

          // Build data object matching 9Router structure
          const data = {
            accessToken: '', // Will be refreshed automatically by 9Router
            refreshToken: token.refreshToken,
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            testStatus: 'pending',
            providerSpecificData: {
              authMethod: 'imported',
              provider: 'KIRI-AI Bot',
              email: token.email
            },
            lastRefreshAt: now,
            expiresIn: 3600,
            consecutiveUseCount: 0,
            backoffLevel: 0
          };

          insertStmt.run(
            id,
            'kiro',
            'oauth',
            token.email.split('@')[0], // Name = email prefix
            token.email,
            999, // Low priority (user can adjust in UI)
            1, // isActive
            JSON.stringify(data),
            now,
            now
          );

          logger.success(`Imported: ${token.email}`);
          stats.success++;
        } catch (error) {
          logger.error(`Failed to import ${token.email}`, { error: error.message });
          stats.failed++;
        }
      }
    } finally {
      db.close();
    }

    return stats;
  }

  /**
   * Import from JSON file
   * @param {string} filePath - Path to kiro-tokens.json
   * @returns {Promise<{success: number, failed: number, skipped: number}>}
   */
  async importFromFile(filePath) {
    const fs = require('fs').promises;
    const data = await fs.readFile(filePath, 'utf8');
    const tokens = JSON.parse(data);

    logger.info(`Importing ${tokens.length} tokens from ${filePath}`);
    return this.importTokens(tokens);
  }
}

module.exports = DatabaseImporter;
