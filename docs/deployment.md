# Deployment

## Requirements

- Node.js
- npm or pnpm
- Cloudflare account
- Wrangler CLI
- Cloudflare D1 database

## Steps

### 1. Install dependencies

```bash
npm install
```

### 2. Create D1 database

```bash
npx wrangler d1 create wa-attribution-toolkit-db
```

Update `wrangler.json` with the generated database ID.

### 3. Apply database migrations

Local:

```bash
npx wrangler d1 migrations apply DB --local
```

Remote:

```bash
npx wrangler d1 migrations apply DB --remote
```

### 4. Configure secrets

```bash
npx wrangler secret put N8N_WEBHOOK_URL
npx wrangler secret put SHLINK_API_URL
npx wrangler secret put SHLINK_API_KEY
npx wrangler secret put DEFAULT_WHATSAPP_PHONE
npx wrangler secret put DEFAULT_REDIRECT_URL
```

Only configure what your deployment uses.

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy

```bash
npm run deploy
```

## Production notes

- Use a dedicated D1 database for production.
- Keep webhook URLs out of the repository.
- Review CORS behavior before exposing production APIs.
- Add authentication before using `/stats` in sensitive deployments.
