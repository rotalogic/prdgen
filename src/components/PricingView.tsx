import React, { useEffect, useRef, useState } from 'react';
import { Users, FileText, Flame, Check, ChevronDown, Rocket, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { BillingStatus, PlanId } from '../types';

interface HomepageStats {
  totalUsers: number;
  totalGenerated: number;
}

interface PlanFeature {
  label: string;
}

interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // Rp per month, shown for the "1 Bulan" cycle
  originalPriceLabel?: string; // struck-through reference price, if any
  discountLabel?: string; // e.g. "51% OFF"
  features: PlanFeature[];
  highlight?: boolean;
  highlightBadge?: string;
}

const PLANS: PlanDef[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Buat yang mulai serius.',
    priceMonthly: 50000,
    originalPriceLabel: 'Rp 75.000/bulan',
    discountLabel: 'Hemat Rp25rb',
    features: [
      { label: '5 PRD / bulan' },
      { label: 'Bonus +3 PRD gratis' },
      { label: 'Chat dengan AI mengenai planning PRD, fitur, task (100x/bln)' },
      { label: 'Download Markdown' },
      { label: 'Generate specs untuk fitur dan task' },
    ],
  },
  {
    id: 'pro_tahunan',
    name: 'Pro Tahunan',
    tagline: 'Unlimited, semua akses.',
    priceMonthly: 99000,
    originalPriceLabel: 'Rp 2,4jt',
    discountLabel: '51% OFF',
    highlight: true,
    highlightBadge: 'Paling Worth',
    features: [
      { label: 'Unlimited PRD' },
      { label: 'Chat dengan AI mengenai planning PRD, fitur, task (unlimited)' },
      { label: 'Upload gambar & dokumen referensi' },
      { label: 'Download Markdown' },
      { label: 'Chat dengan Tim RotaLogic untuk bantuan' },
      { label: 'Generate specs untuk fitur dan task' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Unlimited, semua akses.',
    priceMonthly: 149000,
    originalPriceLabel: 'Rp 200k/bulan',
    discountLabel: '25% OFF',
    features: [
      { label: 'Unlimited PRD' },
      { label: 'Chat dengan AI mengenai planning PRD, fitur, task (unlimited)' },
      { label: 'Download Markdown' },
      { label: 'Chat dengan Tim RotaLogic untuk bantuan' },
      { label: 'Generate specs untuk fitur dan task' },
    ],
  },
];

const formatRupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

const PLAN_LABEL: Record<PlanId, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  pro_tahunan: 'Pro Tahunan',
};

type TxnStatus = 'checking' | 'pending' | 'paid' | 'error';

