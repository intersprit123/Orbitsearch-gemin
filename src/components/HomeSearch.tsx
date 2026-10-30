import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, BookOpen, Code2, Globe2, Newspaper, ArrowRight, ShieldCheck, Zap, Server, Database } from 'lucide-react';
import { SearchCategory } from '../types';

interface HomeSearchProps {
  onSearch: (query: string, category: SearchCategory) => void;
  onSelectCategory: (category: SearchCategory) => void;
  selectedCategory: SearchCategory;
}

const CATEGORIES: { id: SearchCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'All Sources', icon: Sparkles },
  { id: 'research', label: 'Research & Papers', icon: BookOpen },
  { id: 'code', label: 'Code & Repos', icon: Code2 },
  { id: 'knowledge', label: 'Knowledge Base', icon: Globe2 },
  { id: 'news', label: 'Global News', icon: Newspaper },
];

const SUGGESTED_QUERIES = [
  'Quantum error correction algorithms',
  'Autonomous multi-agent orchestration',
  'FastAPI vs Express performance benchmarks',
  'CRISPR CAS9 genomic editing therapies',
  'Large language model reasoning benchmarks',
];

export const HomeSearch: React.FC<HomeSearchProps> = ({
  onSearch,
  onSelectCategory,
  selectedCategory,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live autocomplete
  useEffect(() => {
    if (inputVal.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/suggest?q=${encodeURIComponent(inputVal.trim())}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [inputVal]);

  // Click outside to hide suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setShowSuggestions(false);
      onSearch(inputVal.trim(), selectedCategory);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputVal(text);
    setShowSuggestions(false);
    onSearch(text, selectedCategory);
  };

  return (
    <div className="relative overflow-hidden py-12 sm:py-20">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-40 right-10 -z-10 h-[400px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-medium text-sky-400 mb-6 backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5" />
          <span>Next-Generation Federated Search Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl font-heading leading-tight">
          Search the open web.<br />
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Without corporate bias or tracking.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
          Query arXiv, GitHub, Wikipedia, GDELT, and Open Library simultaneously. High-fidelity results, relevance re-ranking, and open developer REST APIs.
        </p>

        {/* Omnibar Container */}
        <div ref={containerRef} className="relative mx-auto mt-8 max-w-3xl">
          {/* Domain tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                      : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input Box */}
          <form
            onSubmit={handleSubmit}
            className="group relative flex items-center rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2 shadow-2xl shadow-black/80 transition-all focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/20"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-400 group-focus-within:text-sky-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search papers, code repos, global knowledge, or news..."
              className="h-12 w-full bg-transparent px-2 text-base text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:brightness-110 active:scale-95"
            >
              <span>Search</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95 py-2 text-left shadow-2xl backdrop-blur-md">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Live Query Suggestions
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(item)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Popular queries:</span>
          {SUGGESTED_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputVal(q);
                onSearch(q, selectedCategory);
              }}
              className="rounded-md border border-slate-800 bg-slate-900/40 px-2 py-1 text-slate-400 hover:border-slate-700 hover:text-sky-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-white">Zero Surveillance</h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              No behavioral tracking, search history profiling, or ad targeting. Queries are executed with zero personal logging.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-3">
              <Server className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-white">Concurrent Federation</h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Simultaneous queries dispatched to 6 independent authoritative sources with sub-400ms aggregation and circuit breakers.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-3">
              <Code2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-white">Open Developer API</h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Standard REST endpoints, predictable token-bucket rate limits, cURL/SDK compatibility, and enterprise webhook triggers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
