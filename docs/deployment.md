# Deployment / Deploy

This guide covers two deployment paths:

- local machine with browser access;
- remote VPS/server without browser access.

Este guia cobre dois cenários de deploy:

- máquina local com acesso ao navegador;
- VPS/servidor remoto sem acesso direto ao navegador.

---

## English

### Requirements

- Node.js
- npm or pnpm
- Cloudflare account
- Cloudflare API Token for VPS/server deployments
- Cloudflare Account ID
- Cloudflare D1 database
- Wrangler CLI through `npx wrangler`

### 1. Install dependencies

```bash
npm install
```

### 2. Authentication

#### Option A: local machine

If you are running this from your own computer and a browser can open normally, use:

```bash
npx wrangler login
```

#### Option B: VPS/server

If you are running from a VPS, prefer API Token authentication. Browser-based OAuth can fail on servers because Wrangler tries to open a local callback URL.

Create a Cloudflare API Token:

1. Open the Cloudflare dashboard.
2. Use the dashboard search bar and search for `API`.
3. Open the API Tokens page.
4. Create a custom token.
5. Add the permissions needed for Workers and D1.
6. Scope the token to the Cloudflare account that will host the Worker.
7. Copy the generated API token.

Recommended token permissions:

```text
Account → D1 → Edit
Account → Workers Scripts → Edit
Account → Account Settings → Read
User → User Details → Read
```

Then export the credentials in the VPS shell:

```bash
export CLOUDFLARE_API_TOKEN='paste-your-token-here'
export CLOUDFLARE_ACCOUNT_ID='paste-your-account-id-here'
```

Check authentication:

```bash
npx wrangler whoami
```

Important:

```text
CLOUDFLARE_API_TOKEN = API token generated in Cloudflare
CLOUDFLARE_ACCOUNT_ID = Cloudflare account ID, not the token
```

If the Account ID is wrong, D1 commands may fail with an invalid object identifier error.

### 3. Create D1 database

```bash
npx wrangler d1 create wa-attribution-toolkit-db
```

If the database already exists, list existing databases:

```bash
npx wrangler d1 list
```

Copy the `uuid` / `database_id` for `wa-attribution-toolkit-db`.

### 4. Update `wrangler.json`

Replace this placeholder:

```json
"database_id": "REPLACE_WITH_D1_DATABASE_ID"
```

with the real D1 database ID returned by Cloudflare.

Keep the binding as `DB`:

```json
"binding": "DB"
```

The Worker code expects `env.DB`.

### 5. Apply database migrations

Local:

```bash
npx wrangler d1 migrations apply DB --local
```

Remote:

```bash
npx wrangler d1 migrations apply DB --remote
```

### 6. Configure secrets

For demo deployments, configure at least `ADMIN_TOKEN`:

```bash
npx wrangler secret put ADMIN_TOKEN
```

Optional secrets:

```bash
npx wrangler secret put N8N_WEBHOOK_URL
npx wrangler secret put SHLINK_API_URL
npx wrangler secret put SHLINK_API_KEY
npx wrangler secret put DEFAULT_WHATSAPP_PHONE
npx wrangler secret put DEFAULT_REDIRECT_URL
```

Only configure what your deployment uses. Do not commit secrets to the repository.

### 7. Run locally

```bash
npm run dev
```

### 8. Deploy

```bash
npm run deploy
```

### 9. Test production

Replace the URL with your Worker URL.

```bash
curl https://your-worker.workers.dev/health
```

Expected response:

```json
{
  "ok": true,
  "service": "wa-attribution-toolkit"
}
```

---

## Português

### Requisitos

- Node.js
- npm ou pnpm
- Conta Cloudflare
- API Token da Cloudflare para deploy em VPS/servidor
- Account ID da Cloudflare
- Banco Cloudflare D1
- Wrangler via `npx wrangler`

### 1. Instalar dependências

```bash
npm install
```

