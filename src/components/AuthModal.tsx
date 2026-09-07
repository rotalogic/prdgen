import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  title?: string;
  description?: string;
  preventClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register',
  title,
  description,
  preventClose = false,
}) => {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    resetPassword, 
    formatAuthError 
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/auth-status')
      .then((res) => res.json())
      .then((data) => setGoogleEnabled(Boolean(data?.googleEnabled)))
      .catch(() => setGoogleEnabled(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleGoogleAuth = async () => {
    resetFormState();
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email Anda.');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      try {
        await resetPassword(cleanEmail);
        setSuccessMessage('Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.');
      } catch (err: any) {
        setErrorMessage(formatAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMessage('Kata sandi harus terdiri dari minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
        return;
      }

      setIsSubmitting(true);
      try {
        await registerWithEmail(cleanEmail, password, name.trim());
        setSuccessMessage('Pendaftaran berhasil! Selamat datang di RotaLogic.');
        setTimeout(() => {
          onClose();
        }, 600);
      } catch (err: any) {
        setErrorMessage(formatAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Login mode
      setIsSubmitting(true);
      try {
        await loginWithEmail(cleanEmail, password);
        onClose();
      } catch (err: any) {
        setErrorMessage(formatAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="auth-modal"
        className="w-full max-w-md bg-[#0E1526] border border-slate-700/90 rounded-2xl shadow-2xl p-6 text-slate-100 relative space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        {!preventClose && (
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Tutup"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F2542D] to-amber-500 text-white shadow-lg shadow-[#F2542D]/20 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight">
            {title || (mode === 'register' ? 'Daftar Akun RotaLogic' : mode === 'login' ? 'Masuk ke RotaLogic' : 'Atur Ulang Kata Sandi')}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {description || (mode === 'register' 
              ? 'Daftar dengan email Anda untuk mulai menyusun PRD & menyimpan progres arsitektur.'
              : mode === 'login'
              ? 'Masuk untuk mengakses draf PRD, rekomendasi arsitektur, dan ekspor dokumen.'
              : 'Masukkan email Anda untuk menerima instruksi reset kata sandi.')}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only if not in forgot password mode) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              type="button"
              id="auth-tab-register"
              onClick={() => {
                setMode('register');
                resetFormState();
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#F2542D] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daftar Akun Baru
            </button>
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => {
                setMode('login');
                resetFormState();
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#F2542D] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Masuk
            </button>
          </div>
        )}

        {/* Google Authentication Button */}
        {mode !== 'forgot' && (
          <div className="space-y-3 pt-1">
            <button
              id="auth-google-btn"
              type="button"
              onClick={handleGoogleAuth}
              disabled={!googleEnabled || isGoogleSubmitting || isSubmitting}
              title={googleEnabled ? undefined : 'Google sign-in belum dikonfigurasi. Gunakan email dan kata sandi.'}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs transition flex items-center justify-center gap-3 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              {isGoogleSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>
                {isGoogleSubmitting
                  ? 'Menghubungkan ke Google...'
                  : !googleEnabled
                  ? 'Google sign-in belum tersedia'
                  : mode === 'register'
                  ? 'Daftar dengan Google'
                  : 'Lanjutkan dengan Google'}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                atau gunakan email
              </span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>
          </div>
        )}

        {/* Feedback Alert Messages */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name Field (Register Only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Nama Lengkap</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full bg-[#080C16] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                  autoComplete="name"
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3" />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Alamat Email</label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full bg-[#080C16] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                autoComplete="email"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
            </div>
          </div>

          {/* Password Field */}
          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Kata Sandi</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      resetFormState();
                    }}
                    className="text-[11px] text-[#F2542D] hover:underline cursor-pointer"
                  >
                    Lupa kata sandi?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                  required
                  className="w-full bg-[#080C16] border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded text-slate-400 hover:text-white absolute right-2.5 cursor-pointer"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password Field (Register Only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Konfirmasi Kata Sandi</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi Anda"
                  required
                  className="w-full bg-[#080C16] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                  autoComplete="new-password"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F2542D] hover:bg-[#ff6742] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-[#F2542D]/20 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>
              {isSubmitting 
                ? 'Memproses...' 
                : mode === 'register' 
                ? 'Daftar Sekarang' 
                : mode === 'login'
                ? 'Masuk ke Akun'
                : 'Kirim Tautan Reset'}
            </span>
          </button>
        </form>

        {/* Back to Login link when in Forgot mode */}
        {mode === 'forgot' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetFormState();
              }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              ← Kembali ke menu Masuk
            </button>
          </div>
        )}

        {/* Privacy & Cloud Sync Guarantee */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Kata sandi disimpan terenkripsi. Draf tersimpan otomatis ke akunmu.</span>
        </div>
      </div>
    </div>
  );
};
