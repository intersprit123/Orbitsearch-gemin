import React, { useState, useEffect } from 'react';
import { Activity, Server, ShieldAlert, RefreshCw, Zap, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ProviderHealth } from '../types';

export const AdminConsole: React.FC = () => {
  const [providerList, setProviderList] = useState<ProviderHealth[]>([]);
  const [cacheEntries, setCacheEntries] = useState(0);
  const [maxCacheEntries, setMaxCacheEntries] = useState(500);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/providers');
      const data = await res.json();
      setProviderList(data.providers || []);
      setCacheEntries(data.cacheEntries || 0);
      setMaxCacheEntries(data.maxCacheEntries || 500);

      const healthRes = await fetch('/api/v1/health');
      const healthData = await healthRes.json();
      setUptimeSeconds(healthData.uptimeSeconds || 0);
    } catch {
      // fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Activity className="h-4 w-4" />
            <span>Service Telemetry & Operator Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight">
            Infrastructure & Provider Health
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time circuit breakers, latency meters, upstream failure rates, and caching telemetry.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-600 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Global Stat Counters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Active Upstream Gateways</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {providerList.filter((provider) => provider.state !== 'open').length} / {providerList.length}
          </div>
          <span className="text-[11px] text-slate-500">Circuit state is not an uptime guarantee</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">In-Memory TTL Cache</span>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">
            {cacheEntries} <span className="text-sm font-normal text-slate-400">/ {maxCacheEntries}</span>
          </div>
          <span className="text-[11px] text-slate-500">Bounded LRU eviction (45s TTL)</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Process Uptime</span>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-400">
            {Math.floor(uptimeSeconds / 60)}m {uptimeSeconds % 60}s
          </div>
          <span className="text-[11px] text-slate-500">Container port 3000 online</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Security Firewall</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            Outbound allowlist
          </div>
          <span className="text-[11px] text-slate-500">HTTPS provider allowlist active</span>
        </div>
      </div>

      {/* Upstream Provider Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-heading">
          Federated Upstream Circuit Breakers
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providerList.map((p) => {
            const isClosed = p.state === 'closed';
            const isHalf = p.state === 'half-open';
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{p.name}</h3>
                    <span className="text-[11px] text-slate-500 uppercase font-mono">
                      {p.category} provider
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isClosed ? (
                      <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        CLOSED
                      </span>
                    ) : isHalf ? (
                      <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="h-3 w-3" />
                        PROBING
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                        <XCircle className="h-3 w-3" />
                        OPEN (TRIPPED)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3">
                  <div>
                    <span className="text-slate-500 block">Avg Latency</span>
                    <span className="font-mono text-slate-200 font-semibold">{p.averageLatencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Calls Dispatched</span>
                    <span className="font-mono text-slate-200 font-semibold">{p.totalCalls}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Consecutive Fails</span>
                    <span className="font-mono text-slate-200 font-semibold">{p.failureCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Success Rate</span>
                    <span className="font-mono text-emerald-400 font-semibold">{p.totalCalls > 0 ? Math.round((p.successCalls / p.totalCalls) * 100) + '%' : 'No calls yet'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
