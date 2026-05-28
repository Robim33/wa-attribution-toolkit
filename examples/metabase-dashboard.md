# Metabase dashboard ideas

Use these questions as a starting point when connecting a dashboard tool to exported D1 data.

## Core metrics

- Total clicks by day
- Total leads by day
- Lead conversion rate by campaign
- Clicks by `utm_source`
- Leads by `utm_campaign`
- Recent leads with click context
- Webhook delivery status over time
- Campaigns with clicks but no leads
- Top referrers

## Example SQL

### Clicks by campaign

```sql
SELECT
  utm_source,
  utm_campaign,
  COUNT(*) AS clicks
FROM clicks
GROUP BY utm_source, utm_campaign
ORDER BY clicks DESC;
```

### Leads by campaign

```sql
SELECT
  c.utm_source,
  c.utm_campaign,
  COUNT(l.id) AS leads
FROM clicks c
LEFT JOIN leads l ON l.click_id = c.click_id
GROUP BY c.utm_source, c.utm_campaign
ORDER BY leads DESC;
```

### Daily click and lead trend

```sql
SELECT
  date(c.created_at) AS day,
  COUNT(DISTINCT c.click_id) AS clicks,
  COUNT(DISTINCT l.id) AS leads
FROM clicks c
LEFT JOIN leads l ON l.click_id = c.click_id
GROUP BY day
ORDER BY day DESC;
```

### Conversion rate by campaign

```sql
SELECT
  c.utm_source,
  c.utm_campaign,
  COUNT(DISTINCT c.click_id) AS clicks,
  COUNT(DISTINCT l.id) AS leads,
  ROUND(
    100.0 * COUNT(DISTINCT l.id) / NULLIF(COUNT(DISTINCT c.click_id), 0),
    2
  ) AS conversion_rate_percent
FROM clicks c
LEFT JOIN leads l ON l.click_id = c.click_id
GROUP BY c.utm_source, c.utm_campaign
ORDER BY conversion_rate_percent DESC;
```

### Recent leads with attribution context

```sql
SELECT
  l.created_at,
  l.name,
  l.phone,
  l.email,
  c.utm_source,
  c.utm_medium,
  c.utm_campaign,
  c.target_url
FROM leads l
LEFT JOIN clicks c ON c.click_id = l.click_id
ORDER BY l.created_at DESC
LIMIT 50;
```

### Webhook delivery health

```sql
SELECT
  event_type,
  status,
  COUNT(*) AS total
FROM webhook_events
GROUP BY event_type, status
ORDER BY total DESC;
```