interface PricingViewProps {
  billingStatus: BillingStatus | null;
  onPaymentConfirmed?: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ billingStatus, onPaymentConfirmed }) => {
  const [stats, setStats] = useState<HomepageStats | null>(null);
  const [cycle, setCycle] = useState<'1_bulan' | '3_bulan'>('1_bulan');
  const [showVoucher, setShowVoucher] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txnStatus, setTxnStatus] = useState<TxnStatus | null>(null);
  const pollAttempts = useRef(0);

  // Captured once at mount so it survives the URL cleanup below (and React
  // StrictMode's dev-only double-invoke of effects, which would otherwise
  // read an already-stripped URL on the second pass).
  const [txnId] = useState(() => new URLSearchParams(window.location.search).get('checkout'));

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  // Strip ?checkout= from the URL once, separately from the polling effect
  // below, so it doesn't race with StrictMode's mount/cleanup/remount.
  useEffect(() => {
    if (!txnId) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    window.history.replaceState({}, '', url.toString());
  }, [txnId]);

  // After a Pakasir redirect back (?checkout=<txnId>), poll our own status
  // endpoint — the webhook that flips the transaction to 'paid' can land a
  // few seconds after the browser is already back on this page.
  useEffect(() => {
    if (!txnId) return;

    setTxnStatus('checking');
    let cancelled = false;

    const poll = () => {
      fetch(`/api/checkout/pakasir/status/${txnId}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (cancelled) return;
          if (data.status === 'paid') {
            setTxnStatus('paid');
            onPaymentConfirmed?.();
            return;
          }
          pollAttempts.current += 1;
          if (pollAttempts.current >= 10) {
            setTxnStatus('pending');
            return;
          }
          if (!cancelled) setTimeout(poll, 3000);
        })
        .catch(() => {
          if (!cancelled) setTxnStatus('error');
        });
    };
    poll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txnId]);

  const handleChoosePlan = async (planId: PlanId) => {
    setErrorMsg(null);
    setPendingPlan(planId);
    try {
      const res = await fetch('/api/checkout/pakasir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          billingCycle: cycle,
          promoCode: promoCode.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.link) {
        throw new Error(body.error || 'Gagal membuat link pembayaran.');
      }
      window.location.href = body.link;
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal memulai pembayaran. Coba lagi.');
      setPendingPlan(null);
    }
  };

  const priceFor = (plan: PlanDef) =>
    cycle === '1_bulan' ? plan.priceMonthly : plan.priceMonthly * 3;

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10 w-full">
      {/* Top strip: real usage numbers + current plan */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-400 font-mono mb-10">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          {stats ? stats.totalUsers.toLocaleString('id-ID') : '-'} User
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          {stats ? stats.totalGenerated.toLocaleString('id-ID') : '-'} PRD
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-slate-300">
          Paket kamu: {PLAN_LABEL[billingStatus?.plan || 'free']}
        </span>
      </div>

      {txnStatus === 'paid' && (
        <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Pembayaran berhasil dikonfirmasi. Paketmu sudah aktif.</span>
        </div>
      )}
      {(txnStatus === 'checking' || txnStatus === 'pending') && (
        <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-sm text-center flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            {txnStatus === 'checking'
              ? 'Mengecek status pembayaran...'
              : 'Pembayaran belum terkonfirmasi. Kalau kamu sudah bayar, tunggu sebentar lalu refresh halaman ini.'}
          </span>
        </div>
      )}

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold mb-4">
          <Flame className="w-3.5 h-3.5" />
          <span>Promo hingga 51%</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
          Pilih paket kamu
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Upgrade untuk AI premium dan fitur lebih.
        </p>

        <button
          type="button"
          onClick={() => setShowVoucher((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-2"
        >
          <span>Punya kode promo?</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showVoucher ? 'rotate-180' : ''}`} />
        </button>
        {showVoucher && (
          <div className="max-w-xs mx-auto mt-2 p-3 rounded-lg bg-[#101626] border border-slate-800 text-left">
            <label htmlFor="promo-code-input" className="block text-[11px] text-slate-400 mb-1.5">
              Kode promo (opsional)
            </label>
            <input
              id="promo-code-input"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Contoh: HEMAT25"
              maxLength={40}
              className="w-full px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-xs font-mono tracking-wide placeholder:text-slate-600 focus:outline-none focus:border-[#F2542D] transition"
            />
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Kode ini ikut tercatat di transaksimu saat checkout, lalu diverifikasi tim RotaLogic.
            </p>
          </div>
        )}

        {/* Billing cycle toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#101626] border border-slate-800 mt-4">
          <button
            type="button"
            onClick={() => setCycle('1_bulan')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              cycle === '1_bulan' ? 'bg-white text-[#0B0F1B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            1 Bulan
          </button>
          <button
            type="button"
            onClick={() => setCycle('3_bulan')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              cycle === '3_bulan' ? 'bg-white text-[#0B0F1B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>3 Bulan</span>
            <span className="px-1.5 py-0.5 rounded bg-[#F2542D] text-white text-[9px] font-bold">Hemat</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-md mx-auto mb-6 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs text-center">
          {errorMsg}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {PLANS.map((plan) => {
          const isCurrent = billingStatus?.plan === plan.id;
          const isPending = pendingPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col h-full ${
                plan.highlight
                  ? 'bg-[#141B2D] border-2 border-[#F2542D] shadow-[0_0_30px_-8px_rgba(242,84,45,0.5)]'
                  : 'bg-[#101626] border border-slate-800'
              }`}
            >
              {plan.highlightBadge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F2542D] text-white text-[11px] font-bold shadow-lg">
                  <Rocket className="w-3 h-3" />
                  {plan.highlightBadge}
                </span>
              )}

              <h3 className="text-base font-bold text-white mb-3">{plan.name}</h3>

              <div className="mb-1">
                <span className="text-3xl font-display font-bold text-white">{formatRupiah(priceFor(plan))}</span>
                <span className="text-slate-500 text-sm">/{cycle === '1_bulan' ? 'bulan' : '3 bulan'}</span>
              </div>

              {plan.originalPriceLabel && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="text-slate-500 line-through">{plan.originalPriceLabel}</span>
                  {plan.discountLabel && (
                    <span className="px-1.5 py-0.5 rounded bg-[#F2542D]/20 text-[#ff8e73] border border-[#F2542D]/30 font-semibold">
                      {plan.discountLabel}
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-400 mb-5">{plan.tagline}</p>

              <div className="border-t border-slate-800 pt-4 mb-6 space-y-2.5 flex-1">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={isCurrent || isPending}
                onClick={() => handleChoosePlan(plan.id)}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                  plan.highlight
                    ? 'bg-[#F2542D] hover:bg-[#ff6742] text-white disabled:opacity-70'
                    : 'border border-slate-700 text-white hover:bg-slate-800 disabled:opacity-60'
                }`}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {isCurrent
                    ? 'Paket Aktifmu'
                    : isPending
                    ? 'Menyiapkan pembayaran...'
                    : `Pilih ${plan.name}`}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-500 mt-8 max-w-lg mx-auto leading-relaxed">
        Pembayaran diproses lewat Pakasir. Kamu akan diarahkan ke halaman checkout aman, lalu kembali ke sini otomatis setelah pembayaran dikonfirmasi.
      </p>
    </div>
  );
};
