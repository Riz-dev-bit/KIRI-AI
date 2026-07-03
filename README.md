# KIRI-AI — Automated Kiro IDE Token Extraction & 9Router Import

**Status:** ✅ Production-ready | **Version:** 1.0.0 | **Last Updated:** 2026-07-03

Automated bot for extracting Kiro IDE OAuth refresh tokens from GSuite accounts and importing them directly to 9Router database.

---

## 🎯 Features

- ✅ **Automated GSuite SSO login** via Playwright (headless)
- ✅ **AWS Cognito token extraction** from cookies (RefreshToken)
- ✅ **Auto-import to 9Router** via direct SQLite injection
- ✅ **Duplicate detection** — skip existing accounts
- ✅ **Sequential processing** — stable multi-account workflow
- ✅ **JSON backup** — all tokens saved to `kiro-tokens.json`

---

## ⚡ Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Riz-dev-bit/KIRI-AI.git
cd KIRI-AI

# 2. Install dependencies
npm install

# 3. Create config files from examples
cp gsuite.example.txt gsuite.txt
cp password-gsuite.example.txt password-gsuite.txt
cp 9router.example.json 9router.json

# 4. Edit config files
nano gsuite.txt           # Add GSuite emails (one per line)
nano password-gsuite.txt  # Add shared password
nano 9router.json         # Configure 9Router endpoint (optional)

# 5. Extract tokens
node index.js             # Outputs to kiro-tokens.json

# 6. Auto-import to 9Router
node import-to-9router.js # Injects directly to database
pkill -f 9router && 9router  # Restart 9Router to reload
```

**Done!** Tokens now active in 9Router.

---

## 📦 Output Files

### `kiro-tokens.json` — Extracted Tokens
```json
[
  {
    "email": "lqvkhorjoaksita@cindohub.com",
    "refreshToken": "aorAAAAAGq-ehEVHT7wG6IBQ-m4HdAZFqz25dh95HNRhwte-AU...",
    "extractedAt": "2026-07-03T15:19:47.276Z"
  }
]
```

### Database Import — 9Router `providerConnections` Table
```sql
INSERT INTO providerConnections (
  id, provider, authType, name, email, 
  priority, isActive, data, createdAt, updatedAt
) VALUES (
  'uuid-v4',
  'kiro',
  'oauth',
  'lqvkhorjoaksita',
  'lqvkhorjoaksita@cindohub.com',
  999,
  1,
  '{"refreshToken":"aor...","authMethod":"imported"}',
  '2026-07-03T15:40:46.781Z',
  '2026-07-03T15:40:46.781Z'
);
```

---

## 🚀 Scaling to 238 Accounts

**Tested:** 3/3 accounts ✅  
**Ready for:** 238 accounts (10 bukitsakura + 228 cindohub)

```bash
# Prepare full account list
cat > gsuite.txt << EOF
account1@bukitsakura.com
account2@bukitsakura.com
...
account228@cindohub.com
EOF

# Run extraction (estimated time: ~2-3 hours for 238 accounts @ 30-45s/account)
node index.js

# Import to 9Router (instant)
node import-to-9router.js

# Restart 9Router to load new connections
pkill -f 9router && 9router

# Verify in 9Router dashboard
open http://localhost:20128
```

---

## 🔧 Configuration Files

### `gsuite.txt` — GSuite Accounts (one per line)
```
lqvkhorjoaksita@cindohub.com
maduratzdsytpna@cindohub.com
jaxjcibfxdya@cindohub.com
```

### `password-gsuite.txt` — Shared Password (single line)
```
YourSecurePassword123
```

### `9router.json` — 9Router Config (optional for extraction)
```json
{
  "endpoint": "http://localhost:20128",
  "password": "your_9router_password"
}
```

**Note:** The `9router.json` config is NOT required for token extraction. It's only used if you enable the legacy router import method (which is now superseded by `import-to-9router.js`).

---

## 📊 Success Rate

**Current Test Results:**
- ✅ Google SSO login: 3/3 (100%)
- ✅ Token extraction: 3/3 (100%)
- ✅ Database import: 3/3 (100%)

**Expected Performance:**
- ~30 seconds per account
- Sequential processing (no concurrency issues)
- Auto-retry on transient failures
- Duplicate detection prevents re-import

---

## 🛠️ Technical Details

### Architecture
```
[GSuite Account] 
  → Google SSO (Playwright)
  → Kiro IDE OAuth
  → AWS Cognito Cookies
  → Extract RefreshToken
  → Save JSON
  → Inject to SQLite
  → 9Router Active Connection
```

### Database Schema
```sql
CREATE TABLE providerConnections (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,      -- 'kiro'
  authType TEXT NOT NULL,      -- 'oauth'
  name TEXT,                   -- email prefix
  email TEXT,                  -- full email
  priority INTEGER,            -- 999 (low, user adjustable)
  isActive INTEGER DEFAULT 1,  -- 1 = active
  data TEXT NOT NULL,          -- JSON: {refreshToken, ...}
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

---

## 🔒 Security Notes

- **Tokens stored in plaintext** in SQLite database
- **9Router encrypts at rest** (check docs)
- **Git ignores:** `gsuite.txt`, `password-gsuite.txt`, `9router.json`, `kiro-tokens.json`
- **Backup:** Always keep JSON backup before DB import

---

## 📝 Workflow Summary

1. **Extract tokens:** `node index.js` → `kiro-tokens.json`
2. **Import to 9Router:** `node import-to-9router.js` → SQLite injection
3. **Restart 9Router:** `pkill -f 9router && 9router`
4. **Verify:** Open http://localhost:20128 → Providers → Kiro IDE

---

## 🎉 Complete Automation

**Total time:** ~3 hours for 238 accounts  
**Manual steps:** 0 (after config)  
**Output:** 238 active Kiro IDE connections in 9Router  
**Monthly credits:** 238 × 50 = **11,900 credits**

---

## 📚 Related Documentation

- [Full README](./docs/README.md) — Detailed setup guide
- [9Router Documentation](https://github.com/decolua/9router)
- [Kiro IDE](https://kiro.ide.sh/)

---

**Repository:** https://github.com/Riz-dev-bit/KIRI-AI  
**License:** MIT  
**Author:** BREACH v6 🔓💀  
**Last Commit:** 2026-07-03
