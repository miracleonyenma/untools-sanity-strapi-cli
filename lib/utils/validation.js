// lib/utils/validation.js
const fs = require("fs-extra");
const path = require("path");

async function validateConfig(config) {
  const required = ["sanityExportPath"];

  for (const field of required) {
    const value =
      config[field] ||
      config[
        field
          .replace("Path", "")
          .replace("sanity", "sanity")
          .replace("Export", "Export")
      ];
    if (!value) {
      throw new Error(`${field} is required`);
    }
  }

  // For schema generation, sanityProjectPath is required
  if ((process.argv.includes('schemas') || process.argv.includes('migrate')) && !process.argv.includes('analyze')) {
    const sanityProjectPath = config.sanityProjectPath || config.sanityProject;
    if (!sanityProjectPath) {
      throw new Error('Sanity project path is required for schema generation');
    }
  }

  return true;
}

async function validatePaths(config) {
  const pathsToCheck = [
    {
      path: config.sanityExportPath || config.sanityExport,
      name: "Sanity export",
      required: ["data.ndjson"],
    },
  ];
  
  // Add Sanity project path check if it exists in config
  if (config.sanityProjectPath || config.sanityProject) {
    pathsToCheck.push({
      path: config.sanityProjectPath || config.sanityProject,
      name: "Sanity project",
      required: [], // We don't check for specific files, just that the directory exists
    });
  }
  
  // Add Strapi project path check if it exists in config
  if (config.strapiProjectPath || config.strapiProject) {
    pathsToCheck.push({
      path: config.strapiProjectPath || config.strapiProject,
      name: "Strapi project",
      required: [], // We don't check for specific files, just that the directory exists
    });
  }

  for (const check of pathsToCheck) {
    if (!fs.existsSync(check.path)) {
      throw new Error(`${check.name} path not found: ${check.path}`);
    }

    if (check.required) {
      for (const file of check.required) {
        const filePath = path.join(check.path, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required file missing: ${filePath}`);
        }
      }
    }
  }

  return true;
}

module.exports = { validateConfig, validatePaths };
