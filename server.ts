import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Outbound requests are restricted to the exact upstream hosts used by this app.
// This is safer than trying to maintain a partial private-IP blocklist.
const ALLOWED_UPSTREAM_HOSTS = new Set([
  'en.wikipedia.org',
  'export.arxiv.org',
  'api.github.com',
  'openlibrary.org',
  'covers.openlibrary.org',
  'api.gdeltproject.org',
  'commons.wikimedia.org',
]);

function isSafeUpstreamUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    return parsed.protocol === 'https:' &&
      parsed.username === '' && parsed.password === '' &&
      (parsed.port === '' || parsed.port === '443') &&
      ALLOWED_UPSTREAM_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Safe fetch wrapper with timeout and SSRF check
async function safeFetchJson(url: string, timeoutMs: number = 4500, headers: Record<string, string> = {}): Promise<any> {
  if (!isSafeUpstreamUrl(url)) {
    throw new Error('Blocked: URL failed security and SSRF validation');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'error',
      headers: {
        'User-Agent': 'OrbitSearch/4.0 (Federated Search; +https://orbitsearch.io)',
        Accept: 'application/json, text/plain, */*',
        ...headers,
      },
    });
    if (!res.ok) {
      throw new Error(`Upstream returned HTTP ${res.status}`);
    }
    const body = await res.text();
    clearTimeout(timer);
    if (body.length > 2_000_000) throw new Error('Upstream response exceeded the 2 MB limit');
    return JSON.parse(body);
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

async function safeFetchText(url: string, timeoutMs: number = 4500, headers: Record<string, string> = {}): Promise<string> {
  if (!isSafeUpstreamUrl(url)) {
    throw new Error('Blocked: URL failed security and SSRF validation');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'error',
      headers: {
        'User-Agent': 'OrbitSearch/4.0 (Federated Search)',
        ...headers,
      },
    });
    if (!res.ok) throw new Error(`Upstream returned HTTP ${res.status}`);
    const body = await res.text();
    clearTimeout(timer);
    if (body.length > 2_000_000) throw new Error('Upstream response exceeded the 2 MB limit');
    return body;
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

// --- Circuit Breaker & Telemetry State ---
interface ProviderHealth {
  name: string;
  category: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  totalCalls: number;
  successCalls: number;
  averageLatencyMs: number;
}

const providers: Record<string, ProviderHealth> = {
  wikipedia: { name: 'Wikipedia Open Knowledge', category: 'knowledge', state: 'closed', failureCount: 0, lastFailureTime: 0, totalCalls: 0, successCalls: 0, averageLatencyMs: 140 },
  arxiv: { name: 'arXiv Research Archive', category: 'research', state: 'closed', failureCount: 0, lastFailureTime: 0, totalCalls: 0, successCalls: 0, averageLatencyMs: 320 },
  github: { name: 'GitHub Code Repositories', category: 'code', state: 'closed', failureCount: 0, lastFailureTime: 0, totalCalls: 0, successCalls: 0, averageLatencyMs: 250 },
  openlibrary: { name: 'Open Library Catalog', category: 'books', state: 'closed', failureCount: 0, lastFailureTime: 0, totalCalls: 0, successCalls: 0, averageLatencyMs: 280 },
  gdelt: { name: 'GDELT Global News Wire', category: 'news', state: 'closed', failureCount: 0, lastFailureTime: 0, totalCalls: 0, successCalls: 0, averageLatencyMs: 390 },
  commons: { name: 'Wikimedia Commons Media', category: 'images', state: 'closed', failureCount: 0, lastFailureTime: 0, totalCalls: 0, successCalls: 0, averageLatencyMs: 210 },
};

function recordProviderSuccess(id: string, latencyMs: number) {
  const p = providers[id];
  if (!p) return;
  p.totalCalls++;
  p.successCalls++;
  p.failureCount = 0;
  p.state = 'closed';
  p.averageLatencyMs = Math.round((p.averageLatencyMs * 0.8) + (latencyMs * 0.2));
}

function recordProviderFailure(id: string) {
  const p = providers[id];
  if (!p) return;
  p.totalCalls++;
  p.failureCount++;
  p.lastFailureTime = Date.now();
  if (p.failureCount >= 3) {
    p.state = 'open'; // open circuit
  }
}

