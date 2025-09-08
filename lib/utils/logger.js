// lib/utils/logger.js
const chalk = require("chalk");
const ora = require("ora");

function createLogger() {
  return {
    info: (message) => console.log(chalk.blue("ℹ"), message),
    success: (message) => console.log(chalk.green("✓"), message),
    warning: (message) => console.log(chalk.yellow("⚠"), message),
    error: (message) => console.log(chalk.red("✗"), message),
    spinner: (text) => ora(text).start(),
  };
}

module.exports = { createLogger };
