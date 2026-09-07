import React from 'react';
import { X, BookOpen, Clock, Settings, Save, Check, ExternalLink, HelpCircle, Key, Mountain, ShieldCheck, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { AiConfig } from '../types';

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

export const DocsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <ModalWrapper
    isOpen={isOpen}
    onClose={onClose}
    title="Panduan & Dokumentasi PRD Generator"
    icon={<BookOpen className="w-5 h-5 text-[#F2542D]" />}
  >
    <div className="space-y-4 text-slate-300">
      <p>
        <strong>PRD Generator by RotaLogic</strong> dirancang untuk menjembatani ide awal menjadi dokumen spesifikasi teknis siap koding dalam hitungan menit lewat wawancara terarah.
      </p>

      <div className="space-y-2">
        <h4 className="font-bold text-white text-sm">Alur Kerja 4 Langkah:</h4>
        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-400">
          <li><strong>Pilih Stack Dasar:</strong> Tentukan jenis produk, frontend, dan database. Sintaks SQL dan arsitektur akan otomatis disesuaikan.</li>
          <li><strong>Sesi Interview 5 Kelompok:</strong> Jawab pertanyaan seputar masalah, momen &quot;Aha&quot;, entitas data, batasan infrastruktur, dan preferensi arsitektur.</li>
          <li><strong>Interaktif Field Builder:</strong> Kelola nama tabel, tipe data (UUID/VARCHAR/TIMESTAMP), primary key, dan foreign key secara langsung.</li>
          <li><strong>Export Artefak Lengkap:</strong> Dapatkan PRD (.md), ERD Mermaid, DDL SQL (.sql), Task Sprint List, dan Analisis Risiko.</li>
        </ol>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
        💡 <strong>Tips CTO:</strong> Jangan ragu mengisi batasan secara spesifik. Menentukan apa yang <em>tidak dibangun</em> di V1 adalah kunci keberhasilan rilis tepat waktu.
      </div>
    </div>
  </ModalWrapper>
);

