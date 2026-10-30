import React, { useState } from 'react';
import { Search, ExternalLink, Sparkles, Star, Calendar, User, BookOpen, Code2, Globe2, Newspaper, ChevronRight, Copy, Check, Filter } from 'lucide-react';
import { SearchResultItem, SearchCategory } from '../types';

interface SearchResultsProps {
  query: string;
  category: SearchCategory;
  results: SearchResultItem[];
  isLoading: boolean;
  tookMs: number;
  sourcesQueried: string[];
  sourcesSucceeded: string[];
  aiDigest: string | null;
  onSearch: (q: string, cat: SearchCategory) => void;
}

const CATEGORY_TABS: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'research', label: 'Research' },
  { id: 'code', label: 'Code' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'news', label: 'News' },
  { id: 'books', label: 'Books' },
  { id: 'images', label: 'Media' },
];

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  category,
  results,
  isLoading,
  tookMs,
  sourcesQueried,
  sourcesSucceeded,
  aiDigest,
  onSearch,
}) => {
  const [searchInput, setSearchInput] = useState(query);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAiAnswer, setShowAiAnswer] = useState(true);
  const pageSize = 8;

  // Filter results client-side if a specific category was chosen
  const filtered = category === 'all'
    ? results
    : results.filter(r => r.category === category);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCurrentPage(1);
      onSearch(searchInput.trim(), category);
    }
  };

  const handleCategorySwitch = (cat: SearchCategory) => {
    setCurrentPage(1);
    onSearch(query, cat);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Search Refinement Header */}
      <div className="border-b border-slate-800 pb-5">
        <form onSubmit={handleRefineSubmit} className="relative flex max-w-3xl items-center">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Refine your search..."
            className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-11 pr-24 text-sm text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 h-8 rounded-lg bg-sky-500 px-4 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
          >
            Search
          </button>
        </form>

        {/* Category Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1">
          {CATEGORY_TABS.map((tab) => {
            const count = tab.id === 'all' ? results.length : results.filter(r => r.category === tab.id).length;
            const isActive = category === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleCategorySwitch(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {results.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-500">
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Query Telemetry Meta */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
          <div>
            Found <span className="font-mono text-slate-300 font-medium">{filtered.length}</span> results in{' '}
            <span className="font-mono text-slate-300 font-medium">{tookMs}ms</span>
            {sourcesSucceeded.length > 0 && (
              <span className="hidden sm:inline">
                {' '}via {sourcesSucceeded.map(s => s.toUpperCase()).join(', ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">Federation Active</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Result Stream */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Grounded Synthesis Digest */}
          {aiDigest && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-5 shadow-lg shadow-sky-950/40">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-3 mb-3">
                <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
                  <Sparkles className="h-4 w-4" />
                  <span>Orbit Grounded Synthesis</span>
                </div>
                <button
                  onClick={() => setShowAiAnswer(!showAiAnswer)}
                  className="text-xs text-sky-400/80 hover:text-sky-300 transition-colors"
                >
                  {showAiAnswer ? 'Collapse' : 'Expand'}
                </button>
              </div>
              {showAiAnswer && (
                <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                  {aiDigest}
                </div>
              )}
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="h-4 w-1/3 bg-slate-800 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-800/70 rounded"></div>
                  <div className="h-3 w-1/2 bg-slate-800/50 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-white">No results found for “{query}”</h3>
              <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                No matching verified sources were returned. Try checking for spelling errors, using more general search terms, or querying another domain category.
              </p>
            </div>
          )}

          {/* Result Cards */}
          {!isLoading && paginated.map((item) => (
            <article
              key={item.id}
              className="group rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-black/40"
            >
              {/* Source & Clean Metadata row */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sky-400">{item.source}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="truncate max-w-[280px] font-mono text-[11px] text-slate-500">
                    {item.url.replace(/^https?:\/\//, '').split('/')[0]}
                  </span>
                  {item.published && (
                    <>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-500">{item.published}</span>
                    </>
                  )}
                  {item.stars !== undefined && (
                    <>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{item.stars.toLocaleString()}</span>
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleCopyLink(item.id, item.url)}
                  title="Copy link"
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Title */}
              <h2 className="text-base font-semibold leading-snug">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:text-sky-200 hover:underline flex items-baseline gap-1.5"
                >
                  <span>{item.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                </a>
              </h2>

              {/* Snippet with optional thumbnail */}
              <div className="mt-2 flex gap-4">
                {item.imageUrl && (
                  <div className="shrink-0 overflow-hidden rounded-lg border border-slate-800 w-24 h-24 bg-slate-950">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                  {item.snippet}
                </p>
              </div>

              {/* Extra author details if present */}
              {item.author && (
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <User className="h-3 w-3 text-slate-600" />
                  <span>Author: {item.author}</span>
                </div>
              )}
            </article>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
              <span className="text-slate-400">
                Page <span className="font-mono text-white font-medium">{currentPage}</span> of{' '}
                <span className="font-mono text-white font-medium">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300 disabled:opacity-40 hover:border-slate-700"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300 disabled:opacity-40 hover:border-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info & Telemetry */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Federation Engine
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Query Latency</span>
                <span className="font-mono text-slate-200">{tookMs} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Deduplicated Items</span>
                <span className="font-mono text-slate-200">{filtered.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Upstream Protocol</span>
                <span className="font-mono text-sky-400">REST + Atom XML</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Tracking Profile</span>
                <span className="font-mono text-emerald-400">None (Isolated)</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Developer Access
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automate this exact federated search query in your applications using the Orbit Search Developer API.
            </p>
            <div className="mt-3 rounded bg-slate-950 p-2 font-mono text-[11px] text-sky-300 overflow-x-auto border border-slate-800">
              <code>curl -H "Authorization: Bearer YOUR_KEY" "http://localhost:3000/api/v1/search?q={encodeURIComponent(query)}"</code>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
