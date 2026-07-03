# Contributing to KIRI-AI

Thank you for your interest in contributing! This project welcomes contributions from the community.

## How to Contribute

### 1. Report Issues
- Use the [GitHub Issues](https://github.com/YOUR_USERNAME/KIRI-AI/issues) page
- Provide detailed information: OS, Node.js version, error messages, steps to reproduce
- Search existing issues before creating a new one

### 2. Submit Pull Requests

**Before starting work:**
1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "feat: add Gmail 2FA support"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

**PR Guidelines:**
- Keep PRs focused on a single feature or fix
- Include tests if applicable
- Update documentation (README.md) if needed
- Follow existing code style
- Ensure all files pass linting (`npm run lint` if configured)

### 3. Code Style
- Use 2 spaces for indentation
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions small and focused

### 4. Priority Contributions

We especially welcome contributions in these areas:

#### High Priority
- **Gmail Provider Implementation** (`src/providers/gmail.js`)
  - Handle phone verification challenges
  - Bypass suspicious login detection
  - Support device confirmation prompts
  - Implement robust 2FA flow

- **Enhanced Error Recovery**
  - Auto-retry on network failures
  - Session state persistence
  - Resume from last successful account

- **Better Logging**
  - File-based logs with rotation
  - Structured JSON logs for debugging
  - Log levels (debug, info, warn, error)

#### Medium Priority
- **Testing**
  - Unit tests for core modules
  - Integration tests with mock 9Router
  - CI/CD pipeline (GitHub Actions)

- **Documentation**
  - Video tutorial
  - Architecture diagram
  - FAQ section
  - Troubleshooting guide

- **Features**
  - Dry-run mode (validate without executing)
  - Progress export (JSON/CSV reports)
  - Webhook notifications on completion
  - Multi-9Router support

### 5. Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/KIRI-AI.git
cd KIRI-AI

# Install dependencies
npm install

# Create test config files
cp config/gsuite.example.txt config/gsuite.txt
cp config/password-gsuite.example.txt config/password-gsuite.txt
cp config/9router.example.json config/9router.json

# Edit config files with test data
nano config/9router.json

# Run smoke test
npm test

# Run in dev mode (non-headless)
npm run dev
```

### 6. Security

**Do NOT commit sensitive data:**
- Never commit actual credentials
- Never commit real account emails
- Always use `.gitignore` to protect config files
- Review `git status` before committing

**If you accidentally commit sensitive data:**
1. Do NOT just delete it in a new commit (it's still in history)
2. Use `git filter-branch` or `BFG Repo-Cleaner` to remove from history
3. Rotate all exposed credentials immediately
4. Contact maintainers if the repo is public

### 7. License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Questions? Open an issue or reach out to maintainers.

Happy hacking! 🚀