function isProviderAvailable(id: string): boolean {
  const p = providers[id];
  if (!p) return false;
  if (p.state === 'open') {
    // Check if 30s cool-off has elapsed
    if (Date.now() - p.lastFailureTime > 30000) {
      p.state = 'half-open';
      return true;
    }
    return false;
  }
  return true;
}

// --- In-Memory Bounded TTL Cache ---
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const searchCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 500;

function getFromCache(key: string): any | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function setInCache(key: string, data: any, ttlSec: number = 60) {
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entry
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, { data, expiresAt: Date.now() + (ttlSec * 1000) });
}

// --- Rate Limiting & API Keys ---
interface RateBucket {
  tokens: number;
  lastRefill: number;
}
const ipBuckets = new Map<string, RateBucket>();
const keyBuckets = new Map<string, RateBucket>();

function checkRateLimit(id: string, map: Map<string, RateBucket>, maxTokens: number = 60, refillPerSec: number = 1): boolean {
  const now = Date.now();
  let bucket = map.get(id);
  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now };
    map.set(id, bucket);
  } else {
    const elapsedSec = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(maxTokens, bucket.tokens + (elapsedSec * refillPerSec));
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}

// In-Memory store for registered API keys (hashed)
interface ApiKeyRecord {
  id: string;
  keyPrefix: string;
  keyHash: string;
  name: string;
  userId: string;
  plan: 'free' | 'starter' | 'pro' | 'business';
  quotaMonthly: number;
  usedMonthly: number;
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsedAt?: string;
}

const apiKeysStore = new Map<string, ApiKeyRecord>();
const dataDirectory = path.resolve(process.env.ORBIT_DATA_DIR || path.join(__dirname, 'data'));
const apiKeyStorePath = path.join(dataDirectory, 'api-keys.json');

function loadApiKeys(): void {
  try {
    const records = JSON.parse(fs.readFileSync(apiKeyStorePath, 'utf8')) as ApiKeyRecord[];
    for (const record of records) {
      if (record && typeof record.keyHash === 'string' && typeof record.id === 'string') {
        apiKeysStore.set(record.keyHash, record);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[Orbit Search] API key store could not be loaded; starting with an empty key store.');
    }
  }
}

function persistApiKeys(): void {
  fs.mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  const tempPath = `${apiKeyStorePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(Array.from(apiKeysStore.values()), null, 2), { mode: 0o600 });
  fs.renameSync(tempPath, apiKeyStorePath);
}

loadApiKeys();

function hashKey(plain: string): string {
  return crypto.createHash('sha256').update(plain.trim()).digest('hex');
}

// --- Search Normalization & Providers ---
export interface SearchItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  category: 'web' | 'research' | 'code' | 'news' | 'books' | 'images' | 'knowledge';
  stars?: number;
  published?: string;
  author?: string;
  imageUrl?: string;
  relevanceScore: number;
}

async function queryWikipedia(q: string, limit: number): Promise<SearchItem[]> {
  const start = Date.now();
  try {
    const url = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=${limit}`;
    const data = await safeFetchJson(url, 4000);
    recordProviderSuccess('wikipedia', Date.now() - start);

    const pages = data.pages || [];
    return pages.map((p: any, idx: number) => ({
      id: `wiki_${p.id || idx}_${p.key}`,
      title: p.title || 'Wikipedia article',
      url: p.key ? `https://en.wikipedia.org/wiki/${encodeURIComponent(p.key.replace(/\s+/g, '_'))}` : 'https://en.wikipedia.org/',
      snippet: (p.excerpt || p.description || 'Encyclopedia reference overview.').replace(/<[^>]+>/g, ''),
      source: 'Wikipedia',
      category: 'knowledge' as const,
      relevanceScore: 92 - idx,
    }));
  } catch (err) {
    recordProviderFailure('wikipedia');
    return [];
  }
}

