import React from 'react';
import { Sparkles, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: 'search' | 'developer' | 'pricing' | 'dashboard' | 'admin') => void;
  onOpenInfo: (type: 'about' | 'privacy' | 'terms' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenInfo }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070b13] text-slate-400 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-white font-heading text-base">Orbit Search</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enterprise federated search platform. Querying global knowledge, papers, code, and news without tracking.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Search Engine</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('search')} className="hover:text-white transition-colors">
                  Multi-Domain Search
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('search')} className="hover:text-white transition-colors">
                  arXiv Research Papers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('search')} className="hover:text-white transition-colors">
                  GitHub Repositories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('search')} className="hover:text-white transition-colors">
                  Open Library Books
                </button>
              </li>
            </ul>
          </div>

          {/* Developers & Monetization */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Developers & Plans</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('developer')} className="hover:text-white transition-colors">
                  REST API Documentation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">
                  Pricing & Quotas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors">
                  API Key Management
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">
                  Circuit Breakers & Telemetry
                </button>
              </li>
            </ul>
          </div>

          {/* Security & Legal */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Security & Trust</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onOpenInfo('privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenInfo('terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onOpenInfo('contact')} className="hover:text-white transition-colors">
                  Responsible Disclosure
                </button>
              </li>
              <li>
                <button onClick={() => onOpenInfo('about')} className="hover:text-white transition-colors">
                  About Orbit
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-4">
          <div>
            &copy; {new Date().getFullYear()} Orbit Search Engine. Distributed search architecture.
          </div>
          <div className="flex items-center gap-1">
            <span>Engineered with strict SSRF defenses & privacy guarantees</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
