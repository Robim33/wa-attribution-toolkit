# Architecture

WA Attribution Toolkit is designed as a small self-hosted attribution layer for WhatsApp-first funnels.

## Components

```text
Traffic source
  -> tracked URL
  -> Cloudflare Worker /track
  -> Cloudflare D1 click record
  -> WhatsApp or landing page
  -> lead event posted to /leads
  -> Cloudflare D1 lead record
  -> n8n webhook
  -> CRM, spreadsheet, dashboard or ad platform integration
```

## Runtime

- Cloudflare Worker handles requests.
- Cloudflare D1 stores clicks, leads, tracked links and webhook logs.
- n8n receives normalized events.
- Shlink can optionally create public short URLs.

## Event model

### click_created

Created when a user visits `/track`.

Key fields:

- `click_id`
- `target_url`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbclid`
- `gclid`
- `ttclid`
- `msclkid`
- `user_agent`
- `referer`

### lead_created

Created when a system posts to `/leads`.

Key fields:

- `lead_id`
- `click_id`
- `name`
- `phone`
- `email`
- `metadata`

## Data ownership

The project is built for teams that want to own their attribution data instead of locking campaign and lead context inside closed platforms.
