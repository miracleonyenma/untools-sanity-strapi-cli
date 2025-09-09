// ./lib/cli.js
const { program } = require("commander");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");

const { validateConfig, validatePaths } = require("./utils/validation");
const { createLogger } = require("./utils/logger");
const analyzeCommand = require("./commands/analyze");
const schemasCommand = require("./commands/schemas");
const contentCommand = require("./commands/content");
const migrateCommand = require("./commands/migrate");

class SanitystrapiCLI {
  constructor() {
    this.logger = createLogger();
  }

  async setupInteractiveConfig() {
    console.log(chalk.blue("\n🚀 Sanity to Strapi Migration Setup\n"));

    const questions = [
      {
        type: "input",
        name: "sanityProjectPath",
        message: "Path to Sanity studio project:",
        default: "./sanity-studio",
        validate: (input) => fs.existsSync(input) || "Path does not exist",
      },
      {
        type: "input",
        name: "sanityExportPath",
        message: "Path to Sanity export data:",
        default: "./sanity-export",
        validate: (input) => fs.existsSync(input) || "Path does not exist",
      },
      {
        type: "input",
        name: "strapiProjectPath",
        message: "Path to Strapi project:",
        default: "../strapi-project",
        validate: (input) => fs.existsSync(input) || "Path does not exist",
      },
      {
        type: "input",
        name: "strapiUrl",
        message: "Strapi server URL:",
        default: "http://localhost:1337",
      },
      {
        type: "list",
        name: "assetProvider",
        message: "Asset provider:",
        choices: ["strapi", "cloudinary"],
        default: "strapi",
      },
      {
        type: "input",
        name: "apiToken",
        message: "Strapi API token (required for content migration):",
        default: process.env.STRAPI_API_TOKEN || "",
      },
    ];

    return await inquirer.prompt(questions);
  }

  setupCommands() {
    program
      .name("sanity-strapi")
      .description(chalk.blue("CLI tool for migrating from Sanity to Strapi"))
      .version("1.0.2")
      .option("--config <path>", "Path to configuration file")
      .option("--interactive", "Run in interactive mode")
      .option("--sanity-project <path>", "Path to Sanity studio project")
      .option("--sanity-export <path>", "Path to Sanity export data")
      .option("--strapi-project <path>", "Path to Strapi project")
      .option("--strapi-url <url>", "Strapi server URL")
      .option(
        "--asset-provider <provider>",
        "Asset provider (strapi|cloudinary)"
      )
      .option("--api-token <token>", "Strapi API token")
      .option("--verbose", "Enable verbose logging");

    // Analyze command
    program
      .command("analyze")
      .description("Analyze Sanity export data")
      .action(async () => {
        try {
          const config = await this.getConfig();
          await analyzeCommand(config, this.logger);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Schemas command
    program
      .command("schemas")
      .description("Generate Strapi schemas from Sanity project")
      .action(async () => {
        try {
          const config = await this.getConfig();
          await schemasCommand(config, this.logger);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Content command
    program
      .command("content")
      .description("Migrate content and assets")
      .action(async () => {
        try {
          const config = await this.getConfig();
          await contentCommand(config, this.logger);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Migrate command (default)
    program
      .command("migrate", { isDefault: true })
      .description("Full migration: schemas + content")
      .action(async () => {
        try {
          const config = await this.getConfig();
          await migrateCommand(config, this.logger);
        } catch (error) {
          this.handleError(error);
        }
      });

    return program;
  }

  async getConfig() {
    const options = program.opts();

    // Load config file if specified
    let fileConfig = {};
    if (options.config) {
      const configPath = path.resolve(options.config);
      if (fs.existsSync(configPath)) {
        fileConfig = require(configPath);
      }
    }

    // Interactive mode
    let interactiveConfig = {};
    if (options.interactive) {
      interactiveConfig = await this.setupInteractiveConfig();
    }

    // Merge configs: CLI options > interactive > file > defaults
    const config = {
      // Defaults
      sanityProjectPath: "./sanity-studio",
      sanityExportPath: "./sanity-export",
      strapiProjectPath: "../strapi-project",
      strapiUrl: "http://localhost:1337",
      assetProvider: "strapi",

      // Environment variables
      sanityProjectPath: process.env.SANITY_PROJECT_PATH,
      strapiProjectPath: process.env.STRAPI_PROJECT_PATH,
      apiToken: process.env.STRAPI_API_TOKEN,

      // File config
      ...fileConfig,

      // Interactive config
      ...interactiveConfig,

      // CLI options
      sanityProjectPath: options.sanityProject,
      sanityExportPath: options.sanityExport,
      strapiProjectPath: options.strapiProject,
      strapiUrl: options.strapiUrl,
      assetProvider: options.assetProvider,
      apiToken: options.apiToken,
      verbose: options.verbose,
    };

    // Clean up undefined values
    Object.keys(config).forEach((key) => {
      if (config[key] === undefined) {
        delete config[key];
      }
    });

    await validateConfig(config);
    return config;
  }

  handleError(error) {
    if (program.opts().verbose) {
      console.error(chalk.red("\n❌ Error:"), error.stack);
    } else {
      console.error(chalk.red("\n❌ Error:"), error.message);
    }

    if (error.message.includes("STRAPI_API_TOKEN")) {
      console.log(chalk.yellow("\n💡 Tip: Set your API token with:"));
      console.log(chalk.gray("  export STRAPI_API_TOKEN=your_token_here"));
      console.log(chalk.gray("  or use --api-token your_token_here"));
    }

    process.exit(1);
  }
}

// Initialize and run CLI
const cli = new SanitystrapiCLI();
const cliProgram = cli.setupCommands();

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  cliProgram.outputHelp();
} else {
  cliProgram.parse();
}

module.exports = cli;
