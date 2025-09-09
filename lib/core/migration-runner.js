// ./lib/core/migration-runner.js

const UniversalContentMigrator = require("./content-migrator");
const DynamicSchemaGenerator = require("./schema-generator");
const fs = require("fs-extra");
const path = require("path");

class UniversalMigrationRunner {
  constructor(config = {}) {
    this.config = {
      sanityProjectPath:
        config.sanityProjectPath ||
        config.sanityProject ||
        "../../studio-first-project",
      sanityExportPath:
        config.sanityExportPath || config.sanityExport || "../sanity-export",
      strapiProjectPath:
        config.strapiProjectPath || config.strapiProject || "../strapi-project",
      strapiUrl: config.strapiUrl || "http://localhost:1337",
      apiToken: config.apiToken || process.env.STRAPI_API_TOKEN,
      assetProvider: config.assetProvider || "strapi",
      generateSchemas: config.generateSchemas === true, // Default to false
      migrateContent: config.migrateContent !== false, // Default to true
      cloudinary: config.cloudinary || {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      },
      ...config,
    };
  }

  async run() {
    console.log("🚀 Starting Universal Sanity to Strapi Migration");
    console.log("=".repeat(60));

    try {
      await this.validatePaths();
      await this.validateConfig();

      console.log("✅ Configuration validated");
      console.log(`📂 Sanity project: ${this.config.sanityProjectPath}`);
      console.log(`📦 Sanity export: ${this.config.sanityExportPath}`);
      console.log(`🎯 Strapi project: ${this.config.strapiProjectPath}`);
      console.log(`🌐 Strapi URL: ${this.config.strapiUrl}`);
      console.log(`📁 Asset provider: ${this.config.assetProvider}`);
      console.log("");

      // Step 1: Generate Strapi schemas if enabled
      if (this.config.generateSchemas) {
        await this.generateSchemas();
      } else {
        console.log("⏭️ Skipping schema generation (disabled in config)");
      }

      // Step 2: Migrate content if enabled
      if (this.config.migrateContent) {
        await this.migrateContent();
      } else {
        console.log("⏭️ Skipping content migration (disabled in config)");
      }

      console.log("");
      console.log("🎉 Universal migration completed successfully!");
      console.log("");
      await this.printNextSteps();
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  async validatePaths() {
    // Determine which command is being run
    const isAnalyzeCommand = process.argv.includes("analyze");
    const isSchemasCommand = process.argv.includes("schemas");
    const isMigrateCommand = process.argv.includes("migrate");
    const isContentCommand = process.argv.includes("content");

    // Define required paths based on command
    const paths = [];

    // Sanity export path is required for all commands
    paths.push({ path: this.config.sanityExportPath, name: "Sanity export" });

    // Sanity project path is required for schemas and migrate commands
    if (isSchemasCommand || isMigrateCommand) {
      paths.push({
        path: this.config.sanityProjectPath,
        name: "Sanity project",
      });
    }

    // Strapi project path is required for content and migrate commands
    if (isContentCommand || isMigrateCommand) {
      paths.push({
        path: this.config.strapiProjectPath,
        name: "Strapi project",
      });
    }

    for (const { path: pathToCheck, name } of paths) {
      if (!fs.existsSync(pathToCheck)) {
        throw new Error(`${name} path not found: ${pathToCheck}`);
      }
    }

    // Check for required files in Sanity export
    const dataPath = path.join(this.config.sanityExportPath, "data.ndjson");
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Required file not found: ${dataPath}`);
    }
  }

  async validateConfig() {
    // API token is only required for content migration
    const isAnalyzeCommand = process.argv.includes("analyze");
    const isSchemasCommand = process.argv.includes("schemas");
    const isContentCommand = process.argv.includes("content");
    const isMigrateCommand = process.argv.includes("migrate");

    if ((isContentCommand || isMigrateCommand) && !this.config.apiToken) {
      throw new Error(
        "STRAPI_API_TOKEN is required for content migration. Set it as environment variable or pass in config."
      );
    }

    if (
      this.config.assetProvider === "cloudinary" &&
      !this.config.cloudinary.cloud_name
    ) {
      throw new Error(
        "Cloudinary configuration is required when assetProvider is 'cloudinary'"
      );
    }
  }

  async generateSchemas() {
    console.log("📋 Step 1: Generating Strapi schemas from Sanity project...");
    console.log("-".repeat(50));

    const generator = new DynamicSchemaGenerator();
    await generator.generateFromSanityProject(
      this.config.sanityProjectPath,
      this.config.sanityExportPath,
      this.config
    );

    console.log("✅ Schema generation completed");
    console.log("");
  }

  async migrateContent() {
    console.log("📦 Step 2: Migrating content from Sanity export...");
    console.log("-".repeat(50));

    const migratorConfig = {
      strapiUrl: this.config.strapiUrl,
      apiToken: this.config.apiToken,
      assetProvider: this.config.assetProvider,
      strapiProjectPath: this.config.strapiProjectPath,
      cloudinary: this.config.cloudinary,
      batchSize: 10,
      retryAttempts: 3,
      retryDelay: 1000,
    };

    const migrator = new UniversalContentMigrator(migratorConfig);
    await migrator.migrate(this.config.sanityExportPath);

    console.log("✅ Content migration completed");
    console.log("");
  }

  async printNextSteps() {
    console.log("📋 Next Steps:");
    console.log("1. Review generated files:");

    if (this.config.generateSchemas) {
      console.log(
        "   - Check schema-generation-report.json for schema analysis"
      );
      console.log("   - Review generated schemas in your Strapi project");
    }

    if (this.config.migrateContent) {
      console.log(
        "   - Check universal-migration-report.json for migration results"
      );
    }

    console.log("");
    console.log("2. Start your Strapi server:");
    console.log(`   cd ${this.config.strapiProjectPath} && npm run develop`);
    console.log("");
    console.log("3. Review migrated content in Strapi admin panel");
    console.log("");
    console.log("4. Adjust content types and components as needed");

    // Check for errors and provide specific guidance
    const errorFiles = [
      "schema-generation-report.json",
      "universal-migration-report.json",
    ];

    for (const errorFile of errorFiles) {
      if (fs.existsSync(errorFile)) {
        try {
          const report = await fs.readJSON(errorFile);
          const errors = report.migration?.errors || [];
          if (errors.length > 0) {
            console.log(`⚠️  Found ${errors.length} errors in ${errorFile}`);
            console.log(
              "   Review the report file for details on failed migrations"
            );
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
    }
  }

  // Convenience method to analyze what will be migrated without actually migrating
  async analyzeMigration() {
    console.log("🔍 Analyzing migration (dry run)...");
    console.log("=".repeat(50));

    try {
      await this.validatePaths();

      // Load and analyze Sanity data
      const { documents, assets } = await this.loadSanityData();

      console.log("📊 Migration Analysis:");
      console.log(`   Documents: ${documents.length}`);
      console.log(`   Assets: ${assets.length}`);

      // Group by type
      const documentsByType = this.groupDocumentsByType(documents);
      console.log("\n📋 Document Types:");
      for (const [type, docs] of Object.entries(documentsByType)) {
        console.log(`   ${type}: ${docs.length} documents`);
      }

      // Check for existing schemas
      const apiPath = path.join(this.config.strapiProjectPath, "src/api");
      if (fs.existsSync(apiPath)) {
        const existingSchemas = await fs.readdir(apiPath);
        console.log(`\n🏗️  Existing Strapi schemas: ${existingSchemas.length}`);
        for (const schema of existingSchemas) {
          console.log(`   ${schema}`);
        }
      }

      console.log("\n✅ Analysis complete");
    } catch (error) {
      console.error("❌ Analysis failed:", error.message);
      throw error;
    }
  }

  async loadSanityData() {
    const ndjsonPath = path.join(this.config.sanityExportPath, "data.ndjson");
    const assetsPath = path.join(this.config.sanityExportPath, "assets.json");

    // Load documents
    const documents = [];
    const fileStream = fs.createReadStream(ndjsonPath);
    const readline = require("readline");
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        const doc = JSON.parse(line);
        if (!doc._type.startsWith("sanity.")) {
          documents.push(doc);
        }
      } catch (error) {
        // Skip invalid lines
      }
    }

    // Load assets
    let assets = [];
    if (fs.existsSync(assetsPath)) {
      try {
        const assetsData = await fs.readJSON(assetsPath);
        assets = Object.entries(assetsData).map(([key, asset]) => ({
          ...asset,
          _key: key.replace("image-", "").replace("file-", ""),
        }));
      } catch (error) {
        console.warn("Could not load assets.json:", error.message);
      }
    }

    return { documents, assets };
  }

  groupDocumentsByType(documents) {
    const grouped = {};
    for (const doc of documents) {
      if (!grouped[doc._type]) {
        grouped[doc._type] = [];
      }
      grouped[doc._type].push(doc);
    }
    return grouped;
  }
}

// CLI function
async function runFromCLI() {
  const args = process.argv.slice(2);
  const command = args[0] || "migrate";

  const config = {
    sanityProjectPath:
      process.env.SANITY_PROJECT_PATH || "../../studio-first-project",
    sanityExportPath: process.env.SANITY_EXPORT_PATH || "../sanity-export",
    strapiProjectPath: process.env.STRAPI_PROJECT_PATH || "../strapi-project",
    strapiUrl: process.env.STRAPI_URL || "http://localhost:1337",
    apiToken:
      process.env.STRAPI_API_TOKEN ||
      "9bf38bf1e938c3e820fb04b9d81262b8b97f052e9959692c10455c805e410aeb697ae2096f94da052a802c45ba039bfea0aacb042b81ebacf3f5cd8cc1bb9c1c0efada0a23253b4e1883131793e5a000d0581adcf9ce2e3408e3ef686eb2731fd8d6471e7ca7c571bb9d33968192274de35828e9f3dabffd04aef04c93b24ed6",
    assetProvider: process.env.ASSET_PROVIDER || "strapi",
  };

  // Parse CLI arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        config[key] = value;
        i++; // Skip next argument as it's the value
      } else {
        // Boolean flag
        config[key] = true;
      }
    }
  }

  const runner = new UniversalMigrationRunner(config);

  switch (command) {
    case "analyze":
      await runner.analyzeMigration();
      break;
    case "schemas-only":
      config.migrateContent = false;
      await runner.run();
      break;
    case "content-only":
      config.generateSchemas = false;
      await runner.run();
      break;
    case "migrate":
    default:
      await runner.run();
      break;
  }
}

// Usage examples
function printUsage() {
  console.log("Universal Sanity to Strapi Migration Tool");
  console.log("");
  console.log("Usage:");
  console.log("  node run-universal-migration.js [command] [options]");
  console.log("");
  console.log("Commands:");
  console.log(
    "  migrate       Complete migration (schemas + content) [default]"
  );
  console.log("  schemas-only  Generate schemas only");
  console.log(
    "  content-only  Migrate content only (requires existing schemas)"
  );
  console.log("  analyze       Analyze migration without executing");
  console.log("");
  console.log("Options:");
  console.log("  --sanityProjectPath    Path to Sanity studio project");
  console.log("  --sanityExportPath     Path to Sanity export data");
  console.log("  --strapiProjectPath    Path to Strapi project");
  console.log("  --strapiUrl           Strapi server URL");
  console.log("  --assetProvider       Asset provider (strapi|cloudinary)");
  console.log("");
  console.log("Environment Variables:");
  console.log("  STRAPI_API_TOKEN      Required: Strapi API token");
  console.log("  SANITY_PROJECT_PATH   Optional: Override default paths");
  console.log("  SANITY_EXPORT_PATH    Optional: Override default paths");
  console.log("  STRAPI_PROJECT_PATH   Optional: Override default paths");
  console.log("  STRAPI_URL           Optional: Override default Strapi URL");
  console.log("  ASSET_PROVIDER       Optional: Asset provider choice");
  console.log("");
  console.log("Examples:");
  console.log("  # Complete migration");
  console.log("  node run-universal-migration.js migrate");
  console.log("");
  console.log("  # Generate schemas only");
  console.log("  node run-universal-migration.js schemas-only");
  console.log("");
  console.log("  # Migrate content with custom paths");
  console.log("  node run-universal-migration.js content-only \\");
  console.log("    --sanityExportPath ./my-export \\");
  console.log("    --strapiUrl http://localhost:1337");
  console.log("");
  console.log("  # Analyze what will be migrated");
  console.log("  node run-universal-migration.js analyze");
}

// Export class and runner
module.exports = {
  UniversalMigrationRunner,
  runFromCLI,
  printUsage,
};

// Run CLI if called directly
if (require.main === module) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  runFromCLI().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}
