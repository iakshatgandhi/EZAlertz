# Stock Price Alert App — Project Structure

A monorepo, split into `backend` and `frontend`, with the backend broken into
the four services your spec defines (Market Data, Alert Engine, Alert
Management, Notifications) so each stays independently testable and the
Upstox dependency stays isolated behind an interface (section 29).

```
stock-alert-app/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── env.ts                    # env var loading/validation
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   ├── market-data/                  # Market Data Service (§5, §29, §30)
│   │   │   │   ├── MarketDataProvider.ts      # interface: connect/subscribe/unsubscribe/onPriceUpdate/disconnect
│   │   │   │   ├── providers/
│   │   │   │   │   └── upstox/
│   │   │   │   │       ├── UpstoxClient.ts    # WebSocket connection + auth
│   │   │   │   │       ├── UpstoxProvider.ts  # implements MarketDataProvider
│   │   │   │   │       └── mapUpstoxTick.ts   # raw payload → normalized tick
│   │   │   │   ├── normalizer.ts              # → {instrumentKey, symbol, exchange, ltp, timestamp}
│   │   │   │   ├── subscriptionManager.ts     # tracks which instruments need a feed
│   │   │   │   └── reconnect.ts               # backoff + resubscribe on drop (§13)
│   │   │   │
│   │   │   ├── alert-engine/                  # Alert Engine (§4, §10, §12)
│   │   │   │   ├── evaluator.ts               # per-tick evaluation loop
│   │   │   │   ├── crossingDetector.ts        # prev/current price crossing logic
│   │   │   │   ├── idempotency.ts             # dedupe triggers (Redis lock / unique constraint)
│   │   │   │   └── stateTransitions.ts        # ACTIVE → TRIGGERED, etc.
│   │   │   │
│   │   │   ├── alerts/                        # Alert Management Service (§7, REST)
│   │   │   │   ├── alerts.controller.ts
│   │   │   │   ├── alerts.service.ts
│   │   │   │   ├── alerts.routes.ts
│   │   │   │   ├── alerts.repository.ts       # Postgres access
│   │   │   │   └── alerts.validation.ts
│   │   │   │
│   │   │   ├── instruments/                   # search + instrument master data (§6, §17)
│   │   │   │   ├── instruments.controller.ts
│   │   │   │   ├── instruments.service.ts
│   │   │   │   ├── instruments.repository.ts
│   │   │   │   └── sync/
│   │   │   │       └── syncUpstoxInstruments.ts  # pulls official Upstox instrument list
│   │   │   │
│   │   │   ├── notifications/                  # Notification Service (§7)
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── queue.ts                   # async job queue (BullMQ/Redis-backed)
│   │   │   │   └── channels/
│   │   │   │       ├── whatsapp.channel.ts
│   │   │   │       ├── email.channel.ts
│   │   │   │       ├── push.channel.ts
│   │   │   │       └── telegram.channel.ts    # future
│   │   │   │
│   │   │   ├── realtime/                      # browser-facing live updates (§18)
│   │   │   │   ├── sse.ts                     # or ws.ts
│   │   │   │   └── eventBus.ts                # PRICE_UPDATE, ALERT_TRIGGERED, etc.
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.middleware.ts
│   │   │   │
│   │   │   ├── db/
│   │   │   │   ├── postgres/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   ├── migrations/
│   │   │   │   │   └── schema/                # users, instruments, alerts, notifications
│   │   │   │   └── redis/
│   │   │   │       ├── client.ts
│   │   │   │       └── alertIndex.ts          # alerts:{instrument_key} lookups (§9)
│   │   │   │
│   │   │   ├── startup/
│   │   │   │   └── recoverState.ts            # load ACTIVE alerts, rebuild Redis, resubscribe (§14)
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   ├── types/                     # Alert, Instrument, NormalizedTick, etc.
│   │   │   │   ├── logger.ts
│   │   │   │   └── errors.ts
│   │   │   │
│   │   │   └── server.ts                      # composition root: wires services together
│   │   │
│   │   ├── tests/
│   │   │   ├── alert-engine/                  # the 15 cases from §31
│   │   │   ├── market-data/
│   │   │   └── fixtures/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                              # Next.js (§16)
│       ├── app/
│       │   ├── page.tsx                       # main screen
│       │   └── layout.tsx
│       ├── components/
│       │   ├── search/
│       │   │   ├── StockSearchBar.tsx
│       │   │   └── SearchResults.tsx
│       │   ├── alerts/
│       │   │   ├── AlertForm.tsx
│       │   │   ├── ActiveAlertsList.tsx
│       │   │   └── AlertCard.tsx
│       │   └── status/
│       │       └── ConnectionStatus.tsx       # "Live data connected" / reconnecting
│       ├── lib/
│       │   ├── apiClient.ts
│       │   └── realtimeClient.ts              # SSE/WS subscriber
│       ├── hooks/
│       │   ├── useAlerts.ts
│       │   └── useLivePrice.ts
│       ├── styles/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared-types/                          # types shared by backend + frontend
│       └── index.ts                           # Alert, Instrument, WS event payloads
│
├── infra/
│   ├── docker-compose.yml                     # Postgres + Redis + Nginx locally (§27)
│   └── nginx/
│       └── nginx.conf
│
├── docs/
│   └── (your original spec, ADRs, etc.)
│
└── README.md
```

## Why this shape

- **`market-data/` never leaks into `alert-engine/`.** The engine only ever consumes the normalized tick shape from `normalizer.ts`. That's what lets you swap Upstox for another provider later (§29) without touching alert logic — and it's what makes the alert engine unit-testable without a live WebSocket (§31, tests 1–10 can run on fixture ticks alone).
- **`alerts/` (management) is separate from `alert-engine/` (evaluation).** One handles CRUD/HTTP, the other handles the hot path triggered by every tick. Keeping them apart means the evaluation loop has no HTTP/validation overhead in it.
- **`idempotency.ts` gets its own file**, not because it's big, but because §12 flags duplicate notifications as a critical failure mode — worth making a deliberate, testable unit rather than an inline check.
- **`startup/recoverState.ts` is explicit** because §14 requires alerts to survive a restart; this is the one function that has to run before anything else on boot (load ACTIVE alerts → rebuild Redis → resubscribe → connect).
- **`shared-types/` as a workspace package** avoids duplicating the `Alert`/`Instrument`/event-payload shapes between backend and frontend, which matters once you're pushing `ALERT_TRIGGERED` events over SSE and need the same shape on both ends.

## Suggested build order (matches your Phase 1–9)

1. Scaffold just `market-data/` + `server.ts` — get one instrument's LTP printing to console.
2. Add `alert-engine/` with one hard-coded alert, fed by real ticks.
3. Add `db/postgres` + `alerts/` — persist alerts, still evaluating in memory.
4. Add `db/redis/alertIndex.ts` — move lookup off Postgres onto the hot path.
5. Add `notifications/` — start with one channel (push or Telegram is fastest to stand up).
6. Add `frontend/` — search, create, list, delete.
7. Add `startup/recoverState.ts` + `reconnect.ts` — reliability pass.

I kept `docker-compose.yml` single-host per §27 — no k8s/ECS scaffolding until you actually need it.

---

Want me to actually scaffold this on disk (empty folders, `package.json`s, `tsconfig.json`s, a barebones `docker-compose.yml`) as a zip you can pull down and start coding in?
