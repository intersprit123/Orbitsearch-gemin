# Orbit Search — Enterprise Federated Search & Developer Platform

Transform Orbit Search from a local Python prototype into a high-performance, production-grade federated search platform and developer API service featuring an Express proxy and caching backend, modern React SPA interface, comprehensive search domains, developer portal, and secure account/quota management.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Dev Server Startup Priority**: The application will immediately scaffold `package.json`, install dependencies, set up `vite.config.ts` and `server.ts` listening on `0.0.0.0:3000`, and start the development server so the preview loads without delay.

- **Immediate Port 3000 Dev Server Launch**: Scaffolding full-stack Node 22 + Express + Vite + React 19 with `"dev": "tsx server.ts"` and Vite middleware, ensuring immediate health and frontend availability.
- **Full-Stack Node Express & React Architecture**: Serving on port `3000` with an Express API gateway that handles real-time concurrent federated upstream querying, caching, circuit breaking, SSRF security validation, and rate limiting, alongside a React SPA frontend.
- **Unified Multi-Domain Federation**: Simultaneous querying across General Web, Scholarly Research (arXiv & OpenAlex), Code & Repositories (GitHub), News & Media (GDELT), and Open Knowledge (Wikipedia & Open Library) with relevance re-ranking, deduplication, and source attribution.
- **Account & Quota Isolation**: Multi-tenant user accounts with hashed API keys, configurable pricing tiers (Free, Starter, Pro, Business), atomic usage tracking, and simulated tenant security isolation with encrypted browser storage and server-side authorization enforcement.
- **Production Developer Portal & Admin Suite**: Complete interactive documentation, curl/JS code snippets, API key generation/revocation, live provider health telemetry, latency monitoring, and plan management.

---

### 1. Overview & Core Concept

- **What It Does**: Orbit Search provides lightning-fast federated search across verified public knowledge bases, academic repositories, code registries, news feeds, and the open web. It delivers instant AI-grounded source digests, robust developer APIs with granular usage quotas, and administrative operational telemetry.
- **Target Audience / Persona**:
  - *Knowledge Workers & Researchers*: Querying papers, cross-disciplinary citations, and books without commercial advertising trackers.
  - *Software Engineers & Developers*: Searching code repos, package registries, and utilizing high-throughput REST APIs for custom search tooling.
  - *Enterprise Administrators*: Monitoring query volume, provider latency, error rates, and API quotas.
- **Key Value**: A private, transparent, ad-free alternative to monopolistic search engines, backed by an open developer API and honest subscription tiers.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Public Discovery Flow**:
   - User arrives at the cinematic, deep-slate Orbit Search homepage featuring a centralized omnibar, domain selector tabs, trending suggestions, and live service status.
   - Submitting a query transitions into the Search Engine Results Page (SERP) with sub-second federated aggregation, source attribution cards, filter sidebars, and an optional AI synthesis digest.
2. **Developer & API Key Flow**:
   - Developer visits the Developer Portal, reads endpoint specifications with interactive curl/JS examples, registers an account, generates a high-entropy `orb_live_...` API key (shown once), and tests queries via the interactive API playground.
3. **Account & Billing Flow**:
   - Users view their monthly request quota gauge, active subscription tier, recent search history, and generated API keys in the User Dashboard.
   - Pricing page enables seamless upgrading between Free (1,000 req/mo), Starter (10,000 req/mo), Pro (50,000 req/mo), and Business (200,000 req/mo) with simulated India-ready checkout flows.
4. **Operations & Admin Flow**:
   - Admins monitor system-wide metrics: queries per second, per-provider latency percentiles, circuit-breaker statuses, active API keys, and error rates.

#### Visual Identity & Theme
- **Aesthetic Direction**: Neo-futuristic, high-density search terminal aesthetic reminiscent of modern developer tooling (Linear, Vercel, Raycast) with deep obsidian backgrounds, sharp typographic contrast, and deliberate luminescent accents.
- **Color Palette & Mood**:
  - Canvas: Obsidian Slate (`#090D16`), Card Panels (`#0F172A`), Elevated Surfaces (`#162036`).
  - Borders: Crisp hairline rules (`#1E293B`, `#2E3F5E`).
  - Accents: Orbit Cyan (`#38BDF8`), Quantum Mint (`#34D399`), Electric Indigo (`#818CF8`).
  - Status Indicators: Emerald (`#10B981`) for nominal health, Amber (`#F59E0B`) for degraded/rate-limited, Crimson (`#EF4444`) for provider failure.
- **Typography & Hierarchy**:
  - Display Font: `Plus Jakarta Sans` / `Outfit` for confident geometric headlines and navigational clarity.
  - Body Font: `DM Sans` for scannable result snippets and documentation prose.
  - Monospace: `JetBrains Mono` / `tabular-nums` for code snippets, JSON payloads, metrics, and API keys.