export const ChangelogModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <ModalWrapper
    isOpen={isOpen}
    onClose={onClose}
    title="Changelog & Versi Rilis"
    icon={<Clock className="w-5 h-5 text-sky-400" />}
  >
    <div className="space-y-6">
      <div className="border-l-2 border-[#F2542D] pl-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white text-sm">V1.0.0</span>
          <span className="text-[10px] bg-[#F2542D]/20 text-[#F2542D] px-2 py-0.5 rounded font-mono font-bold">LATEST</span>
        </div>
        <p className="text-[11px] text-slate-500 font-mono">Rilis Perdana • RotaLogic Engine</p>
        <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1 pt-2">
          <li>Hero landing page dengan 3D perspective terminal preview.</li>
          <li>Wizard 4 tahap: Jenis Produk, Frontend, Database, dan Ringkasan Stack.</li>
          <li>Interview 5 Kelompok terstruktur dengan interactive Field &amp; Entity builder.</li>
          <li>Live ERD canvas visual &amp; Mermaid diagram parser.</li>
          <li>Multi-database SQL schema generator (PostgreSQL, MySQL, SQLite, Supabase).</li>
          <li>Task list &amp; sprint backlog dengan checklist interaktif.</li>
          <li>Full markdown exporter &amp; single-click artifact packager.</li>
        </ul>
      </div>
    </div>
  </ModalWrapper>
);

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  backgroundMode?: string;
  onSetBackgroundMode?: (mode: any) => void;
  onResetToOriginal?: () => void;
  customApiKey?: string;
  aiConfig?: AiConfig;
  onOpenApiKeyDialog?: () => void;
  user?: any;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}> = ({
  isOpen,
  onClose,
  backgroundMode,
  onSetBackgroundMode,
  onResetToOriginal,
  customApiKey,
  aiConfig,
  onOpenApiKeyDialog,
  user,
  isLoggedIn = false,
  onOpenAuthModal,
  onLogout
}) => {
  const activeProvider = aiConfig?.provider || (customApiKey ? 'gemini' : 'gemini');
  const hasCustomConfig = Boolean(
    aiConfig?.apiKey || 
    (aiConfig?.provider === 'custom' && aiConfig?.customBaseUrl) || 
    customApiKey
  );

  const getProviderDescription = () => {
    if (!hasCustomConfig) {
      return 'Menggunakan model Gemini default lingkungan server RotaLogic untuk memperkaya analisis PRD.';
    }
    if (activeProvider === 'gemini') {
      return `Model aktif: Google Gemini (${aiConfig?.model || 'gemini-2.5-flash'}). Kunci pribadi Anda aktif.`;
    }
    if (activeProvider === 'openai') {
      return `Model aktif: OpenAI ${aiConfig?.model || 'gpt-4o-mini'}. Kunci API pribadi Anda aktif.`;
    }
    if (activeProvider === 'claude') {
      return `Model aktif: Anthropic Claude (${aiConfig?.model || 'claude-3-5-sonnet'}). Kunci API pribadi Anda aktif.`;
    }
    if (activeProvider === 'custom') {
      return `Model aktif: Endpoint Kustom (${aiConfig?.customModel || 'custom'}). Base URL: ${aiConfig?.customBaseUrl || '-'}.`;
    }
    return 'Kunci kustom aktif.';
  };

  const getProviderBadgeLabel = () => {
    if (!hasCustomConfig) return 'Default Lingkungan';
    if (activeProvider === 'gemini') return 'Gemini Kustom';
    if (activeProvider === 'openai') return 'OpenAI GPT';
    if (activeProvider === 'claude') return 'Claude';
    if (activeProvider === 'custom') return 'Kustom API';
    return 'Kustom Aktif';
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan & Preferensi"
      icon={<Settings className="w-5 h-5 text-amber-400" />}
    >
      <div className="space-y-5">
        {/* User Account & Firebase Authentication */}
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
                    Provider: {user.providerData?.[0]?.providerId === 'google.com' ? 'Google Sign-In' : 'Email/Password'}
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
                Daftar atau masuk melalui Google atau alamat email Anda untuk menyimpan draf PRD ke Firebase Cloud Firestore dan mengaksesnya dari perangkat manapun.
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
                <span>Daftar / Masuk (Google atau Email)</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Key & Multi-Provider Section */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#F2542D]" />
              <span>Penyedia AI &amp; Kunci API (Gemini, GPT, Claude, Custom)</span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              hasCustomConfig
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {getProviderBadgeLabel()}
            </span>
          </div>
          
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {getProviderDescription()}
          </p>

          <button
            id="settings-open-api-key-dialog-btn"
            type="button"
            onClick={onOpenApiKeyDialog}
            className="w-full py-2.5 px-3 rounded-lg border border-[#F2542D]/40 bg-[#F2542D]/10 hover:bg-[#F2542D]/20 text-[#ff8e73] hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasCustomConfig ? 'Ubah Penyedia AI / Kunci API (Buka Dialog)' : 'Atur Penyedia AI & Kunci Pribadi (Buka Dialog)'}</span>
          </button>
        </div>

        {/* Backup & Wallpaper Section */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Mountain className="w-4 h-4 text-slate-300" />
              <span>Latar Belakang &amp; Cadangan</span>
            </span>
            <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              Cadangan Tersedia
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            File cadangan tampilan awal telah tersimpan di <code className="text-emerald-300 font-mono">src/App.backup.tsx</code>. Anda dapat beralih tema visual kapan pun.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSetBackgroundMode?.('cosmic_lava')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                backgroundMode === 'cosmic_lava'
                  ? 'bg-[#F2542D]/20 border-[#F2542D] text-white font-medium'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Mountain className="w-3.5 h-3.5 text-[#F2542D]" />
              <span>Tema Kosmik</span>
            </button>
            <button
              type="button"
              onClick={() => onResetToOriginal?.()}
              className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                backgroundMode === 'default_minimal'
                  ? 'bg-amber-500/20 border-amber-500 text-white font-medium'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Tampilan Standar</span>
            </button>
          </div>
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
