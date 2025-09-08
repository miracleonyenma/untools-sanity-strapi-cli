// ./lib/commands/analyze.js
const { UniversalMigrationRunner } = require("../core/migration-runner");
const chalk = require("chalk");

module.exports = async function analyzeCommand(config, logger) {
  const spinner = logger.spinner("Analyzing Sanity export...");

  try {
    const runner = new UniversalMigrationRunner(config);
    await runner.analyzeMigration();

    spinner.succeed("Analysis complete");
    logger.success("Check the console output above for detailed analysis");
  } catch (error) {
    spinner.fail("Analysis failed");
    throw error;
  }
};
