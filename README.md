# 🚀 KIRI-AI

![Node.js](https://img.shields.io/badge/node-%3E%3D16-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Status](https://img.shields.io/badge/status-active-success)

**Automated Kiri IDE account provisioning via Google SSO with token aggregation to 9Router**

Scale your Kiri IDE access by automating account registration and token extraction from Google Workspace (GSuite) accounts. Aggregate refresh tokens into your 9Router instance for unified API access.

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [How It Works](#-how-it-works)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Disclaimer](#%EF%B8%8F-disclaimer)
- [License](#-license)

---

## ✨ Features

- ✅ **GSuite SSO Automation** - Automated Google Workspace authentication
- ✅ **Token Extraction** - Extract Kiri IDE refresh tokens from AWS Cognito
- ✅ **9Router Integration** - Direct import to your 9Router instance
- ✅ **Deduplication** - Automatic skip of already-imported accounts
- ✅ **Proxy Support** - Round-robin or single rotating proxy
- ✅ **Progress Tracking** - Real-time console output with progress bars
- ✅ **Error Recovery** - Per-account error handling, continue on failure
- ✅ **Stealth Mode** - Playwright with anti-detection plugins
- 🚧 **Gmail Support** - Coming soon (contributions welcome!)

---

## 📦 Prerequisites

- **Node.js** >= 16.0.0
- **9Router** instance (self-hosted or cloud)
- **Google Workspace accounts** (GSuite) with shared password
- Optional: **Proxy servers** (residential rotating or datacenter)

---

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/KIRI-AI.git
cd KIRI-AI

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

---

## ⚙️ Configuration

### 1. Create Configuration Files

```bash
# Copy example files
cp config/gsuite.example.txt config/gsuite.txt
cp config/password-gsuite.example.txt config/password-gsuite.txt
cp config/9router.example.json config/9router.json

# Optional: proxy support
cp config/proxy.example.txt config/proxy.txt
```

### 2. Edit Configuration

#### **config/gsuite.txt**
```
user1@yourdomain.com
user2@yourdomain.com
user3@yourdomain.com
```
*One email per line, no passwords here*

#### **config/password-gsuite.txt**
```
YourSharedPassword123
```
*Single line, shared password for all GSuite accounts*

#### **config/9router.json**
```json
{
  "endpoint": "http://localhost:20128",
  "username": "your_username",
  "password": "your_password"
}
```
*Your 9Router instance credentials (NOT ours - use your own instance)*

#### **config/proxy.txt** (Optional)
```
http://user:pass@proxy1.example.com:8080
socks5://user:pass@proxy2.example.com:1080
http://proxy3.example.com:3128
```
*Multiple proxies = round-robin rotation. Single proxy = reuse (supports rotating residential proxies). Leave empty = no proxy.*

### 3. Gmail Configuration (Coming Soon)

#### **config/gmail.txt**
```
user1@gmail.com|Password123|JBSWY3DPEHPK3PXP
user2@gmail.com|AnotherPass|
user3@gmail.com|SecurePass|MFRGGZDFMZTWQ2LK
```
*Format: `email|password|2fa_secret` (leave 2FA empty if not enabled)*

**Note:** Gmail provider is not yet implemented. GSuite only for now. Contributions welcome!

---

## 🚀 Usage

### Basic Usage

```bash
# Run with default settings (headless mode)
npm start

# Run with visible browser (for debugging)
HEADLESS=false npm start

# Or use the dev script
npm run dev
```

### Environment Variables

```bash
# Browser visibility
HEADLESS=false

# Delay between accounts (milliseconds)
DELAY_BETWEEN_ACCOUNTS=5000
```

### Validate Configuration

```bash
# Run smoke test before starting
npm test
```

---

## 🔍 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Load Configuration                                       │
│     - Read GSuite emails from config/gsuite.txt             │
│     - Load shared password from config/password-gsuite.txt  │
│     - Load 9Router credentials from config/9router.json     │
│     - Load proxies from config/proxy.txt (optional)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Authenticate with 9Router                                │
│     - POST /api/auth/login                                   │
│     - Get auth token for API calls                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Fetch Existing Tokens                                    │
│     - GET /api/oauth/kiro                                    │
│     - Cache list to avoid duplicate imports                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Per-Account Processing (Sequential)                      │
│     ┌──────────────────────────────────────────────────┐    │
│     │  a. Check if email exists in 9Router             │    │
│     │     → If exists: SKIP                             │    │
│     │     → If not: Continue                            │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  b. Launch Browser (with proxy rotation)         │    │
│     │     - Chromium + Stealth plugin                   │    │
│     │     - Anti-automation flags                       │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  c. Google SSO Flow                               │    │
│     │     - Navigate to app.kiro.dev/signin            │    │
│     │     - Click "Sign in with Google"                │    │
│     │     - Auto-fill email + password                 │    │
│     │     - Handle Workspace ToS (if appears)          │    │
│     │     - Wait for OAuth consent                     │    │
│     │     - Redirect back to Kiri                      │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  d. Extract Refresh Token                        │    │
│     │     - Scan localStorage for Cognito keys         │    │
│     │     - Find "refreshToken" key                    │    │
│     │     - Retry up to 5 times (2s delay)             │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  e. Import to 9Router                             │    │
│     │     - POST /api/oauth/kiro/import                │    │
│     │     - {email, refreshToken}                      │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  f. Close Browser & Wait                          │    │
│     │     - Clean shutdown                              │    │
│     │     - Delay before next account (5s default)     │    │
│     └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Final Summary                                            │
│     - Total processed / success / failed / skipped          │
│     - Monthly credits calculation (accounts × 50)           │
└─────────────────────────────────────────────────────────────┘
```

### Token Lifespan

- **Refresh Token Validity**: ~30 days (AWS Cognito default)
- **Recommended Refresh Cycle**: Every 20 days
- **GSuite Limitation**: Expired tokens cannot be renewed automatically (requires re-login)

---

## 🐛 Troubleshooting

### Common Issues

#### 1. `9Router authentication failed`
- Check `config/9router.json` credentials
- Verify 9Router instance is running
- Test manually: `curl http://localhost:20128/api/auth/login -d '{"username":"...","password":"..."}'`

#### 2. `Google SSO login failed`
- Password may be incorrect
- Google may have blocked automation (try different proxy)
- Workspace admin may have disabled external OAuth apps
- Try running with `HEADLESS=false` to see what's happening

#### 3. `Failed to extract refresh token`
- Token may not be set in localStorage yet (increase retry delay)
- Kiri may have changed their authentication flow (open an issue)
- Network timeout (check proxy settings)

#### 4. `Proxy connection failed`
- Verify proxy format: `protocol://[user:pass@]host:port`
- Test proxy manually: `curl -x http://proxy:port https://api.ipify.org`
- Try without proxy first to isolate the issue

#### 5. Browser hangs or freezes
- Increase timeout in `src/auth/google-sso.js`
- Disable headless mode: `HEADLESS=false npm start`
- Check system resources (RAM, CPU)

### Debug Mode

```bash
# Run with visible browser + detailed logs
HEADLESS=false npm start

# Check configuration validity
npm test

# Manual test with single account
# Edit config/gsuite.txt to contain only 1 account, then run
npm start
```

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Priority Areas
- **Gmail Provider** - Handle personal Google accounts with 2FA
- **Enhanced Error Recovery** - Resume from failures, retry strategies
- **Testing** - Unit tests, integration tests, CI/CD
- **Documentation** - Video tutorials, architecture diagrams

---

## ⚠️ Disclaimer

This tool is provided for **educational and research purposes only**.

- **Terms of Service**: Automated account creation may violate Google's and Kiri AI's Terms of Service. Use at your own risk.
- **Account Security**: The authors are not responsible for suspended accounts, security breaches, or data loss.
- **Ethical Use**: Ensure you have proper authorization before automating account operations. Verify compliance with applicable laws and regulations in your jurisdiction.
- **No Warranty**: This software is provided "as is" without warranty of any kind, express or implied.
- **9Router Requirement**: This tool requires your own 9Router instance. We do not provide 9Router hosting or credentials.

**By using this tool, you acknowledge that you understand and accept these risks.**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **9Router**: [Configure your own instance](https://9router.example.com/docs)
- **Kiri IDE**: [https://kiro.dev](https://kiro.dev)
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/KIRI-AI/issues)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📊 Project Stats

- **Credits per account**: 50/month
- **Average processing time**: 30-60 seconds per account
- **Success rate**: ~95% (with proper configuration)
- **Supported authentication**: GSuite only (Gmail coming soon)

---

Made with ⚡ by the community

**Star ⭐ this repo if you find it useful!**
