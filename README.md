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
- **AI Grounded Source Synthesis**: Generates grounded citations and executive digests from top search results without hallucinations.
- **Developer REST API**: Deterministic JSON endpoints (`/api/v1/search`, `/api/v1/suggest`, `/api/v1/health`), token-bucket rate limiting, and Bearer token authentication.
- **Security & SSRF Hardening**: Strict private IP blocklist (blocking `127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.0.0/16` metadata endpoints), request timeouts, and sanitization.
- **API Key & Account Management**: Salted SHA-256 key hashing (raw keys shown only once), monthly quota meters, and atomic usage counters.
- **Tiered Subscriptions**: Configurable pricing tiers (Free, Starter, Pro, Business) with sandbox payment flow for India-compatible rails (UPI, RuPay/Cards, NetBanking).
- **Operations Console**: Circuit breakers with cooldown recovery windows, bounded LRU caching (45s TTL), latency telemetry, and service health monitoring.

## Architecture

- **Backend**: Express on port `3000` (`server.ts`) with Vite middleware in development and static asset serving in production.
- **Frontend**: React 19 Single Page Application with Tailwind CSS v4 and Lucide React icons.
- **Security**: Built-in SSRF defense firewall, token bucket rate limiter, CSP/XSS protections, and zero search tracking.

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