### 2. Autenticação

#### Opção A: máquina local

Se você estiver rodando no seu próprio computador e o navegador abrir normalmente, use:

```bash
npx wrangler login
```

#### Opção B: VPS/servidor

Se estiver rodando dentro de uma VPS, prefira autenticação por API Token. O OAuth via navegador pode falhar em servidor porque o Wrangler tenta abrir uma URL local de callback.

Criar API Token na Cloudflare:

1. Abra o painel da Cloudflare.
2. Use a barra de pesquisa do painel e pesquise por `API`.
3. Abra a página de API Tokens.
4. Crie um token customizado.
5. Adicione as permissões necessárias para Workers e D1.
6. Restrinja o token à conta Cloudflare que hospedará o Worker.
7. Copie o token gerado.

Permissões recomendadas:

```text
Account → D1 → Edit
Account → Workers Scripts → Edit
Account → Account Settings → Read
User → User Details → Read
```

Depois, exporte as credenciais na VPS:

```bash
export CLOUDFLARE_API_TOKEN='cole-o-token-aqui'
export CLOUDFLARE_ACCOUNT_ID='cole-o-account-id-aqui'
```

Teste a autenticação:

```bash
npx wrangler whoami
```

Importante:

```text
CLOUDFLARE_API_TOKEN = token gerado na Cloudflare
CLOUDFLARE_ACCOUNT_ID = ID da conta Cloudflare, não é o token
```

Se o Account ID estiver errado, comandos do D1 podem falhar com erro de identificador inválido.

### 3. Criar banco D1

```bash
npx wrangler d1 create wa-attribution-toolkit-db
```

Se o banco já existir, liste os bancos existentes:

```bash
npx wrangler d1 list
```

Copie o `uuid` / `database_id` do banco `wa-attribution-toolkit-db`.

### 4. Atualizar `wrangler.json`

Troque este placeholder:

```json
"database_id": "REPLACE_WITH_D1_DATABASE_ID"
```

pelo ID real do banco D1 retornado pela Cloudflare.

Mantenha o binding como `DB`:

```json
"binding": "DB"
```

O código do Worker espera `env.DB`.

### 5. Aplicar migrations

Local:

```bash
npx wrangler d1 migrations apply DB --local
```

Remoto:

```bash
npx wrangler d1 migrations apply DB --remote
```

### 6. Configurar secrets

Para deploy de demo, configure pelo menos o `ADMIN_TOKEN`:

```bash
npx wrangler secret put ADMIN_TOKEN
```

Secrets opcionais:

```bash
npx wrangler secret put N8N_WEBHOOK_URL
npx wrangler secret put SHLINK_API_URL
npx wrangler secret put SHLINK_API_KEY
npx wrangler secret put DEFAULT_WHATSAPP_PHONE
npx wrangler secret put DEFAULT_REDIRECT_URL
```

Configure apenas o que seu deploy realmente usa. Não faça commit de secrets no repositório.

### 7. Rodar localmente

```bash
npm run dev
```

### 8. Fazer deploy

```bash
npm run deploy
```

### 9. Testar produção

Troque pela URL real do seu Worker.

```bash
curl https://seu-worker.workers.dev/health
```

Resposta esperada:

```json
{
  "ok": true,
  "service": "wa-attribution-toolkit"
}
```

---

## Production notes / Notas de produção

- Use a dedicated D1 database for production.
- Keep webhook URLs and API keys out of the repository.
- Use fake data in public demos.
- Review CORS behavior before exposing production APIs.
- Configure `ADMIN_TOKEN` before using `/stats` in sensitive deployments.

- Use um banco D1 dedicado para produção.
- Mantenha URLs de webhook e API keys fora do repositório.
- Use dados falsos em demos públicas.
- Revise o comportamento de CORS antes de expor APIs em produção.
- Configure `ADMIN_TOKEN` antes de usar `/stats` em ambientes sensíveis.