async function queryArxiv(q: string, limit: number): Promise<SearchItem[]> {
  const start = Date.now();
  try {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&start=0&max_results=${limit}&sortBy=relevance`;
    const xml = await safeFetchText(url, 4500);
    recordProviderSuccess('arxiv', Date.now() - start);

    const items: SearchItem[] = [];
    const entries = xml.split('<entry>').slice(1);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
      const authorMatch = entry.match(/<author>\s*<name>([\s\S]*?)<\/name>/);

      const title = (titleMatch ? titleMatch[1] : 'Research Paper').replace(/\s+/g, ' ').trim();
      const snippet = (summaryMatch ? summaryMatch[1] : '').replace(/\s+/g, ' ').slice(0, 240).trim() + '...';
      const rawId = idMatch ? idMatch[1].trim() : '';
      const published = publishedMatch ? publishedMatch[1].slice(0, 10) : '';
      const author = authorMatch ? authorMatch[1].trim() : '';

      items.push({
        id: `arxiv_${i}_${encodeURIComponent(rawId)}`,
        title,
        url: rawId || 'https://arxiv.org',
        snippet,
        source: 'arXiv Research',
        category: 'research' as const,
        published,
        author,
        relevanceScore: 90 - i,
      });
    }
    return items;
  } catch (err) {
    recordProviderFailure('arxiv');
    return [];
  }
}

async function queryGitHub(q: string, limit: number): Promise<SearchItem[]> {
  const start = Date.now();
  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${limit}`;
    const data = await safeFetchJson(url, 4000);
    recordProviderSuccess('github', Date.now() - start);

    const items = data.items || [];
    return items.map((repo: any, idx: number) => ({
      id: `gh_${repo.id}`,
      title: repo.full_name || repo.name,
      url: repo.html_url,
      snippet: repo.description || 'Public open-source repository on GitHub.',
      source: 'GitHub',
      category: 'code' as const,
      stars: repo.stargazers_count,
      author: repo.owner?.login,
      relevanceScore: 88 - idx,
    }));
  } catch (err) {
    recordProviderFailure('github');
    return [];
  }
}

async function queryOpenLibrary(q: string, limit: number): Promise<SearchItem[]> {
  const start = Date.now();
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limit}`;
    const data = await safeFetchJson(url, 4000);
    recordProviderSuccess('openlibrary', Date.now() - start);

    const docs = data.docs || [];
    return docs.map((doc: any, idx: number) => {
      const authors = (doc.author_name || []).slice(0, 2).join(', ');
      return {
        id: `ol_${doc.key || idx}`,
        title: doc.title || 'Book record',
        url: doc.key ? `https://openlibrary.org${doc.key}` : 'https://openlibrary.org',
        snippet: `First published in ${doc.first_publish_year || 'N/A'}${authors ? ` · By ${authors}` : ''}. Includes editions in Open Library archives.`,
        source: 'Open Library',
        category: 'books' as const,
        author: authors,
        published: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
        imageUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
        relevanceScore: 82 - idx,
      };
    });
  } catch (err) {
    recordProviderFailure('openlibrary');
    return [];
  }
}

async function queryGDELTNews(q: string, limit: number): Promise<SearchItem[]> {
  const start = Date.now();
  try {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&format=json&maxrecords=${limit}&sort=HybridRel`;
    const data = await safeFetchJson(url, 4000);
    recordProviderSuccess('gdelt', Date.now() - start);

    const articles = data.articles || [];
    return articles.map((art: any, idx: number) => ({
      id: `gdelt_${idx}_${encodeURIComponent(art.url || '')}`,
      title: art.title || art.url,
      url: art.url,
      snippet: `Reported by ${art.domain || 'news source'}${art.seendate ? ` on ${art.seendate.slice(0, 8)}` : ''}. Global event news wire index.`,
      source: `GDELT (${art.domain || 'Wire'})`,
      category: 'news' as const,
      published: art.seendate ? `${art.seendate.slice(0, 4)}-${art.seendate.slice(4, 6)}-${art.seendate.slice(6, 8)}` : undefined,
      relevanceScore: 85 - idx,
    }));
  } catch (err) {
    recordProviderFailure('gdelt');
    return [];
  }
}

async function queryCommonsImages(q: string, limit: number): Promise<SearchItem[]> {
  const start = Date.now();
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=360&format=json&origin=*`;
    const data = await safeFetchJson(url, 4000);
    recordProviderSuccess('commons', Date.now() - start);

    const pages = Object.values(data.query?.pages || {}) as any[];
    return pages.map((p, idx) => {
      const info = (p.imageinfo || [])[0] || {};
      return {
        id: `img_${p.pageid || idx}`,
        title: (p.title || 'Commons Media').replace(/^File:/i, ''),
        url: info.descriptionurl || 'https://commons.wikimedia.org',
        snippet: info.extmetadata?.LicenseShortName?.value ? `License: ${info.extmetadata.LicenseShortName.value}` : 'Public domain / CC licensed media on Wikimedia Commons.',
        source: 'Wikimedia Commons',
        category: 'images' as const,
        imageUrl: info.thumburl || info.url,
        relevanceScore: 78 - idx,
      };
    });
  } catch (err) {
    recordProviderFailure('commons');
    return [];
  }
}

