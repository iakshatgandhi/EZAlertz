# EZ Alertz

Persistent real-time stock price alerts for Indian equities.

## Stack

- **Backend:** Node.js, TypeScript, Express, PostgreSQL, Redis, Upstox V3 WebSocket
- **Frontend:** Next.js, React, Tailwind CSS
- **Monorepo:** pnpm workspaces

## Quick start

### 1. Install dependencies

```bash
cd stock-alert-app
pnpm install
```

### 2. Start infrastructure

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 3. Configure backend

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your Upstox credentials
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start backend (Phase 1 — live LTP)

```bash
pnpm dev
```

Or run market-data only:

```bash
pnpm dev:market-data
```

### 6. Check status

```bash
curl http://localhost:4000/api/status
```

### 7. Start frontend (scaffold)

```bash
pnpm dev:frontend
```

## Project structure

See [project-structure-plan.md](./project-structure-plan.md) for the full layout.

## Phases completed

- **Phase 1:** Upstox V3 WebSocket + live LTP feed
- **Phase 2:** Alert engine with crossing detection + notifications (console)
- **Phase 3:** PostgreSQL persistence + REST API for alerts + instrument search
- **Phase 4:** Redis alert index + startup state recovery

## Phase 5 — WhatsApp notifications

When an alert triggers, a WhatsApp message is enqueued via **BullMQ** and sent asynchronously through the **Meta WhatsApp Cloud API** (no blocking on the market-data hot path).

Add to `apps/backend/.env`:

```env
WHATSAPP_API_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_RECIPIENT_PHONE=919876543210
```

Then run migration and restart:

```bash
pnpm db:migrate
pnpm dev
```

**Setup (Meta):**
1. Create an app at [developers.facebook.com](https://developers.facebook.com/)
2. Add **WhatsApp** product → use API Setup
3. Copy **temporary access token** → `WHATSAPP_API_TOKEN`
4. Copy **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
5. Add your phone as a test recipient in the Meta dashboard
6. Set `WHATSAPP_RECIPIENT_PHONE` to your number (country code, no `+`)

Delivery is tracked in the `notifications` table (`PENDING` → `SENT` / `FAILED`). Failed jobs retry up to 5 times with exponential backoff.

## Phase 6 — Auth & polished UI

- Register / login at `/register` and `/login` (Redis-backed session cookies)
- Protected dashboard at `/` with stock search, alert creation, delete, live SSE
- WhatsApp phone settings on dashboard
- Next.js proxies `/api/*` to the backend so cookies work on `localhost:3000`

Add to `apps/backend/.env`:
```env
FRONTEND_URL=http://localhost:3000
```

```bash
pnpm dev          # backend :4000
pnpm dev:frontend # frontend :3000
```

Open http://localhost:3000 → create account → set WhatsApp number → create alerts.

## Instrument search (live from Upstox)

Stock search calls the **Upstox Instrument Search API** as you type — no bulk download on startup. New IPOs and listings appear automatically.

- Type at least **2 characters** (e.g. `ta`, `reli`, `adani`)
- Results are filtered to **NSE/BSE cash equities**
- When you select a stock, it is saved locally so alerts can reference it

Requires a valid `UPSTOX_ACCESS_TOKEN` in `apps/backend/.env`.

Optional: `pnpm sync-instruments` still exists if you want to bulk-load the full universe into Postgres for offline search experiments.

## Market data WebSocket reconnect (dev vs production)

### Current behavior

- On **backend startup**, `withReconnect` in `apps/backend/src/market-data/reconnect.ts` tries to connect the Upstox V3 WebSocket (up to 10 attempts with exponential backoff).
- **Upstox SDK auto-reconnect is disabled** — it was causing a crash loop (`clearSubscriptions is not a function`) when the token was invalid or the socket dropped.
- **Stock search and LTP on select** use Upstox REST APIs and are not affected by WebSocket state.

### Limitation (acceptable for dev)

If the WebSocket **disconnects after the server is already running** (network blip, Upstox outage), live price ticks stop until you **restart the backend** (`pnpm dev`). Alerts will not trigger on live crossings while disconnected.

### Production TODO

See **[PRODUCTION.md](./PRODUCTION.md)** for the full deployment checklist.

Runtime WebSocket reconnect is **implemented** via `MarketDataReconnectManager` (`apps/backend/src/market-data/marketDataReconnectManager.ts`). Remaining production blockers:

1. **Upstox OAuth token refresh** — dev tokens expire daily; implement OAuth so the server renews automatically.
2. **Permanent WhatsApp API token** — move off Meta's 24h test token.
3. **Always-on hosting** — deploy backend to a VPS/PaaS (not your laptop).
4. **Managed Postgres + Redis** with backups.

Related files:

- `apps/backend/src/market-data/marketDataReconnectManager.ts`
- `apps/backend/src/market-data/reconnect.ts`
- `apps/backend/src/market-data/providers/upstox/UpstoxProvider.ts`
- `apps/backend/src/market-data/subscriptionManager.ts`
- `apps/backend/src/instruments/upstox/upstoxAuth.ts` (token validation)

### Upstox access token

`UPSTOX_ACCESS_TOKEN` expires (often daily for dev tokens). Regenerate from the [Upstox developer portal](https://upstox.com/developer/api-documentation/) and update `apps/backend/.env`. Invalid tokens cause HTTP 401 on search/LTP and WebSocket errors at startup.

## API (with session cookie after login)

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"you@example.com","password":"password123","whatsappPhone":"919876543210"}'

# Search stocks (requires session cookie)
curl "http://localhost:4000/api/stocks/search?q=reliance" -b cookies.txt

# Create alert
curl -X POST http://localhost:4000/api/alerts \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"instrumentId":"<uuid>","condition":"BELOW","targetPrice":1450,"mode":"ONE_TIME"}'
```

