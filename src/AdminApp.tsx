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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center font-bold text-white text-2xl font-display">R</div>
        </div>
        <h1 className="text-2xl font-bold text-primary text-center mb-1 tracking-tight font-display">RotaLogic OS</h1>
        <p className="text-xs text-secondary text-center mb-8">Masuk dengan akun yang punya akses admin.</p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-primary text-sm placeholder:text-secondary focus:outline-none focus:border-accent transition-colors"
            placeholder="nama@email.com"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-primary text-sm placeholder:text-secondary focus:outline-none focus:border-accent transition-colors"
            placeholder="••••••••"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

const AccessDenied: React.FC = () => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border text-center">
        <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <h1 className="font-display text-lg font-bold text-primary mb-1">Akses Ditolak</h1>
        <p className="text-xs text-secondary mb-5">Akun ini tidak terdaftar sebagai admin.</p>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-primary text-xs font-semibold hover:bg-border/50 transition-colors"
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-secondary animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return <AdminView onLogout={() => logout()} />;
};
