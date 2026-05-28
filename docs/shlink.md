# Shlink integration

WA Attribution Toolkit can optionally create short URLs using a Shlink instance.

## Required environment variables

```bash
SHLINK_API_URL=https://shlink.example.com
SHLINK_API_KEY=replace-with-your-key
```

Use Wrangler secrets in production:

```bash
npx wrangler secret put SHLINK_API_URL
npx wrangler secret put SHLINK_API_KEY
```

## Creating a tracked short link

```bash
POST /links
Content-Type: application/json

{
  "target_url": "https://wa.me/5511999999999",
  "title": "Facebook campaign",
  "campaign": "may_offer",
  "tags": ["facebook", "whatsapp", "may_offer"]
}
```

The toolkit creates a local tracked URL first. If Shlink credentials are configured, it sends that tracked URL to Shlink and stores the Shlink response.

## Fallback behavior

If Shlink is not configured, `/links` still returns a usable local tracked URL.

## Notes

- Keep API keys out of Git.
- Use tags to organize links by campaign, channel or client.
- Avoid storing customer personal data in Shlink tags or titles.
