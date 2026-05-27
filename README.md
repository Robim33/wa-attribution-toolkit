# WA Attribution Toolkit

Open-source toolkit for tracking WhatsApp leads from paid campaigns, short links, UTMs, click IDs, Shlink and n8n automation.

This project gives developers and small teams a self-hosted attribution layer for WhatsApp-first funnels. It captures campaign parameters, creates a durable `click_id`, stores events in Cloudflare D1, redirects users to the destination URL, receives lead events, and forwards structured webhooks to n8n or any compatible automation endpoint.

## Why this exists

Many businesses run acquisition through WhatsApp, paid media and short links, but attribution is usually fragmented across ad platforms, spreadsheets, CRMs and closed tools. This toolkit provides a small, auditable and self-hosted alternative.

Core idea:

```text
Ad click -> tracked URL -> click_id -> WhatsApp/landing page -> lead event -> n8n/CRM/dashboard
```

## Features

- Capture `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- Capture ad click IDs such as `fbclid`, `gclid`, `ttclid` and `msclkid`
- Generate and persist a unique `click_id`
- Redirect to WhatsApp, landing pages or any target URL
- Receive lead events through a JSON API
- Forward normalized events to n8n via webhook
- Optional Shlink integration for short URL creation
- Store clicks, leads and webhook logs in Cloudflare D1
- Deploy as a Cloudflare Worker
- MIT licensed and designed for self-hosting

## API overview

### Health check

```bash
GET /health
```

### Track a click and redirect

```bash
GET /track?target=https://wa.me/5511999999999&utm_source=facebook&utm_campaign=may_offer
```

Returns a redirect to the target URL with `click_id` appended.

### Register a lead

```bash
POST /leads
Content-Type: application/json

{
  "click_id": "generated-click-id",
  "name": "Jane Doe",
  "phone": "5511999999999",
  "email": "jane@example.com",
  "metadata": {
    "product": "consulting"
  }
}
```

### Create a tracked link

```bash
POST /links
Content-Type: application/json

{
  "target_url": "https://wa.me/5511999999999",
  "title": "Facebook May Campaign",
  "campaign": "may_offer"
}
```

If Shlink credentials are configured, the worker tries to create a Shlink short URL. Otherwise it returns a local `/track` URL.

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Cloudflare D1 database

```bash
npx wrangler d1 create wa-attribution-toolkit-db
```

Copy the generated database ID into `wrangler.json`.

### 3. Apply migrations

```bash
npx wrangler d1 migrations apply DB --local
npx wrangler d1 migrations apply DB --remote
```

### 4. Configure environment variables

Copy `.env.example` and configure your values locally. For production secrets, use Wrangler secrets:

```bash
npx wrangler secret put N8N_WEBHOOK_URL
npx wrangler secret put SHLINK_API_KEY
```

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy

```bash
npm run deploy
```

## Environment variables

| Variable | Required | Description |
|---|---:|---|
| `N8N_WEBHOOK_URL` | No | Destination webhook for click/lead events |
| `SHLINK_API_URL` | No | Base URL of a Shlink API instance |
| `SHLINK_API_KEY` | No | API key used to create Shlink short URLs |
| `DEFAULT_WHATSAPP_PHONE` | No | Default WhatsApp number used when no target is provided |
| `DEFAULT_REDIRECT_URL` | No | Fallback redirect URL |

## Example funnel

```text
1. Create tracked link for a campaign.
2. Use the link in Facebook Ads, Google Ads or social posts.
3. User clicks the link.
4. Worker stores UTMs and generates click_id.
5. Worker redirects user to WhatsApp or a landing page.
6. Lead event is posted to /leads.
7. n8n receives the normalized event and sends it to CRM, Sheets, Meta CAPI or dashboards.
```

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Shlink integration](docs/shlink.md)
- [n8n integration](docs/n8n.md)
- [Anthropic application draft](docs/anthropic-application.md)

## Roadmap

- Built-in dashboard queries for Metabase
- Meta Conversions API example
- Google Ads enhanced conversions example
- More robust Shlink tag management
- Replay failed webhooks
- Signed lead events
- Multi-tenant workspace support

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Do not commit API keys, webhook URLs or customer data. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
