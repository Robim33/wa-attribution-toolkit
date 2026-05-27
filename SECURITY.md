# Security Policy

## Reporting vulnerabilities

Please do not open public issues for security vulnerabilities.

Report security concerns privately by contacting the maintainer through the GitHub profile associated with this repository.

## Sensitive data

This project may process campaign, click and lead data. Do not commit:

- API keys
- n8n webhook URLs
- Shlink API keys
- Customer phone numbers
- Customer emails
- Production database exports
- Real ad click identifiers from customers

## Deployment recommendations

- Store secrets with `wrangler secret put`.
- Use separate D1 databases for development and production.
- Review n8n workflows before exposing them publicly.
- Restrict dashboard access when using Metabase or similar tools.
- Rotate API keys after testing public examples.

## Scope

The current security scope includes:

- Cloudflare Worker API endpoints
- D1 schema and queries
- Webhook forwarding behavior
- Shlink API integration
