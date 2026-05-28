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

## Example SQL

```sql
SELECT
  utm_source,
  utm_campaign,
  COUNT(*) AS clicks
FROM clicks
GROUP BY utm_source, utm_campaign
ORDER BY clicks DESC;
```

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
