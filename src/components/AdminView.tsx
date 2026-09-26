import React, { Component, useEffect, useMemo, useState } from 'react';
import {
  LogOut, TrendingUp, Users, FileText, Tag, Loader2, Power, Trash2,
  Shield, LayoutDashboard, CreditCard, RefreshCw, DollarSign, BarChart3,
  PieChart, Target, FileCode, Layers, Settings, Terminal, Search, Calendar,
  Plus, Download, Save, Wifi, RotateCw,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { cn } from '../lib/cn';
import {
  AdminStats, AdminUser, PromoCode, PlanId, AnalyticsData, AuditLogEntry,
  AppSettings, IntegrationStatus, ReconcileResult, ContentItem,
} from '../types';

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  pro_tahunan: 'Pro Tahunan',
};

const formatRupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// === ERROR BOUNDARY ===
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-400 font-mono whitespace-pre-wrap bg-background min-h-screen text-xs">
          Terjadi error: {String(this.state.error?.message || this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}

// === SHARED UI ===

function KpiCell({ title, value, icon }: { title: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="bg-card p-6 flex flex-col justify-between group hover:bg-border/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-secondary text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className="text-secondary group-hover:text-accent transition-colors w-4 h-4">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-primary font-mono tracking-tighter">{value}</div>
    </div>
  );
}

function GenericTable({
  columns,
  data,
  renderRow,
  actions,
}: {
  columns: string[];
  data: any[];
  renderRow: (row: any, i: number) => React.ReactNode;
  actions?: (row: any) => React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-background">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="px-5 py-3 text-secondary font-medium uppercase tracking-wider text-xs">{c}</th>
            ))}
            {actions && <th className="px-5 py-3 text-secondary font-medium uppercase tracking-wider text-xs text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 && (
            <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-8 text-center text-secondary">Belum ada data.</td></tr>
          )}
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-border/30 transition-colors">
              {renderRow(row, i)}
              {actions && <td className="px-5 py-3 text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === 'paid';
  return (
    <span className={cn(
      'px-2 py-1 rounded-sm text-xs font-bold uppercase',
      isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
    )}>
      {status}
    </span>
  );
}

// === MODULES ===

