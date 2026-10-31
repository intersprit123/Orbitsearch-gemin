import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Shield, Clock, Search, ExternalLink } from 'lucide-react';
import { UserAccount, ApiKeyItem } from '../types';

interface DashboardProps {
  user: UserAccount;
  onNavigateToPricing: () => void;
  onQuickSearch: (q: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onNavigateToPricing,
  onQuickSearch,
}) => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('Production Microservice Key');
  const [generatedPlainKey, setGeneratedPlainKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('orbit_admin_token') || '');
  const [apiError, setApiError] = useState<string | null>(null);
  const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // Load API keys from backend
  const loadKeys = async () => {
    try {
      const res = await fetch('/api/v1/keys', { headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Could not load API keys');
      setApiError(null);
      setKeys(data.keys || []);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Could not load API keys');
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ name: newKeyName, plan: user.plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to generate key');
      setGeneratedPlainKey(data.secretPlainKey);
      setApiError(null);
      loadKeys();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to generate key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will immediately fail with HTTP 401.')) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/keys/${id}`, { method: 'DELETE', headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Revocation failed');
      setApiError(null);
      loadKeys();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Revocation failed');
    }
  };

  const usagePercent = Math.min(100, Math.round((user.monthlyUsed / user.monthlyQuota) * 100));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight">
            Account & Developer Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your API keys, inspect quota utilization, and configure search integrations.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedPlainKey(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Generate API Key</span>
        </button>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
        <div className="text-sm font-semibold text-amber-200">API key administration is locked by default</div>
        <p className="text-xs text-slate-300">Set the server's ORBIT_ADMIN_TOKEN and enter that same secret here to manage keys. This is an operator token, not a user login. Keep it private and use only over HTTPS.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="password" autoComplete="off" value={adminToken} onChange={(event) => { setAdminToken(event.target.value); sessionStorage.setItem('orbit_admin_token', event.target.value); }} placeholder="ORBIT_ADMIN_TOKEN" className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white" />
          <button onClick={loadKeys} className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-600">Authenticate / Refresh</button>
        </div>
        {apiError && <p role="alert" className="text-xs text-rose-300">{apiError}</p>}
      </div>

      {/* Account & Quota Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Account Info */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <Shield className="h-4 w-4 text-sky-400" />
            <span>Developer Account</span>
          </div>
          <div className="text-sm font-semibold text-white">{user.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Workspace Tier:</span>
            <span className="font-bold text-sky-400 uppercase">{user.plan}</span>
          </div>
        </div>

        {/* Monthly Quota Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm sm:col-span-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Guest Preview Quota (not account-backed)</span>
            <button
              onClick={onNavigateToPricing}
              className="text-sky-400 hover:text-sky-300 normal-case font-medium text-xs"
            >
              Change Tier &rarr;
            </button>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-bold font-mono text-white">
              {user.monthlyUsed.toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-400">
                / {user.monthlyQuota.toLocaleString()} requests
              </span>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-300">
              {usagePercent}% Used
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercent > 90 ? 'bg-rose-500' : usagePercent > 75 ? 'bg-amber-400' : 'bg-sky-500'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Preview only · no signed-in account</span>
            <span>API key usage is enforced per process; no user billing is configured</span>
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Active API Keys</h2>
          </div>
          <span className="text-xs text-slate-400">
            Showing {keys.length} registered key{keys.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-medium">Name & Prefix</th>
                <th className="py-3 px-4 font-medium">Monthly Limit</th>
                <th className="py-3 px-4 font-medium">Used</th>
                <th className="py-3 px-4 font-medium">Created</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{k.name}</div>
                    <div className="font-mono text-[11px] text-sky-400">{k.keyPrefix}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">{k.quotaMonthly.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono">{k.usedMonthly.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-400">{k.createdAt.slice(0, 10)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        k.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {k.status === 'active' && (
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Revoke Key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-heading">
                {generatedPlainKey ? 'API Key Generated' : 'Create New API Key'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {!generatedPlainKey ? (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Key Identifier / Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    required
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-sky-500 focus:outline-none"
                    placeholder="e.g. CLI Search Tool or Discord Bot"
                  />
                </div>

                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs text-slate-400">
                  This key will inherit your <strong className="text-white uppercase">{user.plan}</strong> tier quota ({user.monthlyQuota.toLocaleString()} requests/month).
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
                  >
                    Generate Secret Key
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    Copy your API key now. For extreme security, Orbit stores only the cryptographic SHA-256 hash. You will not be able to view this key again.
                  </span>
                </div>

                <div className="relative rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-xs text-sky-300 break-all pr-12">
                  {generatedPlainKey}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPlainKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                >
                  I have saved my secret key safely
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
