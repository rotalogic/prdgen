import React from 'react';
import { X, Settings, User as UserIcon, LogOut, LogIn } from 'lucide-react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F1424] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B101D]">
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="font-display font-bold text-base text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto leading-relaxed text-xs sm:text-sm space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}> = ({
  isOpen,
  onClose,
  user,
  isLoggedIn = false,
  onOpenAuthModal,
  onLogout
}) => {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan & Preferensi"
      icon={<Settings className="w-5 h-5 text-amber-400" />}
    >
      <div className="space-y-5">
        {/* User Account & Authentication */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span>Akun Pengguna &amp; Autentikasi Cloud</span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isLoggedIn
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-950/70 text-amber-300 border-amber-500/30'
            }`}>
              {isLoggedIn ? 'Terautentikasi' : 'Belum Masuk'}
            </span>
          </div>

          {isLoggedIn && user ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || user.email || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F2542D] to-amber-500 text-white flex items-center justify-center text-sm font-bold">
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.displayName || 'Pengguna RotaLogic'}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Provider: {user.providerData?.[0]?.providerId === 'google' ? 'Google Sign-In' : 'Email/Password'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout?.();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Daftar atau masuk dengan email Anda untuk menyimpan draf PRD ke akun dan mengaksesnya dari perangkat manapun.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthModal?.();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Daftar / Masuk dengan Email</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-white">Bahasa Dokumen</label>
          <select className="w-full bg-[#080C16] border border-slate-700 rounded-lg p-2 text-xs text-slate-200">
            <option>Bahasa Indonesia (Standar)</option>
            <option>English (International PRD)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-white">Format Ekspor Default</label>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <input type="radio" name="exportFormat" defaultChecked className="text-[#F2542D] focus:ring-0" />
              <span>Markdown (.md) + SQL (.sql)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="exportFormat" className="text-[#F2542D] focus:ring-0" />
              <span>JSON Bundle</span>
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F2542D] hover:bg-[#ff6742] text-white text-xs font-semibold rounded-lg cursor-pointer"
            type="button"
          >
            Selesai
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
