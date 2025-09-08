# Sanity to Strapi CLI

Migrate your content from Sanity CMS to Strapi CMS with ease.

## Installation

```bash
npm install -g sanity-to-strapi-cli

# Quick Start

# Analyze your Sanity export
sanity-strapi analyze --sanity-export ./my-export

# Generate Strapi schemas
sanity-strapi schemas --sanity-project ./my-studio --sanity-export ./my-export

# Migrate content
STRAPI_API_TOKEN=your_token sanity-strapi content --sanity-export ./my-export

# Full migration
STRAPI_API_TOKEN=your_token sanity-strapi migrate
```

## Commands

- `analyze` - Analyze Sanity export data
- `schemas` - Generate Strapi schemas from Sanity project
- `content` - Migrate content and assets
- `migrate` - Full migration (schemas + content)

## Configuration

Environment variables or CLI options:

- `SANITY_PROJECT_PATH` - Path to Sanity studio project
- `SANITY_EXPORT_PATH` - Path to Sanity export data
- `STRAPI_PROJECT_PATH` - Path to Strapi project
- `STRAPI_URL` - Strapi server URL
- `STRAPI_API_TOKEN` - Strapi API token (required for content migration)

## License

MIT
