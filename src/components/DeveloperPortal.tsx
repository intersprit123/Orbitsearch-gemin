import React, { useState } from 'react';
import { Code2, Play, Terminal, Key, ShieldCheck, Copy, Check, ExternalLink, Zap } from 'lucide-react';

interface DeveloperPortalProps {
  apiKey?: string;
  onNavigateToDashboard: () => void;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({
  apiKey = 'orb_live_demo_enterprise_99x',
  onNavigateToDashboard,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [playgroundQuery, setPlaygroundQuery] = useState('quantum computing');
  const [playgroundCategory, setPlaygroundCategory] = useState('all');
  const [playgroundKey, setPlaygroundKey] = useState(apiKey);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);
  const [playgroundLatency, setPlaygroundLatency] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const executePlaygroundRequest = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    const start = performance.now();
    try {
      const headers: Record<string, string> = {};
      if (playgroundKey.trim()) {
        headers['Authorization'] = `Bearer ${playgroundKey.trim()}`;
      }
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(playgroundQuery)}&category=${playgroundCategory}&limit=5`, {
        headers,
      });
      const data = await res.json();
      setPlaygroundLatency(Math.round(performance.now() - start));
      setPlaygroundResponse({ status: res.status, ok: res.ok, body: data });
    } catch (err: any) {
      setPlaygroundLatency(Math.round(performance.now() - start));
      setPlaygroundResponse({ status: 500, ok: false, error: err.message });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const getCodeSnippet = () => {
    if (selectedLanguage === 'curl') {
      return `curl -X GET \\
  "https://api.orbitsearch.io/api/v1/search?q=${encodeURIComponent(playgroundQuery)}&category=${playgroundCategory}&limit=10" \\
  -H "Authorization: Bearer ${playgroundKey}" \\
  -H "Accept: application/json"`;
    }
    if (selectedLanguage === 'javascript') {
      return `const response = await fetch("https://api.orbitsearch.io/api/v1/search?q=${encodeURIComponent(playgroundQuery)}&category=${playgroundCategory}", {
  headers: {
    "Authorization": "Bearer ${playgroundKey}",
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log("Found", data.count, "federated results in", data.tookMs, "ms");`;
    }
    return `import requests

url = "https://api.orbitsearch.io/api/v1/search"
params = {
    "q": "${playgroundQuery}",
    "category": "${playgroundCategory}",
    "limit": 10
}
headers = {
    "Authorization": "Bearer ${playgroundKey}",
    "Accept": "application/json"
}

response = requests.get(url, params=params, headers=headers)
data = response.json()
print(f"Results: {data['count']} items in {data['tookMs']}ms")`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Terminal className="h-4 w-4" />
          <span>Developer Ecosystem & REST API</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight sm:text-4xl">
          Orbit Search API Reference
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
          Embed low-latency, ad-free federated search across Wikipedia, arXiv, GitHub, GDELT, and Open Library into your applications and AI agent workflows.
        </p>
      </div>

      {/* Interactive API Playground */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Play className="h-4 w-4 fill-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Live API Console & Tester</h2>
          </div>
          <button
            onClick={onNavigateToDashboard}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Manage Your API Keys &rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Controls column */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                API Key (Bearer Token)
              </label>
              <input
                type="text"
                value={playgroundKey}
                onChange={(e) => setPlaygroundKey(e.target.value)}
                placeholder="orb_live_..."
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-sky-300 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Pre-loaded with active test key.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Search Query (`q`)
              </label>
              <input
                type="text"
                value={playgroundQuery}
                onChange={(e) => setPlaygroundQuery(e.target.value)}
                placeholder="e.g. distributed systems"
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Domain Category (`category`)
              </label>
              <select
                value={playgroundCategory}
                onChange={(e) => setPlaygroundCategory(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Federated Sources</option>
                <option value="research">arXiv Research Papers</option>
                <option value="code">GitHub Code Repositories</option>
                <option value="knowledge">Wikipedia Knowledge</option>
                <option value="news">GDELT Global News</option>
                <option value="books">Open Library Books</option>
                <option value="images">Wikimedia Commons Media</option>
              </select>
            </div>

            <button
              onClick={executePlaygroundRequest}
              disabled={playgroundLoading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {playgroundLoading ? (
                <span>Dispatching Federated Query...</span>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Send Live Request</span>
                </>
              )}
            </button>
          </div>

          {/* Response Inspector */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-t-lg border-t border-x border-slate-800 text-xs">
              <span className="font-mono text-slate-400">Response Payload</span>
              {playgroundLatency !== null && (
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[11px] font-semibold ${playgroundResponse?.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                    HTTP {playgroundResponse?.status || 200}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-[11px] text-slate-400">{playgroundLatency}ms</span>
                </div>
              )}
            </div>
            <pre className="h-72 w-full overflow-auto rounded-b-lg border border-slate-800 bg-slate-950/90 p-3 font-mono text-[11px] text-slate-300 leading-relaxed">
              {playgroundResponse
                ? JSON.stringify(playgroundResponse.body || playgroundResponse, null, 2)
                : '// Click "Send Live Request" above to test the REST API live'}
            </pre>
          </div>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-heading">Quickstart Implementation</h2>
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            {(['curl', 'javascript', 'python'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  selectedLanguage === lang
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-sky-200 overflow-x-auto">
          <button
            onClick={handleCopyCode}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
          <pre className="pr-16 leading-relaxed">{getCodeSnippet()}</pre>
        </div>
      </div>

      {/* REST Endpoints Catalog */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white font-heading">API Endpoints</h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="rounded bg-sky-500/10 px-2 py-0.5 font-mono text-xs font-bold text-sky-400 border border-sky-500/20">
                GET
              </span>
              <code className="text-xs font-semibold text-white">/api/v1/search</code>
              <span className="text-xs text-slate-500">· Unified multi-domain federated search</span>
            </div>
            <p className="text-xs text-slate-400 pl-14">
              Query parameters: <code>q</code> (string, required), <code>category</code> (all|research|code|knowledge|news|books), <code>limit</code> (int, default 10).
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="rounded bg-sky-500/10 px-2 py-0.5 font-mono text-xs font-bold text-sky-400 border border-sky-500/20">
                GET
              </span>
              <code className="text-xs font-semibold text-white">/api/v1/suggest</code>
              <span className="text-xs text-slate-500">· Fast autocomplete query suggestions</span>
            </div>
            <p className="text-xs text-slate-400 pl-14">
              Query parameters: <code>q</code> (string, minimum 2 chars). Returns an array of search string completions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/20">
                POST
              </span>
              <code className="text-xs font-semibold text-white">/api/v1/ai/answer</code>
              <span className="text-xs text-slate-500">· Generate grounded source synthesis digest</span>
            </div>
            <p className="text-xs text-slate-400 pl-14">
              JSON body: <code>{`{ "question": string, "items": SearchItem[] }`}</code>. Returns verified citations and summary.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-xs font-bold text-indigo-400 border border-indigo-500/20">
                GET
              </span>
              <code className="text-xs font-semibold text-white">/api/v1/health</code>
              <span className="text-xs text-slate-500">· Real-time engine & uptime telemetry</span>
            </div>
            <p className="text-xs text-slate-400 pl-14">
              Reports system operational status, active circuit breaker states, and provider latency metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
