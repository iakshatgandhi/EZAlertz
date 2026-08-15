# Production deployment guide

This document covers what you need for **always-on alerts** that trigger reliably and send WhatsApp notifications during market hours.

## How alerts work end-to-end

```
Upstox WebSocket (live LTP ticks)
        ↓
   Alert engine (crossing detection)
        ↓
   BullMQ queue (async, retries)
        ↓
   WhatsApp Cloud API → your phone
```

Alerts only fire when:

1. The backend process is **running 24/7**
2. The Upstox WebSocket is **connected** (market hours: Mon–Fri ~9:15–15:30 IST)
3. `UPSTOX_ACCESS_TOKEN` is **valid**
4. WhatsApp credentials are configured
5. Your user profile has a **WhatsApp phone number** set

---

## Checklist before going live

### 1. Hosting (always-on server)

Your laptop with `pnpm dev` is not production. Deploy to a VPS or PaaS that runs continuously:

| Option | Notes |
|--------|--------|
| **Railway / Render / Fly.io** | Easy deploy, managed Postgres/Redis add-ons |
| **DigitalOcean / Hetzner VPS** | Full control, use Docker Compose + systemd |
| **AWS EC2 / GCP** | More setup, scales well |

Minimum: **1 backend instance** always running (not serverless — WebSocket needs a persistent process).

### 2. Database & Redis (persistent)

```bash
docker compose -f infra/docker-compose.yml up -d
```

For production use **managed Postgres + Redis** (Railway, Supabase, Upstash) with backups. Data loss = lost alerts and users.

### 3. Upstox access token (critical)

Dev tokens from the Upstox portal **expire daily**. For production you need:

- [ ] **OAuth 2.0 flow** — implement token refresh using `UPSTOX_CLIENT_ID` + `UPSTOX_CLIENT_SECRET` (not yet built; highest priority after deploy)
- [ ] Until OAuth is built: set a **daily cron** or reminder to regenerate the token and restart the backend
- [ ] Monitor `/api/status` — `marketData` should be `"connected"` during market hours

### 4. WhatsApp notifications (production)

Dev tokens from Meta expire. For production:

- [ ] Complete **Meta Business Verification**
- [ ] Use a **permanent** WhatsApp Cloud API token (not 24h test token)
- [ ] Set in `apps/backend/.env`:
  ```env
  WHATSAPP_API_TOKEN=
  WHATSAPP_PHONE_NUMBER_ID=
  ```
- [ ] Users set their phone on the dashboard (`users.whatsapp_phone`) — alerts send to **that** number, not `WHATSAPP_RECIPIENT_PHONE` (dev fallback only)

BullMQ already retries failed WhatsApp sends **5 times** with exponential backoff.

### 5. Environment variables (production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SESSION_SECRET=<long-random-string>
UPSTOX_ACCESS_TOKEN=<valid-token>
UPSTOX_CLIENT_ID=<for-oauth-later>
UPSTOX_CLIENT_SECRET=<for-oauth-later>
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
FRONTEND_URL=https://your-domain.com
PORT=4000
```

Never commit `.env`. Use your host's secrets manager.

### 6. HTTPS & domain

- [ ] Frontend at `https://your-domain.com`
- [ ] Backend at `https://api.your-domain.com` (or same domain with reverse proxy)
- [ ] Update `FRONTEND_URL` and Next.js rewrites
- [ ] Cookies use `secure: true` automatically when `NODE_ENV=production`

See `infra/nginx/nginx.conf` as a starting reverse-proxy config.

### 7. Process management

Use **systemd**, **PM2**, or Docker `restart: unless-stopped` so the backend restarts on crash:

```bash
pnpm build
node apps/backend/dist/server.js
```

### 8. Market data reconnect (implemented)

`MarketDataReconnectManager` automatically reconnects the Upstox WebSocket if it drops and re-subscribes all alert instruments. No manual restart needed for network blips.

### 9. Monitoring

Watch these in production:

| Endpoint / signal | Healthy |
|-------------------|---------|
| `GET /health` | `{ "ok": true }` |
| `GET /api/status` | `marketData: "connected"` during market hours |
| Backend logs | No repeated `UPSTOX_ACCESS_TOKEN is invalid` |
| `notifications` table | `SENT` status after triggers |

Set up uptime monitoring (UptimeRobot, Better Stack) on `/health`.

### 10. Security

- [ ] Change default Postgres/Redis passwords
- [ ] Remove or disable dev seed user in production (`startup/seed.ts`)
- [ ] Rate-limit auth endpoints (future)
- [ ] Firewall: only expose 80/443, not 5432/6379 publicly

---

## Deploy steps (summary)

```bash
# 1. Infrastructure
docker compose -f infra/docker-compose.yml up -d   # or use managed DB

# 2. Build
pnpm install
pnpm db:migrate
pnpm build

# 3. Configure production .env on server

# 4. Run backend (with process manager)
NODE_ENV=production node apps/backend/dist/server.js

# 5. Run frontend
cd apps/frontend && pnpm build && pnpm start
```

---

## Market hours reminder

Indian equity market (NSE/BSE): **Monday–Friday, 9:15 AM – 3:30 PM IST**.

- No live ticks outside market hours (expected)
- Alerts only trigger when prices actually move during sessions
- LTP on weekends shows last close or may be unavailable

---

## Roadmap (recommended next builds)

| Priority | Feature | Why |
|----------|---------|-----|
| P0 | Upstox OAuth token refresh | Tokens expire daily without it |
| P1 | Docker Compose for full stack (backend + frontend) | One-command deploy |
| P2 | Per-user WhatsApp from profile (verify end-to-end) | Multi-user production |
| P3 | Admin health dashboard | See connection + alert stats |
| P4 | Email/Push backup channel | If WhatsApp fails |

---

## Quick test before launch

1. Create an alert with target **very close** to current LTP (e.g. ₹1 above)
2. Confirm `marketData: connected` on `/api/status`
3. Wait for a tick to cross the threshold during market hours
4. Check WhatsApp message arrives within seconds
5. Check `notifications` table: status = `SENT`
