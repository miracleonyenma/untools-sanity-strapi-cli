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
