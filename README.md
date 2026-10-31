# Orbit Search — Enterprise Federated Search & Developer API Platform

Orbit Search is a high-performance federated search engine, developer API platform, and multi-domain knowledge discovery system built with Node.js 22, Express, React 19, and Tailwind CSS v4.

## Core Capabilities

- **Concurrent Multi-Domain Search**: Concurrently queries authoritative public providers:
  - **arXiv**: Academic pre-prints, computer science, and physics literature.
  - **GitHub**: Open-source repositories, developer tools, and commit code.
  - **Wikipedia**: Verified encyclopedia articles, summaries, and open knowledge.
  - **GDELT Project**: Real-time global event and news wire monitoring.
  - **Open Library**: Curated book catalogs, first editions, and author indices.
  - **Wikimedia Commons**: Free-licensed public media and educational graphics.
- **Relevance Ranking & URL Deduplication**: Cross-provider normalization, deduplication, and score weighting.
- **Source Digest**: Formats returned provider snippets for review. This is not an AI model and does not independently verify claims.
- **Developer REST API**: Deterministic JSON endpoints (`/api/v1/search`, `/api/v1/suggest`, `/api/v1/health`), token-bucket rate limiting, and Bearer token authentication.
- **Outbound request controls**: HTTPS-only allowlist of known provider hostnames, redirects blocked, request timeouts, and a 2 MB response limit.
- **API Key Management**: Keys are hashed and stored in a local JSON file; administrative endpoints require `ORBIT_ADMIN_TOKEN` (32+ characters). Use a persistent private volume for production.
- **Billing**: Disabled until a real payment provider, verified webhooks, and persistent order records are configured. The UI is not a payment processor.
- **Operations Console**: Circuit breakers with cooldown recovery windows, bounded LRU caching (45s TTL), latency telemetry, and service health monitoring.

## Architecture

- **Backend**: Express on port `3000` (`server.ts`) with Vite middleware in development and static asset serving in production.
- **Frontend**: React 19 Single Page Application with Tailwind CSS v4 and Lucide React icons.
- **Security**: Fixed provider-host allowlist, redirect blocking, request-size limits, CSP and security headers, and a server-side rate limiter. This is not a guarantee of complete security.

## Getting Started

```bash
# Install dependencies
npm install

# Start full-stack development server
npm run dev

# Build for production
npm run build
npm start
```


## Configuration and production limitations

- Set `ORBIT_ADMIN_TOKEN` to a cryptographically random secret of at least 32 characters before using API-key administration. Requests to `/api/v1/keys` must send it as `Authorization: Bearer <token>`. If it is absent or too short, those routes remain disabled.
- Set `ORBIT_ALLOWED_ORIGINS` to a comma-separated list of exact browser origins only if cross-origin access is needed. Same-origin requests work without it.
- Set `ORBIT_DATA_DIR` to a persistent, private writable directory in deployments. API-key metadata is persisted there; ephemeral container filesystems will lose it on redeploy. Do not commit `data/api-keys.json`.
- Public browser search remains rate-limited but does not require a key. This is not yet a production multi-tenant paid API: user accounts, tenant ownership, billing, monthly quota rollover, distributed rate limits, and payment-provider integration are not implemented.
- The existing Python crawler/index engine is not present in this repository's current tree. This build performs federated live searches and does not claim to have integrated the original Python engine.

## Verification

Run `npm install`, `npm run lint`, `npm run build`, and `npm test`. CI runs these checks on `dev`, `main`, and pull requests. Provider integration checks require network access and may vary with upstream availability.
