import React, { useEffect, useState } from 'react';
import { Users, FileText, Wallet, Tag, Plus, Trash2, Power, Loader2 } from 'lucide-react';
import { AdminStats, PromoCode, PlanId } from '../types';

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  pro_tahunan: 'Pro Tahunan',
};

const formatRupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

type Tab = 'stats' | 'promo';

export const AdminView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percent' | 'fixed'>('percent');
  const [newValue, setNewValue] = useState('');
  const [newPlan, setNewPlan] = useState<PlanId | ''>('');
  const [newMaxRedemptions, setNewMaxRedemptions] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/stats').then((r) => (r.ok ? r.json() : Promise.reject(r))),
      fetch('/api/admin/promo-codes').then((r) => (r.ok ? r.json() : Promise.reject(r))),
    ])
      .then(([statsData, promoData]) => {
        setStats(statsData);
        setPromoCodes(promoData.promoCodes);
        setErrorMsg(null);
      })
      .catch(() => setErrorMsg('Gagal memuat data admin.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          discountType: newType,
          discountValue: Number(newValue),
          appliesToPlan: newPlan || undefined,
          maxRedemptions: newMaxRedemptions || undefined,
          expiresAt: newExpiresAt ? new Date(newExpiresAt).toISOString() : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Gagal membuat kode promo.');
      setPromoCodes((prev) => [body.promoCode, ...prev]);
      setNewCode('');
      setNewValue('');
      setNewPlan('');
      setNewMaxRedemptions('');
      setNewExpiresAt('');
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal membuat kode promo.');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (code: PromoCode) => {
    const res = await fetch(`/api/admin/promo-codes/${code.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !code.active }),
    });
    if (res.ok) {
      const body = await res.json();
      setPromoCodes((prev) => prev.map((c) => (c.id === code.id ? body.promoCode : c)));
    }
  };

  const deleteCode = async (id: number) => {
    const res = await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setPromoCodes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-10 w-full">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">Admin</h1>
      <p className="text-sm text-slate-400 mb-6">Statistik pelanggan dan kode promo.</p>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#101626] border border-slate-800 mb-8">
        <button
          type="button"
          onClick={() => setTab('stats')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            tab === 'stats' ? 'bg-white text-[#0B0F1B]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Statistik
        </button>
        <button
          type="button"
          onClick={() => setTab('promo')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            tab === 'promo' ? 'bg-white text-[#0B0F1B]' : 'text-slate-400 hover:text-white'
          }`}
        >
          Kode Promo
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#101626] border border-slate-800">
              <Users className="w-4 h-4 text-slate-500 mb-2" />
              <div className="text-xl font-display font-bold text-white">{stats.totalUsers}</div>
              <div className="text-xs text-slate-500">Total User</div>
            </div>
            <div className="p-4 rounded-xl bg-[#101626] border border-slate-800">
              <FileText className="w-4 h-4 text-slate-500 mb-2" />
              <div className="text-xl font-display font-bold text-white">{stats.totalPrd}</div>
              <div className="text-xs text-slate-500">Total PRD Dibuat</div>
            </div>
            <div className="p-4 rounded-xl bg-[#101626] border border-slate-800 col-span-2">
              <Wallet className="w-4 h-4 text-slate-500 mb-2" />
              <div className="text-xl font-display font-bold text-white">{formatRupiah(stats.totalRevenue)}</div>
              <div className="text-xs text-slate-500">Total Revenue (paid)</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Breakdown Paket</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.planBreakdown).map(([plan, count]) => (
                <span
                  key={plan}
                  className="px-3 py-1.5 rounded-lg bg-[#101626] border border-slate-800 text-xs text-slate-300"
                >
                  {PLAN_LABEL[plan] || plan}: <span className="text-white font-semibold">{count}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Minat Upgrade Terbaru (belum tentu bayar)</h3>
            <div className="rounded-xl bg-[#101626] border border-slate-800 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Paket</th>
                    <th className="text-left p-3">Siklus</th>
                    <th className="text-left p-3">Kode Promo</th>
                    <th className="text-left p-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInterest.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-3 text-slate-500 text-center">Belum ada data.</td>
                    </tr>
                  )}
                  {stats.recentInterest.map((r, i) => (
                    <tr key={i} className="border-b border-slate-800/60 text-slate-300">
                      <td className="p-3">{r.email}</td>
                      <td className="p-3">{PLAN_LABEL[r.plan] || r.plan}</td>
                      <td className="p-3">{r.billing_cycle}</td>
                      <td className="p-3">{r.promo_code || '-'}</td>
                      <td className="p-3">{formatDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Transaksi Terbaru</h3>
            <div className="rounded-xl bg-[#101626] border border-slate-800 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Paket</th>
                    <th className="text-left p-3">Jumlah</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-3 text-slate-500 text-center">Belum ada data.</td>
                    </tr>
                  )}
                  {stats.recentPayments.map((p, i) => (
                    <tr key={i} className="border-b border-slate-800/60 text-slate-300">
                      <td className="p-3">{p.email}</td>
                      <td className="p-3">{PLAN_LABEL[p.plan] || p.plan}</td>
                      <td className="p-3">{formatRupiah(p.amount)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'promo' && (
        <div className="space-y-8">
          <form onSubmit={handleCreateCode} className="p-5 rounded-xl bg-[#101626] border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Buat Kode Promo Baru
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="KODE (mis. HEMAT25)"
                required
                maxLength={40}
                className="px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#F2542D]"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'percent' | 'fixed')}
                className="px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F2542D]"
              >
                <option value="percent">Persen (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={newType === 'percent' ? 'Contoh: 25' : 'Contoh: 20000'}
                required
                min={1}
                max={newType === 'percent' ? 100 : undefined}
                className="px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#F2542D]"
              />
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as PlanId | '')}
                className="px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F2542D]"
              >
                <option value="">Semua Paket</option>
                <option value="starter">Starter</option>
                <option value="pro_tahunan">Pro Tahunan</option>
                <option value="pro">Pro</option>
              </select>
              <input
                type="number"
                value={newMaxRedemptions}
                onChange={(e) => setNewMaxRedemptions(e.target.value)}
                placeholder="Batas pemakaian (opsional)"
                min={1}
                className="px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#F2542D]"
              />
              <input
                type="date"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F2542D]"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white text-xs font-semibold transition disabled:opacity-60 flex items-center gap-2"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Buat Kode
            </button>
          </form>

          <div className="rounded-xl bg-[#101626] border border-slate-800 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left p-3">Kode</th>
                  <th className="text-left p-3">Diskon</th>
                  <th className="text-left p-3">Paket</th>
                  <th className="text-left p-3">Terpakai</th>
                  <th className="text-left p-3">Kadaluwarsa</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-3 text-slate-500 text-center">Belum ada kode promo.</td>
                  </tr>
                )}
                {promoCodes.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/60 text-slate-300">
                    <td className="p-3 font-mono text-white">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {c.code}
                      </span>
                    </td>
                    <td className="p-3">
                      {c.discount_type === 'percent' ? `${c.discount_value}%` : formatRupiah(c.discount_value)}
                    </td>
                    <td className="p-3">{c.applies_to_plan ? PLAN_LABEL[c.applies_to_plan] : 'Semua'}</td>
                    <td className="p-3">
                      {c.redeemed_count}
                      {c.max_redemptions ? ` / ${c.max_redemptions}` : ''}
                    </td>
                    <td className="p-3">{c.expires_at ? formatDate(c.expires_at) : '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          c.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        {c.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(c)}
                          title={c.active ? 'Nonaktifkan' : 'Aktifkan'}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCode(c.id)}
                          title="Hapus"
                          className="p-1.5 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
