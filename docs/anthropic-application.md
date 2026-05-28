# Claude for Open Source application draft

Use this as the basis for the Anthropic Claude for Open Source form.

## Project

WA Attribution Toolkit

## Repository

https://github.com/Robim33/d1-template

Recommended final repository name before applying:

https://github.com/Robim33/wa-attribution-toolkit

## Track

Ecosystem Impact Track

## Maintainer statement

I maintain WA Attribution Toolkit, an open-source project that helps developers and small businesses track WhatsApp-first leads from paid campaigns using UTMs, click IDs, Shlink, n8n and self-hosted infrastructure.

The project addresses a practical ecosystem gap: many teams depend on WhatsApp, short links and automation workflows for sales, but attribution data is often fragmented across ad platforms, CRMs, spreadsheets and closed tools. WA Attribution Toolkit provides a small, auditable and self-hosted alternative that lets teams capture campaign context, persist click and lead events, forward normalized events to n8n, and integrate with Shlink for short links.

My role includes architecture, implementation, documentation, release planning, issue triage and ongoing maintenance. The current foundation includes a Cloudflare Worker API, D1 persistence, endpoints for click tracking, lead registration and tracked link creation, optional n8n webhook forwarding, optional Shlink integration, documentation and a public roadmap.

Claude Max would directly help me maintain and improve the project by accelerating code review, test coverage, documentation, security hardening, refactoring and issue resolution. The benefit would not be limited to my personal use: it would improve a self-hosted open-source tool for developers and small teams that want to own their attribution data instead of depending entirely on proprietary platforms.

## Short version

I maintain WA Attribution Toolkit, an open-source self-hosted attribution layer for WhatsApp-first funnels. It captures UTMs and ad click IDs, generates durable click IDs, stores click and lead events in Cloudflare D1, forwards normalized webhooks to n8n, and optionally creates short links through Shlink. Claude Max would help me improve code quality, documentation, tests, security and maintenance velocity for a practical developer tool used by teams that need ownership of their attribution data.

## Evidence to mention

- Cloudflare Worker implementation
- D1 schema and migrations
- n8n webhook forwarding
- Shlink integration
- README, docs, security policy and contributing guide
- Public roadmap through GitHub issues

## Important before submitting

- Rename the repository to `wa-attribution-toolkit`.
- Make the repository public.
- Create a `v0.1.0` release.
- Add at least one screenshot or architecture diagram to the README.
- Do not exaggerate stars, users or production adoption.
