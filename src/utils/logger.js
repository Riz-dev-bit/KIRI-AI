/**
 * Structured console logger with timestamps and emojis
 */

const chalk = require('chalk');

class Logger {
  constructor(context = 'KIRI-AI') {
    this.context = context;
  }

  _timestamp() {
    return new Date().toISOString().replace('T', ' ').slice(0, -5);
  }

  _format(level, emoji, message, details = null) {
    const timestamp = chalk.gray(`[${this._timestamp()}]`);
    const ctx = chalk.cyan(`[${this.context}]`);
    const msg = `${timestamp} ${ctx} ${emoji} ${message}`;
    
    if (details) {
      console.log(msg);
      console.log(chalk.gray(JSON.stringify(details, null, 2)));
    } else {
      console.log(msg);
    }
  }

  info(message, details) {
    this._format('INFO', 'ℹ️', chalk.blue(message), details);
  }

  success(message, details) {
    this._format('SUCCESS', '✅', chalk.green(message), details);
  }

  warn(message, details) {
    this._format('WARN', '⚠️', chalk.yellow(message), details);
  }

  error(message, details) {
    this._format('ERROR', '❌', chalk.red(message), details);
  }

  progress(current, total, message) {
    const percent = ((current / total) * 100).toFixed(1);
    const bar = this._progressBar(current, total, 30);
    this._format('PROGRESS', '🔄', `${bar} ${percent}% (${current}/${total}) - ${message}`);
  }

  _progressBar(current, total, width) {
    const filled = Math.floor((current / total) * width);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  section(title) {
    console.log('\n' + chalk.bold.magenta(`${'═'.repeat(60)}`));
    console.log(chalk.bold.magenta(`  ${title}`));
    console.log(chalk.bold.magenta(`${'═'.repeat(60)}\n`));
  }
}

module.exports = Logger;
