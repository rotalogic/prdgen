import React, { useEffect, useState } from 'react';
import { LogOut, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { AdminView } from './components/AdminView';

const LoginForm: React.FC = () => {
  const { loginWithEmail, formatAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 rounded-2xl bg-[#101626] border border-slate-800">
        <h1 className="font-display text-xl font-bold text-white mb-1">Admin RotaLogic</h1>
        <p className="text-xs text-slate-400 mb-6">Masuk dengan akun yang punya akses admin.</p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <label className="block text-[11px] text-slate-400 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#F2542D]"
          placeholder="nama@email.com"
        />

        <label className="block text-[11px] text-slate-400 mb-1.5">Kata Sandi</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-6 px-3 py-2 rounded-lg bg-[#0B0F1B] border border-slate-700 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#F2542D]"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Masuk
        </button>
      </form>
    </div>
  );
};

const AccessDenied: React.FC = () => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-[#101626] border border-slate-800 text-center">
        <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <h1 className="font-display text-lg font-bold text-white mb-1">Akses Ditolak</h1>
        <p className="text-xs text-slate-400 mb-5">Akun ini tidak terdaftar sebagai admin.</p>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar
        </button>
      </div>
    </div>
  );
};

export const AdminApp: React.FC = () => {
  const { user, loading, isLoggedIn, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsAdmin(null);
      return;
    }
    fetch('/api/admin/check')
      .then((res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((data) => setIsAdmin(!!data.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [isLoggedIn, user?.uid]);

  if (loading || (isLoggedIn && isAdmin === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 sm:px-8 lg:px-12 py-4 border-b border-slate-800">
        <span className="font-display text-sm font-bold text-white">Admin RotaLogic</span>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar
        </button>
      </div>
      <AdminView />
    </div>
  );
};
