import React from 'react';
import { ShieldCheck, Lock, FileText, Mail, X } from 'lucide-react';

interface InfoModalProps {
  type: 'about' | 'privacy' | 'terms' | 'contact' | null;
  onClose: () => void;
}

export const InfoModals: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {type === 'about' && <FileText className="h-5 w-5 text-sky-400" />}
            {type === 'privacy' && <Lock className="h-5 w-5 text-emerald-400" />}
            {type === 'terms' && <ShieldCheck className="h-5 w-5 text-indigo-400" />}
            {type === 'contact' && <Mail className="h-5 w-5 text-purple-400" />}
            <h2 className="text-lg font-bold text-white font-heading capitalize">
              {type === 'about' && 'About Orbit Search'}
              {type === 'privacy' && 'Privacy & Data Protection Policy'}
              {type === 'terms' && 'Terms of Service & API Quotas'}
              {type === 'contact' && 'Security & Contact Disclosure'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-4 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed font-sans">
          {type === 'about' && (
            <>
              <p>
                Orbit Search is an independent federated search technology engine engineered to index, normalize, and rank verified open-access research, developer code, encyclopedia knowledge, and international news wire feeds without advertising surveillance.
              </p>
              <h3 className="text-sm font-semibold text-white">Our Core Tenets</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li><strong>Radical Transparency:</strong> All search ranking signals are open, unpolluted by sponsored ad slots or tracker cookies.</li>
                <li><strong>Federated Concurrency:</strong> Upstream queries are parallelized across authoritative scientific and technical public databases.</li>
                <li><strong>High-Performance REST APIs:</strong> Enabling developers and autonomous agents to query multi-domain knowledge programmatically with deterministic schemas.</li>
              </ul>
            </>
          )}

          {type === 'privacy' && (
            <>
              <p>
                At Orbit Search, privacy is a cryptographic architectural guarantee rather than an afterthought.
              </p>
              <h3 className="text-sm font-semibold text-white">What We Do Not Collect</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>We do not log user search queries linked to individual IP addresses or personal identities.</li>
                <li>We do not maintain behavioral search history or sell profiles to third-party ad brokers.</li>
                <li>We do not embed third-party analytics trackers, tracking pixels, or cross-site fingerprinting scripts.</li>
              </ul>
              <h3 className="text-sm font-semibold text-white">Security & API Keys</h3>
              <p>
                Developer API keys are stored exclusively as salted SHA-256 cryptographic hashes. The raw key is generated on the server and revealed once to the developer.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                By using Orbit Search and its developer APIs, you agree to respect public provider terms, quota limits, and ethical computing standards.
              </p>
              <h3 className="text-sm font-semibold text-white">Acceptable Use</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Rate limits and monthly quotas must be respected without attempt to circumvent through sybil key generation or DDoS payloads.</li>
                <li>Upstream public providers (e.g. arXiv, GitHub, Wikimedia, Open Library) must be attributed when displaying results to end users.</li>
                <li>Automated scrapers attempting to bypass security boundaries or execute unauthorized denial-of-service tests are strictly forbidden.</li>
              </ul>
            </>
          )}

          {type === 'contact' && (
            <>
              <p>
                Orbit Search welcomes security researchers, technology partners, and customer inquiries.
              </p>
              <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 space-y-2 font-mono">
                <div><strong>Security Inquiries:</strong> security@orbitsearch.io</div>
                <div><strong>Developer Support:</strong> support@orbitsearch.io</div>
                <div><strong>PGP Key Fingerprint:</strong> 4A8B 91F2 C0D3 77EE 5541</div>
              </div>
              <p className="text-slate-400">
                All coordinated vulnerability disclosures receive prompt human review within 24 hours.
              </p>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
