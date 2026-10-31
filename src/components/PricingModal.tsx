import React, { useState } from 'react';
import { Check, ShieldCheck, Zap, CreditCard, QrCode, Sparkles, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types';

interface PricingModalProps {
  currentPlan: 'free' | 'starter' | 'pro' | 'business';
  onUpgradePlan: (newPlan: 'free' | 'starter' | 'pro' | 'business') => void;
}

interface PlanDetails {
  id: 'free' | 'starter' | 'pro' | 'business';
  name: string;
  priceInr: number;
  requestsMonthly: number;
  rateLimit: string;
  tagline: string;
  popular?: boolean;
  features: string[];
}

const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Free Community',
    priceInr: 0,
    requestsMonthly: 1000,
    rateLimit: '10 requests / min',
    tagline: 'Ideal for independent research and student hobby projects.',
    features: [
      '1,000 monthly search requests',
      'All 6 federated sources',
      'Standard relevance ranking',
      'Basic Wikipedia & arXiv access',
      'Community forum support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter Developer',
    priceInr: 199,
    requestsMonthly: 10000,
    rateLimit: '60 requests / min',
    tagline: 'For indie hackers building search integrations and bots.',
    features: [
      '10,000 monthly search requests',
      'High-throughput REST API key',
      '60 requests / min rate limit',
      'GDELT News & GitHub code indexing',
      'Standard latency SLA',
      'Email developer support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Production',
    priceInr: 599,
    requestsMonthly: 50000,
    rateLimit: '300 requests / min',
    popular: true,
    tagline: 'For scaling products, AI agents, and production SaaS.',
    features: [
      '50,000 monthly search requests',
      'AI Grounded Source Digest endpoint',
      '300 requests / min rate limit',
      'Multiple concurrent API keys',
      'Sub-250ms cached response SLA',
      'Priority email & Slack support',
    ],
  },
  {
    id: 'business',
    name: 'Business Scale',
    priceInr: 1499,
    requestsMonthly: 200000,
    rateLimit: '1,200 requests / min',
    tagline: 'For high-throughput organizations and enterprise pipelines.',
    features: [
      '200,000 monthly search requests',
      'Unlimited API key generation',
      '1,200 requests / min rate limit',
      '99.9% uptime availability SLA',
      'Custom webhook event triggers',
      'Dedicated technical account manager',
    ],
  },
];

export const PricingModal: React.FC<PricingModalProps> = ({
  currentPlan,
  onUpgradePlan,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'plan' | 'checkout' | 'success'>('plan');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('developer@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartCheckout = (plan: PlanDetails) => {
    if (plan.id === 'free') {
      onUpgradePlan('free');
      return;
    }
    setSelectedPlan(plan);
    setCheckoutStep('checkout');
  };

  const handleSimulatePayment = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Billing is not configured');
      alert('Billing is not configured yet. No payment was taken and your plan was not changed.');
      setCheckoutStep('plan');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Billing is not configured. No payment was taken.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          Transparent Pricing
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-white font-heading tracking-tight sm:text-5xl">
          Predictable plans for curious minds & developers.
        </h1>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          Choose a plan to review proposed limits. Paid billing is not configured, so paid plans cannot be purchased or activated.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                plan.popular
                  ? 'border-sky-500/80 bg-slate-900/90 shadow-2xl shadow-sky-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white font-heading">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.tagline}</p>

                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    ₹{plan.priceInr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <div className="rounded-lg bg-slate-950/70 p-2.5 mb-5 border border-slate-800 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Monthly Quota:</span>
                    <span className="font-mono text-white font-semibold">
                      {plan.requestsMonthly.toLocaleString()} reqs
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Rate Limit:</span>
                    <span className="font-mono text-sky-400 font-semibold">{plan.rateLimit}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handleStartCheckout(plan)}
                  disabled={isCurrent || plan.id !== 'free'}
                  className={`w-full rounded-xl py-2.5 text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : plan.popular
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 hover:brightness-110'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : plan.priceInr === 0 ? 'Select Free Plan' : 'Paid billing unavailable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      {checkoutStep === 'checkout' && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Confirm Subscription Upgrade
                </h3>
                <p className="text-xs text-slate-400">
                  Upgrading to {selectedPlan.name} for ₹{selectedPlan.priceInr.toLocaleString('en-IN')}/mo
                </p>
              </div>
              <button
                onClick={() => setCheckoutStep('plan')}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">
                Select Indian Payment Rails (Test Sandbox Mode)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <QrCode className="h-5 w-5 mb-1" />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === 'card'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <ShieldCheck className="h-5 w-5 mb-1" />
                  <span>NetBanking</span>
                </button>
              </div>
            </div>

            {/* UPI ID input */}
            {paymentMethod === 'upi' && (
              <div className="space-y-2 rounded-xl bg-slate-950 p-4 border border-slate-800">
                <label className="block text-xs font-medium text-slate-300">
                  Virtual Payment Address (VPA / UPI ID)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">
                  Supported: Google Pay, PhonePe, Paytm, BHIM UPI.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 border border-amber-500/20 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                Billing is disabled. No payment will be collected and no paid plan can be activated until a real payment provider is integrated.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutStep('plan')}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 disabled:opacity-50"
              >
                {isProcessing ? 'Verifying Webhook...' : `Pay ₹${selectedPlan.priceInr.toLocaleString('en-IN')} & Activate`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {checkoutStep === 'success' && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-heading">
              Plan Upgraded Successfully!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your account has been upgraded to <strong className="text-white">{selectedPlan.name}</strong>. Your quota limit is now{' '}
              <strong className="text-sky-400 font-mono">{selectedPlan.requestsMonthly.toLocaleString()} requests/month</strong>.
            </p>
            <button
              onClick={() => setCheckoutStep('plan')}
              className="mt-4 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              Return to Pricing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
