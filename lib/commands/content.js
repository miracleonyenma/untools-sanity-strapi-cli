// lib/commands/content.js
const UniversalContentMigrator = require("../core/content-migrator");
const chalk = require("chalk");

module.exports = async function contentCommand(config, logger) {
  const spinner = logger.spinner("Migrating content and assets...");

  try {
    const migrator = new UniversalContentMigrator({
      strapiUrl: config.strapiUrl,
      apiToken: config.apiToken,
      assetProvider: config.assetProvider,
      strapiProjectPath: config.strapiProjectPath || config.strapiProject,
      cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      },
    });

    await migrator.migrate(config.sanityExportPath || config.sanityExport);

    spinner.succeed("Content migration complete");
    logger.success("Generated files:");
    logger.info("  - universal-migration-report.json");
  } catch (error) {
    spinner.fail("Content migration failed");
    throw error;
  }
};
