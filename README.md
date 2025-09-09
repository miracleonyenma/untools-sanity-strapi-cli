# Sanity to Strapi CLI

Migrate your content from Sanity CMS to Strapi CMS with ease.

## Installation

```bash
npm install -g @untools/sanity-strapi-cli

# Quick Start

# Analyze your Sanity export
sanity-strapi analyze --sanity-export ./my-export

# Generate Strapi schemas
sanity-strapi schemas --sanity-project ./my-studio --sanity-export ./my-export

# Migrate content
STRAPI_API_TOKEN=your_token sanity-strapi content --sanity-export ./my-export --strapi-project ./my-strapi

# Full migration
STRAPI_API_TOKEN=your_token sanity-strapi migrate --sanity-project ./my-studio --sanity-export ./my-export --strapi-project ./my-strapi

# Interactive mode
sanity-strapi --interactive
```

## Commands

- `analyze` - Analyze Sanity export data
- `schemas` - Generate Strapi schemas from Sanity project
- `content` - Migrate content and assets
- `migrate` - Full migration (schemas + content)

## Configuration

### CLI Options

- `--sanity-project <path>` - Path to Sanity studio project
- `--sanity-export <path>` - Path to Sanity export data
- `--strapi-project <path>` - Path to Strapi project
- `--strapi-url <url>` - Strapi server URL
- `--api-token <token>` - Strapi API token (required for content migration)
- `--interactive` - Run in interactive mode
- `--config <path>` - Path to configuration file
- `--verbose` - Enable verbose logging

### Environment Variables

- `SANITY_PROJECT_PATH` - Path to Sanity studio project
- `STRAPI_PROJECT_PATH` - Path to Strapi project
- `STRAPI_API_TOKEN` - Strapi API token (required for content migration)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (if using Cloudinary)
- `CLOUDINARY_API_KEY` - Cloudinary API key (if using Cloudinary)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (if using Cloudinary)

## License

MIT
