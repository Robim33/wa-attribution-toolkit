# Demo plan

This document outlines a safe demo setup for WA Attribution Toolkit.

## Objective

Provide a small public demo that helps developers understand the attribution flow without exposing production data.

## Suggested setup

```text
Demo tracked link
  -> Cloudflare Worker demo deployment
  -> demo D1 database
  -> fake click record
  -> fake lead event
  -> optional request bin or demo n8n webhook
```

## Data policy

The demo should only use fake values:

- fake phone numbers
- fake names
- fake campaign names
- fake emails
- fake webhook destinations

Do not use real customers, real campaign identifiers or private webhook URLs.

## README section to add later

```md
## Demo

A small demo deployment is available at: `<demo-url>`

The demo uses fake data only and is intended to show the click-to-lead attribution flow.
```

## Acceptance checklist

- [ ] Worker deployed
- [ ] Demo D1 database created
- [ ] Fake seed data added
- [ ] README updated with demo URL
- [ ] Demo data policy documented
