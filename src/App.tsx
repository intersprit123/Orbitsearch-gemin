import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeSearch } from './components/HomeSearch';
import { SearchResults } from './components/SearchResults';
import { DeveloperPortal } from './components/DeveloperPortal';
import { PricingModal } from './components/PricingModal';
import { Dashboard } from './components/Dashboard';
import { AdminConsole } from './components/AdminConsole';
import { Footer } from './components/Footer';
import { InfoModals } from './components/InfoModals';
import { SearchResultItem, SearchCategory, UserAccount } from './types';

const INITIAL_USER: UserAccount = {
  id: 'usr_default_01',
  name: 'Dev Engineer',
  email: 'developer@orbitsearch.io',
  plan: 'pro',
  monthlyQuota: 50000,
  monthlyUsed: 1248,
  billingCycleEnd: 'Nov 30, 2026',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'developer' | 'pricing' | 'dashboard' | 'admin'>('search');
  const [user, setUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('orbit_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  // Search state
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tookMs, setTookMs] = useState(0);
  const [sourcesQueried, setSourcesQueried] = useState<string[]>([]);
  const [sourcesSucceeded, setSourcesSucceeded] = useState<string[]>([]);
  const [aiDigest, setAiDigest] = useState<string | null>(null);

  // Info modal state
  const [infoType, setInfoType] = useState<'about' | 'privacy' | 'terms' | 'contact' | null>(null);

  // Save user changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orbit_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  // Execute Federated Search
  const handleExecuteSearch = async (newQuery: string, newCategory: SearchCategory = 'all') => {
    if (!newQuery.trim()) return;
    setQuery(newQuery);
    setCategory(newCategory);
    setHasSearched(true);
    setIsLoading(true);
    setAiDigest(null);
    setActiveTab('search');

    const start = performance.now();
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(newQuery)}&category=${newCategory}&limit=16`);
      const data = await res.json();
      
      const elapsed = Math.round(performance.now() - start);
      setTookMs(data.tookMs || elapsed);
      setSourcesQueried(data.sourcesQueried || []);
      setSourcesSucceeded(data.sourcesSucceeded || []);
      setResults(data.results || []);

      // Increment user quota count locally
      setUser(prev => ({
        ...prev,
        monthlyUsed: Math.min(prev.monthlyQuota, prev.monthlyUsed + 1),
      }));

      // If results returned, request grounded AI source synthesis
      if (data.results && data.results.length > 0) {
        fetch('/api/v1/ai/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: newQuery, items: data.results }),
        })
          .then(r => r.json())
          .then(ansData => {
            if (ansData.answer) setAiDigest(ansData.answer);
          })
          .catch(() => {
            // non-fatal
          });
      }
    } catch (err: any) {
      setTookMs(Math.round(performance.now() - start));
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = (newPlan: 'free' | 'starter' | 'pro' | 'business') => {
    const limits: Record<string, number> = {
      free: 1000,
      starter: 10000,
      pro: 50000,
      business: 200000,
    };
    setUser(prev => ({
      ...prev,
      plan: newPlan,
      monthlyQuota: limits[newPlan],
    }));
  };

  const handleResetSearch = () => {
    setHasSearched(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-[#f1f5f9]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'search' && !query) {
            setHasSearched(false);
          }
        }}
        user={user}
        onOpenInfo={(t) => setInfoType(t)}
        onQuickSearch={(q) => handleExecuteSearch(q, 'all')}
      />

      <main className="flex-1">
        {activeTab === 'search' && (
          <>
            {!hasSearched ? (
              <HomeSearch
                onSearch={handleExecuteSearch}
                onSelectCategory={setCategory}
                selectedCategory={category}
              />
            ) : (
              <SearchResults
                query={query}
                category={category}
                results={results}
                isLoading={isLoading}
                tookMs={tookMs}
                sourcesQueried={sourcesQueried}
                sourcesSucceeded={sourcesSucceeded}
                aiDigest={aiDigest}
                onSearch={handleExecuteSearch}
              />
            )}
          </>
        )}

        {activeTab === 'developer' && (
          <DeveloperPortal
            apiKey="orb_live_demo_enterprise_99x"
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingModal
            currentPlan={user.plan}
            onUpgradePlan={handleUpgradePlan}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            user={user}
            onNavigateToPricing={() => setActiveTab('pricing')}
            onQuickSearch={(q) => handleExecuteSearch(q, 'all')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminConsole />
        )}
      </main>

      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenInfo={(t) => setInfoType(t)}
      />

      {/* Institutional Modals */}
      <InfoModals
        type={infoType}
        onClose={() => setInfoType(null)}
      />
    </div>
  );
}