// Master federated search orchestrator
async function federatedSearch(q: string, category: string = 'all', limit: number = 10): Promise<{
  results: SearchItem[];
  tookMs: number;
  sourcesQueried: string[];
  sourcesSucceeded: string[];
  totalCount: number;
}> {
  const startTime = Date.now();
  const normalizedQuery = q.trim().slice(0, 280);
  if (!normalizedQuery) {
    return { results: [], tookMs: 0, sourcesQueried: [], sourcesSucceeded: [], totalCount: 0 };
  }

  const cacheKey = `search:${category}:${limit}:${normalizedQuery.toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return { ...cached, tookMs: Date.now() - startTime };
  }

  const tasks: { id: string; run: () => Promise<SearchItem[]> }[] = [];

  if (category === 'all' || category === 'knowledge') {
    if (isProviderAvailable('wikipedia')) tasks.push({ id: 'wikipedia', run: () => queryWikipedia(normalizedQuery, limit) });
  }
  if (category === 'all' || category === 'research') {
    if (isProviderAvailable('arxiv')) tasks.push({ id: 'arxiv', run: () => queryArxiv(normalizedQuery, limit) });
  }
  if (category === 'all' || category === 'code') {
    if (isProviderAvailable('github')) tasks.push({ id: 'github', run: () => queryGitHub(normalizedQuery, limit) });
  }
  if (category === 'all' || category === 'books') {
    if (isProviderAvailable('openlibrary')) tasks.push({ id: 'openlibrary', run: () => queryOpenLibrary(normalizedQuery, limit) });
  }
  if (category === 'all' || category === 'news') {
    if (isProviderAvailable('gdelt')) tasks.push({ id: 'gdelt', run: () => queryGDELTNews(normalizedQuery, limit) });
  }
  if (category === 'all' || category === 'images') {
    if (isProviderAvailable('commons')) tasks.push({ id: 'commons', run: () => queryCommonsImages(normalizedQuery, limit) });
  }

  const sourcesQueried = tasks.map(t => t.id);
  const settled = await Promise.allSettled(tasks.map(t => t.run()));

  const allItems: SearchItem[] = [];
  const sourcesSucceeded: string[] = [];

  settled.forEach((res, idx) => {
    const srcId = tasks[idx].id;
    if (res.status === 'fulfilled' && res.value.length > 0) {
      sourcesSucceeded.push(srcId);
      allItems.push(...res.value);
    }
  });

  // Deduplicate by URL
  const seenUrls = new Set<string>();
  const uniqueItems: SearchItem[] = [];
  for (const item of allItems) {
    if (!item.url || seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    uniqueItems.push(item);
  }

  // Sort by relevance score
  uniqueItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const payload = {
    results: uniqueItems,
    tookMs: Date.now() - startTime,
    sourcesQueried,
    sourcesSucceeded,
    totalCount: uniqueItems.length,
  };

  setInCache(cacheKey, payload, 45); // 45 seconds TTL
  return payload;
}

// Generate grounded AI source digest
function generateSourceDigest(q: string, items: SearchItem[]): string {
  if (!items || items.length === 0) {
    return `No verified public sources were returned for "${q}". Try broadening your search query or selecting a different domain category.`;
  }
  const topSources = items.slice(0, 4);
  const sourceBullets = topSources
    .map((s, idx) => `[${idx + 1}] "${s.title}" (${s.source}): ${s.snippet.replace(/\n+/g, ' ')}`)
    .join('\n\n');

  return `### Grounded Synthesis for "${q}"\n\nBased on cross-provider indexing across ${topSources.map(s => s.source).join(', ')}:\n\n${sourceBullets}\n\n*Note:* This is a formatting aid, not an AI-generated answer or independent verification. Open the original sources to check the claims.`;
}

