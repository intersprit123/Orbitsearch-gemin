export type SearchCategory = 'all' | 'research' | 'code' | 'knowledge' | 'news' | 'books' | 'images';

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  category: SearchCategory;
  stars?: number;
  published?: string;
  author?: string;
  imageUrl?: string;
  relevanceScore: number;
}

export interface SearchResponse {
  query: string;
  category: string;
  count: number;
  tookMs: number;
  sourcesQueried: string[];
  sourcesSucceeded: string[];
  results: SearchResultItem[];
}

export interface ProviderHealth {
  id: string;
  name: string;
  category: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  totalCalls: number;
  successCalls: number;
  averageLatencyMs: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  plan: 'free' | 'starter' | 'pro' | 'business';
  quotaMonthly: number;
  usedMonthly: number;
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsedAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'business';
  monthlyQuota: number;
  monthlyUsed: number;
  billingCycleEnd: string;
}
