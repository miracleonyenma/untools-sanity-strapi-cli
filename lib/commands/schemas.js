// lib/commands/schemas.js
const DynamicSchemaGenerator = require("../core/schema-generator");
const chalk = require("chalk");

module.exports = async function schemasCommand(config, logger) {
  const spinner = logger.spinner("Generating Strapi schemas...");

  try {
    const generator = new DynamicSchemaGenerator();
    await generator.generateFromSanityProject(
      config.sanityProjectPath || config.sanityProject,
      config.sanityExportPath || config.sanityExport,
      config
    );

    spinner.succeed("Schema generation complete");
    logger.success("Generated files:");
    logger.info("  - Strapi schemas in your project");
    logger.info("  - schema-generation-report.json");
  } catch (error) {
    spinner.fail("Schema generation failed");
    throw error;
  }
};