// --- Main Server Function ---
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const allowedOrigins = (process.env.ORBIT_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: false,
  }));
  app.use(express.json({ limit: '256kb', strict: true }));

  // Request ID & security headers middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Request-Id', crypto.randomUUID());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    next();
  });

  // Global IP rate-limiter
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      // Do not trust X-Forwarded-For unless a trusted reverse proxy is configured.
      const clientIp = req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp, ipBuckets, 120, 2)) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please wait a moment before trying again.',
        });
        return;
      }
    }
    next();
  });

  // Admin APIs stay disabled unless an operator explicitly configures a strong token.
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const expected = process.env.ORBIT_ADMIN_TOKEN || '';
    if (expected.length < 32) {
      res.status(503).json({ error: 'Admin API disabled', message: 'Configure ORBIT_ADMIN_TOKEN with a random secret of at least 32 characters.' });
      return;
    }
    const match = req.headers.authorization?.match(/^Bearer (.+)$/);
    const supplied = match?.[1] || '';
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    if (expectedBuffer.length !== suppliedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      res.status(401).json({ error: 'Unauthorized', message: 'Admin authentication required.' });
      return;
    }
    next();
  };
  app.use('/api/v1/keys', requireAdmin);

  // --- API Routes ---

  // Health check
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
      status: 'operational',
      version: '4.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      providersCount: Object.keys(providers).length,
    });
  });

  // Provider status & diagnostics
  app.get('/api/v1/providers', (_req: Request, res: Response) => {
    res.json({
      providers: Object.entries(providers).map(([id, info]) => ({
        id,
        ...info,
      })),
      cacheEntries: searchCache.size,
      maxCacheEntries: MAX_CACHE_ENTRIES,
    });
  });

  // Federated search endpoint
  app.get('/api/v1/search', async (req: Request, res: Response) => {
    const q = (typeof req.query.q === 'string' ? req.query.q : '').trim();
    const category = (typeof req.query.category === 'string' ? req.query.category : 'all').toLowerCase();
    const allowedCategories = new Set(['all', 'knowledge', 'research', 'code', 'books', 'news', 'images']);
    const requestedLimit = Number(req.query.limit ?? 12);
    if (!q || q.length > 280) {
      res.status(400).json({ error: 'Invalid query', message: 'q is required and must be 1–280 characters.' });
      return;
    }
    if (!allowedCategories.has(category)) {
      res.status(400).json({ error: 'Invalid category', allowedCategories: Array.from(allowedCategories) });
      return;
    }
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 30) {
      res.status(400).json({ error: 'Invalid limit', message: 'limit must be an integer from 1 to 30.' });
      return;
    }
    const limit = requestedLimit;

    // Optional API key authorization check for developer quotas
    const authHeader = req.headers.authorization;
    let apiKeyRecord: ApiKeyRecord | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const h = hashKey(token);
      apiKeyRecord = apiKeysStore.get(h) || null;
      if (!apiKeyRecord || apiKeyRecord.status !== 'active') {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid or revoked API key' });
        return;
      }
      if (apiKeyRecord.usedMonthly >= apiKeyRecord.quotaMonthly) {
        res.status(429).json({ error: 'Quota Exceeded', message: `Monthly limit of ${apiKeyRecord.quotaMonthly} requests reached for this key.` });
        return;
      }
      // Atomic usage increment
      apiKeyRecord.usedMonthly++;
      apiKeyRecord.lastUsedAt = new Date().toISOString();
      persistApiKeys();
    }

    try {
      const data = await federatedSearch(q, category, limit);
      res.json({
        query: q,
        category,
        count: data.totalCount,
        tookMs: data.tookMs,
        sourcesQueried: data.sourcesQueried,
        sourcesSucceeded: data.sourcesSucceeded,
        results: data.results,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Search failed', message: err?.message || 'Internal federated search error' });
    }
  });

  // Autocomplete suggestions
  app.get('/api/v1/suggest', async (req: Request, res: Response) => {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      res.json({ query: q, suggestions: [] });
      return;
    }

    try {
      const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=7&namespace=0&format=json`;
      const data = await safeFetchJson(url, 2500);
      const suggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
      res.json({ query: q, suggestions });
    } catch {
      res.json({ query: q, suggestions: [] });
    }
  });

  // AI Answer synthesis
  app.post('/api/v1/ai/answer', async (req: Request, res: Response) => {
    const { question, items } = req.body;
    if (!question) {
      res.status(400).json({ error: 'Missing question in request body' });
      return;
    }
    if (typeof question !== 'string' || question.length > 1000 || !Array.isArray(items) || items.length > 100) {
      res.status(400).json({ error: 'Invalid request', message: 'question must be a string up to 1000 characters and items must be an array of at most 100 results.' });
      return;
    }
    const safeItems = items.filter((item: any) => item && typeof item.title === 'string' && typeof item.snippet === 'string' && typeof item.source === 'string').slice(0, 100);
    const digest = generateSourceDigest(question, safeItems);
    res.json({
      question,
      answer: digest,
      model: 'source-digest-template',
      isAiGenerated: false,
      sourcesUsed: safeItems.slice(0, 4).length,
      note: 'This is an extractive source digest, not an AI-generated answer. Verify claims against the linked sources.',
    });
  });

  // Developer API Key Creation & Management
  app.get('/api/v1/keys', (_req: Request, res: Response) => {
    const keys = Array.from(apiKeysStore.values()).map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      plan: k.plan,
      quotaMonthly: k.quotaMonthly,
      usedMonthly: k.usedMonthly,
      status: k.status,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));
    res.json({ keys });
  });

  app.post('/api/v1/keys', (req: Request, res: Response) => {
    const { name, plan } = req.body;
    const randomHex = crypto.randomBytes(16).toString('hex');
    const plainKey = `orb_live_${randomHex}`;
    const h = hashKey(plainKey);

    const planLimits: Record<string, number> = {
      free: 1000,
      starter: 10000,
      pro: 50000,
      business: 200000,
    };

    const targetPlan = (plan in planLimits) ? plan : 'free';

    const record: ApiKeyRecord = {
      id: `key_${crypto.randomUUID().slice(0, 8)}`,
      keyPrefix: `orb_live_${randomHex.slice(0, 6)}...`,
      keyHash: h,
      name: name || 'New Search Key',
      userId: 'usr_default',
      plan: targetPlan,
      quotaMonthly: planLimits[targetPlan],
      usedMonthly: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    apiKeysStore.set(h, record);
    persistApiKeys();

    // Show plain key ONLY once upon creation!
    res.status(201).json({
      key: {
        id: record.id,
        name: record.name,
        keyPrefix: record.keyPrefix,
        plan: record.plan,
        quotaMonthly: record.quotaMonthly,
        usedMonthly: record.usedMonthly,
        status: record.status,
      },
      secretPlainKey: plainKey,
      warning: 'Please copy your API key now. You will not be able to see it again.',
    });
  });

  app.delete('/api/v1/keys/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    let found = false;
    for (const [hash, record] of apiKeysStore.entries()) {
      if (record.id === id) {
        record.status = 'revoked';
        persistApiKeys();
        found = true;
        break;
      }
    }
    if (found) {
      res.json({ success: true, message: 'API key revoked' });
    } else {
      res.status(404).json({ error: 'Key not found' });
    }
  });

  // Billing is intentionally unavailable until a real provider, signature verification,
  // persistent order state, and idempotency handling have been configured.
  app.post('/api/v1/billing/checkout', (_req: Request, res: Response) => {
    res.status(503).json({ error: 'Billing unavailable', message: 'Real payment processing is not configured. No payment has been taken.' });
  });

  app.post('/api/v1/billing/webhook', (_req: Request, res: Response) => {
    res.status(503).json({ error: 'Billing webhook unavailable', message: 'Webhook verification is not configured; events are not accepted.' });
  });

  // This build federates live provider queries; it does not maintain a local web index.
  // Return null rather than fabricated crawl/index statistics.
  app.get('/api/stats', (_req: Request, res: Response) => {
    res.json({
      indexed_pages: null,
      indexed_domains: null,
      seed_urls: null,
      last_indexed_at: null,
      stats_available: false,
      active_providers: Object.keys(providers).length,
    });
  });

  // Mount Vite or Static Dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Orbit Search] Unified platform listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Orbit Search] Failed to start server:', err);
  process.exit(1);
});