- **Anti-Slop Discipline**:
  - No static pill capsules or candy badge clutter. Result metadata (source, date, citations, stars) rendered as clean inline typographic text separated by subtle middots (`·`).
  - Interactive filter bars and domain tabs designed as high-precision segmented switches.
  - Generous spatial margins with strict desktop 1440px baseline alignment and responsive mobile touch targets ($\ge 44\text{px}$).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express Gateway with In-Memory Multi-Tier Cache**
  - *Chosen Approach*: Express server acts as the central API gateway handling rate limits, SSRF validation, upstream HTTP timeouts, circuit breakers, and 60-second TTL caching, serving both the React SPA and external `/api/v1/*` requests.
  - *Why*: Eliminates CORS issues, protects sensitive upstream endpoints, safeguards against SSRF attacks on internal addresses, and enables unified quota metering for both web and developer consumers.
  - *Alternatives Considered*: Direct client-side fetching (rejected due to CORS restrictions and inability to enforce rate limits or hide upstream quotas).
- **Decision 2: Comprehensive Multi-Domain Federated Search Engine**
  - *Chosen Approach*: Concurrently queries Wikipedia OpenSearch, arXiv API, GitHub Search API, GDELT News, and Open Library, with individual 4.5s timeouts, graceful partial-failure fallback, and deduplication by canonical URL.
  - *Why*: Delivers instant, comprehensive results across technical, academic, and general web domains without waiting for the slowest provider.
- **Decision 3: Multi-Tenant Account & API Key Management**
  - *Chosen Approach*: Client and server synchronization with hashed API key verification (`sha256`), salted session tokens, per-plan monthly quota counters, and isolated workspace state.
  - *Why*: Provides immediate full-fidelity SaaS functionality while maintaining strict security boundaries.
- **Decision 4: Mock-Safe Indian Payment Provider Architecture**
  - *Chosen Approach*: Idempotent Razorpay/UPI-compatible subscription checkout flow with test mode simulation, cryptographically verifiable webhook handling logic, and plan tier activation guards.
  - *Why*: Guarantees production readiness for Indian merchants without leaking secrets or executing live transactions prior to merchant approval.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Orbit Search Application                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────┐         ┌──────────────────────────────┐
│       React 19 SPA (Port 3000) │         │     Developer API Consumers  │
│  - Hero Omnibar & Autocomplete│         │     (curl, SDKs, Automations)│
│  - Multi-Tab Result Feed      │         └──────────────┬───────────────┘
│  - Developer & API Key Hub    │                        │ Bearer orb_live
│  - Usage Quota & Billing      │                        │
│  - Admin Ops & Provider Status│                        │
└──────────────┬────────────────┘                        │
               │                                         │
               │ Internal /api/v1 calls                  │
               └────────────────────┬────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Express Gateway Backend (server.ts)                  │
│  - SSRF Firewall & Private IP Blocklist (127.0.0.1, 10.0.0.0/8, etc.)   │
│  - Token Bucket Rate Limiter (Per-IP & Per-Key)                        │
│  - Authenticated Session & API Key Hash Verification                   │
│  - Quota Metering & Monthly Limit Guard                                │
│  - In-Memory TTL Cache (LRU Bounded)                                   │
│  - Circuit Breakers & Timeout Handlers (4.5s per provider)             │
└──────────────┬─────────────────────────────────────────────────────────┘
               │ Concurrent Fetch & Relevance Normalization
               ├────────────────────────┬────────────────────────┐
               ▼                        ▼                        ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│ Academic & Research    │  │ Developer & Code       │  │ Knowledge & News       │
│ - arXiv Atom API       │  │ - GitHub REST API      │  │ - Wikipedia OpenSearch │
│ - OpenAlex Works       │  │ - Open Library Docs    │  │ - GDELT News API       │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘
```

#### Core Entities & State
- **User Profile**: `id`, `email`, `name`, `role` (`user` | `admin`), `plan` (`free`, `starter`, `pro`, `business`), `createdAt`.
- **API Key**: `id`, `userId`, `name`, `keyPrefix`, `keyHash`, `lastUsedAt`, `status` (`active`, `revoked`).
- **Subscription Quota**: `planId`, `monthlyLimit`, `currentUsage`, `periodEnd`, `status`.
- **Search Query & Telemetry**: `query`, `category`, `executionTimeMs`, `providersQueried`, `providerStatus`, `resultsCount`.
- **Provider Circuit State**: `providerId`, `state` (`closed`, `open`, `half-open`), `failureCount`, `latencyAvgMs`.

#### Interactive Component & State Mapping
- `SearchHero` & `Omnibar`: Live suggestions with debounce, recent searches dropdown, keyboard shortcuts (`/` to focus, `Esc` to clear), and category tabs.
- `ResultsFeed`: Displays federated results with relevance badges, thumbnail views (media/books), paper abstracts, code stars, and pagination controls.
- `DeveloperPortal`: Copyable code samples (cURL, Node.js, Python), live API test console with response inspector, and latency graphs.
- `DashboardView`: Key generator modal with single-view key reveal, copy-to-clipboard toast, monthly usage progress bar with quota warning states.
- `AdminConsole`: Real-time system health checks, mock provider degradation toggles, user plan overrides, and aggregate query analytics.
