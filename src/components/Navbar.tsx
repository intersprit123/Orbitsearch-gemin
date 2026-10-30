import React from 'react';
import { Search, Code2, CreditCard, LayoutDashboard, Activity, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  activeTab: 'search' | 'developer' | 'pricing' | 'dashboard' | 'admin';
  setActiveTab: (tab: 'search' | 'developer' | 'pricing' | 'dashboard' | 'admin') => void;
  user: UserAccount;
  onOpenInfo: (type: 'about' | 'privacy' | 'terms' | 'contact') => void;
  onQuickSearch: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenInfo,
  onQuickSearch,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('search')}
            className="group flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-sky-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#090d16]">
                <Sparkles className="h-4 w-4 text-sky-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-lg font-heading">
                  Orbit<span className="text-sky-400 font-normal">Search</span>
                </span>
                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-sky-400 border border-sky-500/20">
                  v4.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">Enterprise Federated Engine</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-slate-800/80 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Search className="h-4 w-4 text-sky-400" />
              Search
            </button>

            <button
              onClick={() => setActiveTab('developer')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'developer'
                  ? 'bg-slate-800/80 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Code2 className="h-4 w-4 text-indigo-400" />
              Developer API
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'pricing'
                  ? 'bg-slate-800/80 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <CreditCard className="h-4 w-4 text-emerald-400" />
              Plans
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800/80 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-amber-400" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-slate-800/80 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Activity className="h-4 w-4 text-purple-400" />
              Telemetry
            </button>
          </nav>
        </div>

        {/* Right Section: Status & Account */}
        <div className="flex items-center gap-3">
          {/* Live Engine Status */}
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">6 Providers Live</span>
          </div>

          {/* User Account / Plan Badge */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-[10px]">
              {user.name.charAt(0)}
            </div>
            <span className="font-medium text-slate-200 hidden sm:inline">{user.name}</span>
            <span className="uppercase text-[9px] font-bold tracking-wider rounded bg-sky-500/10 text-sky-400 px-1.5 py-0.5 border border-sky-500/20">
              {user.plan}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
