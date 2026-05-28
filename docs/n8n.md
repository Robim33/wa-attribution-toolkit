# n8n integration

WA Attribution Toolkit can forward events to n8n through `N8N_WEBHOOK_URL`.

## Events

### click_created

Triggered by `GET /track`.

Example payload:

```json
{
  "event": "click_created",
  "click_id": "uuid",
  "target_url": "https://wa.me/5511999999999",
  "tracking": {
    "utm_source": "facebook",
    "utm_campaign": "may_offer",
    "fbclid": "example"
  },
  "user_agent": "Mozilla/5.0",
  "referer": "https://example.com"
}
```

### lead_created

Triggered by `POST /leads`.

Example payload:

```json
{
  "event": "lead_created",
  "lead_id": "uuid",
  "click_id": "uuid",
  "name": "Jane Doe",
  "phone": "5511999999999",
  "email": "jane@example.com",
  "metadata": {
    "product": "consulting"
  },
  "created_at": "2026-05-27T10:00:00.000Z"
}
```

## Suggested workflow

1. Add an n8n Webhook trigger.
2. Store events in a database or spreadsheet.
3. Branch by `event` field.
4. Send `lead_created` events to CRM.
5. Send conversion events to Meta CAPI or Google Ads when applicable.
6. Build operational alerts for webhook errors.