function DashboardModule({ stats }: { stats: AdminStats }) {
  const paidUsers = stats.totalUsers - (stats.planBreakdown.free || 0);
  const conversion = stats.totalUsers > 0 ? ((paidUsers / stats.totalUsers) * 100).toFixed(1) : '0.0';
  const chartData = stats.revenueByDay.map((d) => ({ date: formatDate(d.day), rev: d.total }));

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Overview</h1>
        <p className="text-secondary mt-1">Pusat kendali operasional.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border border border-border rounded-xl overflow-hidden">
        <KpiCell title="Total User" value={stats.totalUsers} icon={<Users />} />
        <KpiCell title="PRD Dibuat" value={stats.totalPrd} icon={<FileText />} />
        <KpiCell title="Revenue" value={formatRupiah(stats.totalRevenue)} icon={<DollarSign />} />
        <KpiCell title="Konversi ke Berbayar" value={`${conversion}%`} icon={<TrendingUp />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Tren Revenue</h3>
          <div className="h-72">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-secondary text-sm">Belum ada transaksi lunas pada rentang ini.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F2542D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F2542D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#070A12', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#F2542D' }} formatter={(v: number) => formatRupiah(v)} />
                  <Area type="monotone" dataKey="rev" stroke="#F2542D" strokeWidth={2} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">Breakdown Paket</h3>
          <div className="space-y-2 font-mono text-sm">
            {Object.entries(stats.planBreakdown).map(([plan, count]) => (
              <div key={plan} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-secondary">{PLAN_LABEL[plan] || plan}</span>
                <span className="text-primary font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background">
              <tr>
                <th className="px-5 py-3 text-secondary font-medium uppercase text-xs tracking-wider">Email</th>
                <th className="px-5 py-3 text-secondary font-medium uppercase text-xs tracking-wider">Paket</th>
                <th className="px-5 py-3 text-secondary font-medium uppercase text-xs tracking-wider">Jumlah</th>
                <th className="px-5 py-3 text-secondary font-medium uppercase text-xs tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentPayments.slice(0, 8).map((row, i) => (
                <tr key={i} className="hover:bg-border/30 transition-colors">
                  <td className="px-5 py-3 text-primary">{row.email}</td>
                  <td className="px-5 py-3 text-primary">{PLAN_LABEL[row.plan] || row.plan}</td>
                  <td className="px-5 py-3 text-primary font-mono font-bold">{formatRupiah(row.amount)}</td>
                  <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersModule({ users, searchQuery, subscriptionsOnly }: { users: AdminUser[]; searchQuery: string; subscriptionsOnly?: boolean }) {
  const filtered = useMemo(() => {
    const base = subscriptionsOnly ? users.filter((u) => u.plan !== 'free') : users;
    return base.filter((u) => u.email.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [users, searchQuery, subscriptionsOnly]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">{subscriptionsOnly ? 'Subscriptions' : 'Users'}</h1>
        <p className="text-secondary mt-1">{subscriptionsOnly ? 'User dengan paket berbayar aktif.' : `${users.length} user terdaftar.`}</p>
      </div>
      <GenericTable
        columns={['Email', 'Paket', 'Bergabung']}
        data={filtered}
        renderRow={(u: AdminUser) => (
          <>
            <td className="px-5 py-3 text-primary">{u.email}</td>
            <td className="px-5 py-3 text-secondary">{PLAN_LABEL[u.plan] || u.plan}</td>
            <td className="px-5 py-3 text-secondary font-mono">{formatDate(u.created_at)}</td>
          </>
        )}
      />
    </div>
  );
}

function TransactionsModule({ stats, searchQuery }: { stats: AdminStats; searchQuery: string }) {
  const filtered = stats.recentPayments.filter((t) => t.email.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Transactions</h1>
        <p className="text-secondary mt-1">{stats.recentPayments.length} transaksi terbaru.</p>
      </div>
      <GenericTable
        columns={['Email', 'Paket', 'Siklus', 'Jumlah', 'Status', 'Tanggal']}
        data={filtered}
        renderRow={(t) => (
          <>
            <td className="px-5 py-3 text-primary">{t.email}</td>
            <td className="px-5 py-3 text-secondary">{PLAN_LABEL[t.plan] || t.plan}</td>
            <td className="px-5 py-3 text-secondary">{t.billing_cycle}</td>
            <td className="px-5 py-3 text-primary font-mono font-bold">{formatRupiah(t.amount)}</td>
            <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
            <td className="px-5 py-3 text-secondary font-mono">{formatDate(t.created_at)}</td>
          </>
        )}
      />
    </div>
  );
}

function LeadsModule({ stats, searchQuery }: { stats: AdminStats; searchQuery: string }) {
  const filtered = stats.recentInterest.filter((l) => l.email.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Lead & Interest</h1>
        <p className="text-secondary mt-1">User yang menunjukkan minat upgrade, untuk di-follow-up manual.</p>
      </div>
      <GenericTable
        columns={['Email', 'Paket Diminati', 'Siklus', 'Kode Promo', 'Tanggal']}
        data={filtered}
        renderRow={(l) => (
          <>
            <td className="px-5 py-3 text-primary">{l.email}</td>
            <td className="px-5 py-3 text-secondary">{PLAN_LABEL[l.plan] || l.plan}</td>
            <td className="px-5 py-3 text-secondary">{l.billing_cycle}</td>
            <td className="px-5 py-3 text-secondary font-mono">{l.promo_code || '-'}</td>
            <td className="px-5 py-3 text-secondary font-mono">{formatDate(l.created_at)}</td>
          </>
        )}
      />
    </div>
  );
}

function PromoModule({
  promoCodes, setPromoCodes, searchQuery,
}: {
  promoCodes: PromoCode[];
  setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
  searchQuery: string;
}) {
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percent' | 'fixed'>('percent');
  const [newValue, setNewValue] = useState('');
  const [newPlan, setNewPlan] = useState<PlanId | ''>('');
  const [newMaxRedemptions, setNewMaxRedemptions] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
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
      setNewCode(''); setNewValue(''); setNewPlan(''); setNewMaxRedemptions(''); setNewExpiresAt('');
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

  const filtered = promoCodes.filter((p) => p.code.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Promo Codes</h1>
        <p className="text-secondary mt-1">Kelola diskon yang benar-benar memotong harga checkout.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Buat Kode Baru</h3>
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{errorMsg}</div>
        )}
        <form className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-end" onSubmit={handleCreate}>
          <div className="space-y-2 xl:col-span-1">
            <label className="text-xs text-secondary font-medium">KODE</label>
            <input required type="text" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} maxLength={40} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-primary font-mono uppercase text-sm" placeholder="HEMAT25" />
          </div>
          <div className="space-y-2 xl:col-span-1">
            <label className="text-xs text-secondary font-medium">TIPE</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value as 'percent' | 'fixed')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-primary text-sm">
              <option value="percent">Persen (%)</option>
              <option value="fixed">Nominal (Rp)</option>
            </select>
          </div>
          <div className="space-y-2 xl:col-span-1">
            <label className="text-xs text-secondary font-medium">NILAI</label>
            <input required type="number" min={1} max={newType === 'percent' ? 100 : undefined} value={newValue} onChange={(e) => setNewValue(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-primary text-sm" placeholder={newType === 'percent' ? '25' : '20000'} />
          </div>
          <div className="space-y-2 xl:col-span-1">
            <label className="text-xs text-secondary font-medium">PAKET</label>
            <select value={newPlan} onChange={(e) => setNewPlan(e.target.value as PlanId | '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-primary text-sm">
              <option value="">Semua Paket</option>
              <option value="starter">Starter</option>
              <option value="pro_tahunan">Pro Tahunan</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div className="space-y-2 xl:col-span-1">
            <label className="text-xs text-secondary font-medium">BATAS</label>
            <input type="number" min={1} value={newMaxRedemptions} onChange={(e) => setNewMaxRedemptions(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-primary text-sm" placeholder="∞" />
          </div>
          <div className="xl:col-span-1">
            <button type="submit" disabled={creating} className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Buat
            </button>
          </div>
        </form>
      </div>

      <GenericTable
        columns={['Kode', 'Diskon', 'Paket', 'Terpakai', 'Status']}
        data={filtered}
        renderRow={(p: PromoCode) => (
          <>
            <td className="px-5 py-3 text-primary font-mono font-bold"><Tag className="w-3 h-3 text-accent inline mr-2" />{p.code}</td>
            <td className="px-5 py-3 font-mono">{p.discount_type === 'percent' ? `${p.discount_value}%` : formatRupiah(p.discount_value)}</td>
            <td className="px-5 py-3 text-secondary">{p.applies_to_plan ? (PLAN_LABEL[p.applies_to_plan] || p.applies_to_plan) : 'Semua'}</td>
            <td className="px-5 py-3 font-mono">{p.max_redemptions ? `${p.redeemed_count}/${p.max_redemptions}` : p.redeemed_count}</td>
            <td className="px-5 py-3">
              <span className={cn('px-2 py-0.5 rounded-sm text-xs font-bold uppercase', p.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                {p.active ? 'Aktif' : 'Nonaktif'}
              </span>
            </td>
          </>
        )}
        actions={(p: PromoCode) => (
          <>
            <button onClick={() => toggleActive(p)} title={p.active ? 'Nonaktifkan' : 'Aktifkan'} className="text-secondary hover:text-primary p-1"><Power className="w-4 h-4" /></button>
            <button onClick={() => deleteCode(p.id)} title="Hapus" className="text-secondary hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      />
    </div>
  );
}

function RbacModule({ admins }: { admins: string[] }) {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Admin & Akses</h1>
        <p className="text-secondary mt-1">Email yang punya akses ke panel ini.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 text-sm text-secondary">
        Menambah admin baru dilakukan lewat env var <code className="text-accent">ADMIN_EMAILS</code> di server, bukan dari sini — ini murni daftar baca. Tambahkan email lalu restart server untuk memberi akses.
      </div>

      <GenericTable
        columns={['Email']}
        data={admins.map((email) => ({ email }))}
        renderRow={(a: { email: string }) => (
          <td className="px-5 py-3 text-primary flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-accent" />{a.email}</td>
        )}
      />
    </div>
  );
}

function AnalyticsModule({ data }: { data: AnalyticsData }) {
  const prdChart = data.prdByDay.map((d) => ({ date: formatDate(d.day), count: d.count }));
  const signupChart = data.signupsByDay.map((d) => ({ date: formatDate(d.day), count: d.count }));
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Analytics</h1>
        <p className="text-secondary mt-1">Pemakaian produk dari data yang sebenarnya.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">PRD Dibuat per Hari</h3>
          <div className="h-64">
            {prdChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-secondary text-sm">Belum ada PRD pada rentang ini.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prdChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#070A12', borderColor: '#1e293b', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#F2542D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">User Baru per Hari</h3>
          <div className="h-64">
            {signupChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-secondary text-sm">Belum ada user baru pada rentang ini.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#070A12', borderColor: '#1e293b', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="count" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsModule() {
  const reports = [
    { name: 'Revenue Report', desc: 'Semua transaksi, paket, jumlah, dan status.', file: 'revenue.csv' },
    { name: 'User Growth Report', desc: 'Daftar user, paket, dan tanggal bergabung.', file: 'users.csv' },
    { name: 'PRD Usage Report', desc: 'Jumlah PRD dibuat per user.', file: 'prd-usage.csv' },
    { name: 'Promo Performance', desc: 'Semua kode promo dan jumlah pemakaiannya.', file: 'promo-performance.csv' },
  ];
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Reports</h1>
        <p className="text-secondary mt-1">Unduh data mentah sebagai CSV.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.file} className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-primary font-bold text-lg mb-2">{r.name}</h3>
              <p className="text-secondary text-sm">{r.desc}</p>
            </div>
            <a
              href={`/api/admin/reports/${r.file}`}
              className="self-end bg-background border border-border px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent hover:text-white transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditModule({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Audit Logs</h1>
        <p className="text-secondary mt-1">Riwayat aksi yang dilakukan lewat panel admin ini.</p>
      </div>
      <GenericTable
        columns={['Aktor', 'Aksi', 'Sumber Daya', 'Waktu']}
        data={logs}
        renderRow={(l: AuditLogEntry) => (
          <>
            <td className="px-5 py-3 text-primary">{l.actor_email}</td>
            <td className="px-5 py-3"><span className="px-2 py-0.5 bg-accent/10 text-accent rounded-sm text-xs font-bold uppercase">{l.action}</span></td>
            <td className="px-5 py-3 text-secondary font-mono">{l.resource}</td>
            <td className="px-5 py-3 text-secondary font-mono">{formatDate(l.created_at)}</td>
          </>
        )}
      />
    </div>
  );
}

function SettingsModule({ settings, onSaved }: { settings: AppSettings; onSaved: (s: AppSettings) => void }) {
  const [platformName, setPlatformName] = useState(settings.platform_name);
  const [supportEmail, setSupportEmail] = useState(settings.support_email);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformName, supportEmail }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Gagal menyimpan.');
      onSaved(body.settings);
      setSavedMsg('Pengaturan tersimpan.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Settings</h1>
        <p className="text-secondary mt-1">Konfigurasi umum platform.</p>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        {errorMsg && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{errorMsg}</div>}
        {savedMsg && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">{savedMsg}</div>}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-primary">Konfigurasi Umum</h3>
          <div className="space-y-2">
            <label className="text-sm text-secondary font-medium">Nama Platform</label>
            <input type="text" value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-secondary font-medium">Email Support</label>
            <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-primary" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-accent text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

function IntegrationsModule({ integrations }: { integrations: IntegrationStatus[] }) {
  const statusLabel: Record<string, string> = { online: 'Online', configured: 'Dikonfigurasi', not_configured: 'Belum Dikonfigurasi' };
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Integrations</h1>
        <p className="text-secondary mt-1">Status layanan yang benar-benar terhubung ke aplikasi ini.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {integrations.map((a) => (
          <div key={a.name} className="bg-card border border-border p-6 rounded-xl flex flex-col">
            <h3 className="text-primary font-bold text-lg flex items-center gap-2"><Wifi className="w-4 h-4 text-secondary" />{a.name}</h3>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', a.status !== 'not_configured' ? 'bg-emerald-500' : 'bg-red-500')} />
                <span className={cn('text-xs font-bold uppercase', a.status !== 'not_configured' ? 'text-emerald-400' : 'text-red-400')}>{statusLabel[a.status]}</span>
              </div>
              <div className="text-xs text-secondary font-mono">{a.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceModule({ stats }: { stats: AdminStats }) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<ReconcileResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runReconcile = async () => {
    setChecking(true);
    setErrorMsg(null);
    setResults(null);
    try {
      const res = await fetch('/api/admin/finance/reconcile?limit=10', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Gagal menjalankan rekonsiliasi.');
      setResults(body.results);
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menjalankan rekonsiliasi.');
    } finally {
      setChecking(false);
    }
  };

  const paidCount = stats.recentPayments.filter((p) => p.status === 'paid').length;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Finance</h1>
        <p className="text-secondary mt-1">Rekonsiliasi manual terhadap catatan Pakasir.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border border border-border rounded-xl overflow-hidden">
        <KpiCell title="Gross Revenue" value={formatRupiah(stats.totalRevenue)} icon={<DollarSign />} />
        <KpiCell title="Transaksi Lunas" value={paidCount} icon={<CreditCard />} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">Rekonsiliasi Pakasir</h3>
          <button
            onClick={runReconcile}
            disabled={checking}
            className="bg-accent hover:bg-accent/90 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
            Cek Sekarang
          </button>
        </div>
        {checking && (
          <p className="text-secondary text-sm mb-4">Memeriksa transaksi satu per satu ke Pakasir (rate limit ~4 detik/transaksi) — ini bisa makan waktu sampai 1 menit…</p>
        )}
        {errorMsg && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs mb-4">{errorMsg}</div>}
        {results && (
          <GenericTable
            columns={['Order ID', 'Tercatat', 'Di Pakasir', 'Status Pakasir', 'Cocok']}
            data={results}
            renderRow={(r: ReconcileResult) => (
              <>
                <td className="px-5 py-3 font-mono text-primary">{r.orderId}</td>
                <td className="px-5 py-3 font-mono">{formatRupiah(r.recordedAmount)}</td>
                <td className="px-5 py-3 font-mono">{r.pakasirAmount != null ? formatRupiah(r.pakasirAmount) : '-'}</td>
                <td className="px-5 py-3 text-secondary">{r.pakasirStatus}</td>
                <td className="px-5 py-3">
                  <span className={cn('px-2 py-1 rounded-sm text-xs font-bold uppercase', r.match ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                    {r.match ? 'Cocok' : 'Tidak Cocok'}
                  </span>
                </td>
              </>
            )}
          />
        )}
      </div>
    </div>
  );
}

function ContentModule({ items, setItems }: { items: ContentItem[]; setItems: React.Dispatch<React.SetStateAction<ContentItem[]>> }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Announcement');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems((prev) => [body.item, ...prev]);
        setTitle('');
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (item: ContentItem) => {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/admin/content/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      const body = await res.json();
      setItems((prev) => prev.map((i) => (i.id === item.id ? body.item : i)));
    }
  };

  const deleteItem = async (id: number) => {
    const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight font-display">Content</h1>
          <p className="text-secondary mt-1">Daftar internal — belum tampil ke pelanggan manapun.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row gap-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul konten" className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-primary text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="bg-background border border-border rounded-lg px-4 py-2 text-primary text-sm">
          <option>Announcement</option>
          <option>Onboarding</option>
          <option>Other</option>
        </select>
        <button type="submit" disabled={creating} className="bg-accent text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tambah
        </button>
      </form>

      <GenericTable
        columns={['Judul', 'Tipe', 'Status']}
        data={items}
        renderRow={(c: ContentItem) => (
          <>
            <td className="px-5 py-3 text-primary font-medium">{c.title}</td>
            <td className="px-5 py-3 text-secondary">{c.type}</td>
            <td className="px-5 py-3">
              <span className={cn('px-2 py-0.5 rounded-sm text-xs font-bold uppercase', c.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-border text-secondary')}>{c.status}</span>
            </td>
          </>
        )}
        actions={(c: ContentItem) => (
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => toggleStatus(c)} className="text-accent hover:underline text-xs font-medium">
              {c.status === 'published' ? 'Jadikan Draft' : 'Publikasikan'}
            </button>
            <button onClick={() => deleteItem(c.id)} className="text-secondary hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      />
    </div>
  );
}

// === SHELL ===

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_MENU: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'promo', label: 'Promo Codes', icon: Tag },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
  { id: 'leads', label: 'Lead & Interest', icon: Target },
  { id: 'content', label: 'Content', icon: FileCode },
  { id: 'integrations', label: 'Integrations', icon: Layers },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'rbac', label: 'Admin & Akses', icon: Shield },
  { id: 'audit', label: 'Audit Logs', icon: Terminal },
];

interface AdminViewProps {
  onLogout: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [days, setDays] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lazy-loaded on first visit to their tab, not part of the initial load.
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[] | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[] | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[] | null>(null);
  const [lazyLoading, setLazyLoading] = useState(false);

  const loadAll = (statsDays: string) => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/stats?days=${statsDays}`).then((r) => (r.ok ? r.json() : Promise.reject(r))),
      fetch('/api/admin/users').then((r) => (r.ok ? r.json() : Promise.reject(r))),
      fetch('/api/admin/promo-codes').then((r) => (r.ok ? r.json() : Promise.reject(r))),
      fetch('/api/admin/admins').then((r) => (r.ok ? r.json() : Promise.reject(r))),
    ])
      .then(([statsData, usersData, promoData, adminsData]) => {
        setStats(statsData);
        setUsers(usersData.users);
        setPromoCodes(promoData.promoCodes);
        setAdmins(adminsData.emails);
        setErrorMsg(null);
      })
      .catch(() => setErrorMsg('Gagal memuat data admin.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stats) return;
    fetch(`/api/admin/stats?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // Fetch each new module's data the first time its tab is opened.
  useEffect(() => {
    if (activeModule === 'analytics' && !analytics) {
      setLazyLoading(true);
      fetch(`/api/admin/analytics?days=${days}`).then((r) => r.json()).then(setAnalytics).finally(() => setLazyLoading(false));
    }
    if (activeModule === 'audit' && !auditLogs) {
      setLazyLoading(true);
      fetch('/api/admin/audit-logs').then((r) => r.json()).then((d) => setAuditLogs(d.logs)).finally(() => setLazyLoading(false));
    }
    if (activeModule === 'settings' && !settings) {
      setLazyLoading(true);
      fetch('/api/admin/settings').then((r) => r.json()).then((d) => setSettings(d.settings)).finally(() => setLazyLoading(false));
    }
    if (activeModule === 'integrations' && !integrations) {
      setLazyLoading(true);
      fetch('/api/admin/integrations').then((r) => r.json()).then((d) => setIntegrations(d.integrations)).finally(() => setLazyLoading(false));
    }
    if (activeModule === 'content' && !contentItems) {
      setLazyLoading(true);
      fetch('/api/admin/content').then((r) => r.json()).then((d) => setContentItems(d.items)).finally(() => setLazyLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]);

  const activeItem = SIDEBAR_MENU.find((m) => m.id === activeModule)!;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-primary flex overflow-hidden font-sans">
        {/* SIDEBAR */}
        <aside className={cn(
          'bg-card border-r border-border flex flex-col transition-all duration-300 z-20 shrink-0',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap cursor-pointer" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <div className="w-8 h-8 bg-accent rounded flex items-center justify-center font-bold text-white shrink-0 font-display">R</div>
              {isSidebarOpen && <span className="font-bold tracking-tight font-display">RotaLogic OS</span>}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {SIDEBAR_MENU.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveModule(item.id); setSearchQuery(''); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  activeModule === item.id ? 'bg-accent/10 text-accent font-bold' : 'text-secondary hover:bg-border/50 hover:text-primary'
                )}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-secondary hover:text-red-400 rounded-lg transition-colors hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Keluar</span>}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md w-full hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari di ${activeItem.label}...`}
                  className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
            {activeModule === 'dashboard' && (
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-sm">
                <Calendar className="w-4 h-4 text-secondary" />
                <select value={days} onChange={(e) => setDays(e.target.value)} className="bg-transparent text-primary outline-none cursor-pointer font-medium">
                  <option value="7">7 Hari Terakhir</option>
                  <option value="30">30 Hari Terakhir</option>
                  <option value="90">90 Hari Terakhir</option>
                </select>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-secondary animate-spin" /></div>
            ) : errorMsg ? (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{errorMsg}</div>
            ) : activeModule === 'dashboard' && stats ? (
              <DashboardModule stats={stats} />
            ) : activeModule === 'users' ? (
              <UsersModule users={users} searchQuery={searchQuery} />
            ) : activeModule === 'subscriptions' ? (
              <UsersModule users={users} searchQuery={searchQuery} subscriptionsOnly />
            ) : activeModule === 'transactions' && stats ? (
              <TransactionsModule stats={stats} searchQuery={searchQuery} />
            ) : activeModule === 'leads' && stats ? (
              <LeadsModule stats={stats} searchQuery={searchQuery} />
            ) : activeModule === 'promo' ? (
              <PromoModule promoCodes={promoCodes} setPromoCodes={setPromoCodes} searchQuery={searchQuery} />
            ) : activeModule === 'rbac' ? (
              <RbacModule admins={admins} />
            ) : activeModule === 'finance' && stats ? (
              <FinanceModule stats={stats} />
            ) : activeModule === 'reports' ? (
              <ReportsModule />
            ) : lazyLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-secondary animate-spin" /></div>
            ) : activeModule === 'analytics' && analytics ? (
              <AnalyticsModule data={analytics} />
            ) : activeModule === 'content' && contentItems ? (
              <ContentModule items={contentItems} setItems={setContentItems as React.Dispatch<React.SetStateAction<ContentItem[]>>} />
            ) : activeModule === 'integrations' && integrations ? (
              <IntegrationsModule integrations={integrations} />
            ) : activeModule === 'settings' && settings ? (
              <SettingsModule settings={settings} onSaved={setSettings} />
            ) : activeModule === 'audit' && auditLogs ? (
              <AuditModule logs={auditLogs} />
            ) : null}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};
