// lib/commands/migrate.js
const { UniversalMigrationRunner } = require("../core/migration-runner");

module.exports = async function migrateCommand(config, logger) {
  logger.info("Starting full migration (schemas + content)...\n");

  try {
    const runner = new UniversalMigrationRunner({
      ...config,
      generateSchemas: true,
      migrateContent: true,
    });

    await runner.run();

    logger.success("\nFull migration completed successfully!");
    logger.info("Generated files:");
    logger.info("  - schema-generation-report.json");
    logger.info("  - universal-migration-report.json");
  } catch (error) {
    logger.error("Full migration failed");
    throw error;
  }
};
