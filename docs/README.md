# 🚀 KIRI-AI

![Node.js](https://img.shields.io/badge/node-%3E%3D16-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Status](https://img.shields.io/badge/status-active-success)

**Automated workflow tool for managing cloud IDE access tokens with OAuth integration**

Streamline OAuth token management for cloud development environments using Google Workspace accounts. Centralize access tokens through a routing layer for unified API operations.

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Disclaimer](#%EF%B8%8F-disclaimer)
- [License](#-license)

---

## ✨ Features

- ✅ **OAuth SSO Automation** - Automated Google Workspace authentication flows
- ✅ **Token Management** - Extract and manage OAuth refresh tokens from cloud platforms
- ✅ **Routing Integration** - Direct import to token routing services
- ✅ **Deduplication** - Automatic skip of previously processed accounts
- ✅ **Proxy Support** - Round-robin or single rotating proxy configurations
- ✅ **Progress Tracking** - Real-time console output with detailed logging
- ✅ **Error Recovery** - Per-account error handling with continuation logic
- ✅ **Stealth Mode** - Browser automation with anti-detection capabilities
- 🚧 **Gmail Support** - Personal account support (contributions welcome!)

---

## 📦 Prerequisites

- Node.js >= 16.0.0
- 9Router instance (self-hosted or cloud deployment)
- Google Workspace accounts with shared credentials
- Optional: Proxy infrastructure (residential or datacenter)

---

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/Riz-dev-bit/KIRI-AI.git
cd KIRI-AI

# Install dependencies
npm install

# Install browser automation dependencies
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

# Optional: proxy configuration
cp config/proxy.example.txt config/proxy.txt
```

### 2. Edit Configuration Files

#### **config/gsuite.txt**
```
user1@yourdomain.com
user2@yourdomain.com
user3@yourdomain.com
```
*One email per line*

#### **config/password-gsuite.txt**
```
YourSharedPassword123
```
*Single line, shared credential for all accounts*

#### **config/9router.json**
```json
{
  "endpoint": "http://localhost:20128",
  "username": "your_username",
  "password": "your_password"
}
```
*Your 9Router instance credentials*

#### **config/proxy.txt** (Optional)
```
http://user:pass@proxy1.example.com:8080
socks5://user:pass@proxy2.example.com:1080
http://proxy3.example.com:3128
```
*Multiple proxies for rotation, or single proxy for pass-through*

### 3. Gmail Configuration (Coming Soon)

#### **config/gmail.txt**
```
user1@gmail.com|Password123|JBSWY3DPEHPK3PXP
user2@gmail.com|AnotherPass|
```
*Format: `email|password|2fa_secret` (2FA optional)*

**Note:** Personal Gmail provider is under development. GSuite only for now.

---

## 🚀 Usage

### Basic Usage

```bash
# Run with default settings (headless mode)
npm start

# Run with visible browser (debugging)
HEADLESS=false npm start

# Development mode
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
# Run smoke test
npm test
```

---

## 🔍 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  1. Configuration Loading                                    │
│     - Read account lists from config files                   │
│     - Load routing service credentials                       │
│     - Initialize proxy pool (optional)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Router Authentication                                    │
│     - Authenticate with token routing service                │
│     - Fetch existing token list for deduplication            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Per-Account Processing Pipeline                          │
│     ┌──────────────────────────────────────────────────┐    │
│     │  a. Deduplication Check                           │    │
│     │     → Skip if token already exists                │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  b. Browser Launch                                │    │
│     │     - Chromium with stealth plugins               │    │
│     │     - Proxy rotation (if configured)              │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  c. OAuth Flow Automation                         │    │
│     │     - Navigate to SSO endpoint                    │    │
│     │     - Complete authentication flow                │    │
│     │     - Handle consent screens                      │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  d. Token Extraction                              │    │
│     │     - Scan browser storage for OAuth tokens       │    │
│     │     - Extract refresh token with retry logic      │    │
│     └──────────────────────────────────────────────────┘    │
│                         ↓                                    │
│     ┌──────────────────────────────────────────────────┐    │
│     │  e. Token Import                                  │    │
│     │     - Push to routing service API                 │    │
│     │     - Update local deduplication cache            │    │
│     └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Summary Report                                           │
│     - Success / failure / skipped counts                     │
│     - Performance metrics                                    │
└─────────────────────────────────────────────────────────────┘
```

### Token Lifecycle

- **Refresh Token Validity**: ~30 days (platform default)
- **Recommended Refresh Cycle**: Every 20 days
- **Note**: Expired tokens require re-authentication

---

## 🐛 Troubleshooting

### Common Issues

#### 1. `Router authentication failed`
- Verify `config/9router.json` credentials
- Ensure routing service is accessible
- Test connectivity: `curl http://localhost:20128/api/auth/login`

#### 2. `OAuth flow failed`
- Verify account credentials
- Check for IP/bot detection blocks (try different proxy)
- Review workspace admin settings for OAuth app restrictions
- Run with `HEADLESS=false` for visual debugging

#### 3. `Token extraction failed`
- Increase retry delay in source code
- Platform may have changed token storage mechanism
- Check network connectivity and timeouts

#### 4. `Proxy connection errors`
- Validate proxy format: `protocol://[user:pass@]host:port`
- Test proxy independently
- Try without proxy to isolate issue

### Debug Mode

```bash
# Visible browser + detailed logs
HEADLESS=false npm start

# Configuration validation
npm test

# Single account test
# (Edit config to contain only 1 account, then run)
npm start
```

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Priority Areas
- **Gmail Provider** - Personal account support with 2FA
- **Enhanced Error Recovery** - Resume capabilities, retry strategies
- **Testing** - Unit tests, integration tests, CI/CD pipeline
- **Documentation** - Video tutorials, architecture deep-dives

---

## ⚠️ Disclaimer

This tool is provided for **educational and research purposes only**.

- **Terms of Service**: Automated account operations may violate service provider Terms of Service. Use at your own risk.
- **Account Security**: The authors are not responsible for account suspensions, security breaches, or data loss.
- **Ethical Use**: Ensure you have proper authorization before automating authentication workflows. Verify compliance with applicable laws and regulations.
- **No Warranty**: This software is provided "as is" without warranty of any kind, express or implied.
- **Self-Hosted Requirements**: This tool requires your own token routing infrastructure. We do not provide hosting or credentials.

**By using this tool, you acknowledge that you understand and accept these risks.**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Issues**: [GitHub Issues](https://github.com/Riz-dev-bit/KIRI-AI/issues)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📊 Technical Specifications

- **Processing time**: 30-60 seconds per account (average)
- **Success rate**: ~95% with proper configuration
- **Supported authentication**: Google Workspace (GSuite)
- **Browser engine**: Chromium via Playwright
- **Anti-detection**: Stealth plugins + custom flags

---

Made with ⚡ by the community

**Star ⭐ this repo if you find it useful!**
