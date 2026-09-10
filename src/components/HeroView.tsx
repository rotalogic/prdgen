import React, { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import { FileText, Database, CheckSquare, Zap, ArrowRight, Sparkles, Trash2, FolderOpen, Clock, Users, Star, History } from 'lucide-react';
import { SavedDraftInfo, SavedPrdSummary } from '../types';

interface HomepageStats {
  totalUsers: number;
  totalGenerated: number;
  reviewCount: number;
  averageRating: number;
}

interface HeroViewProps {
  onStart: (initialIdea?: string) => void;
  savedDraft?: SavedDraftInfo | null;
  onResumeDraft?: () => void;
  onDiscardDraft?: () => void;
  savedPrds?: SavedPrdSummary[];
  onOpenSavedPrd?: (id: number) => void;
  userEmail?: string;
  userName?: string;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
}

// 3D Spline scene sitting behind the hero content. Public placeholder scene —
// a custom RotaLogic-branded one would need to be designed in Spline.design.
function HeroSplineBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <Spline
        style={{ width: '100%', height: '100%' }}
        scene="https://prod.spline.design/dJqTIQ-tE3ULUPMi/scene.splinecode"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, rgba(7,10,18,0.6), transparent 35%, transparent 70%, rgba(7,10,18,0.6)),
            linear-gradient(to bottom, transparent 55%, rgba(7,10,18,0.95))
          `,
        }}
      />
    </div>
  );
}

export const HeroView: React.FC<HeroViewProps> = ({
  onStart,
  savedDraft,
  onResumeDraft,
  onDiscardDraft,
  savedPrds = [],
  onOpenSavedPrd,
  isLoggedIn = false,
  onOpenAuthModal
}) => {
  const [quickIdea, setQuickIdea] = useState('');
  const [stats, setStats] = useState<HomepageStats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  const startOrGate = (idea?: string) => {
    if (!isLoggedIn) {
      onOpenAuthModal?.();
      return;
    }
    onStart(idea);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startOrGate(quickIdea);
  };

  const formatSavedTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatSavedDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative">
      {/* 3D HERO */}
      <div className="relative min-h-[92vh] flex items-center">
        <HeroSplineBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 w-full pointer-events-none">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">

            {/* LEFT: Headline */}
            <div className="w-full lg:w-5/12 pointer-events-auto">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.12] tracking-tight text-white mb-4">
                Dari ide 1 kalimat jadi{' '}
                <span className="text-[#F2542D] drop-shadow-[0_0_20px_rgba(242,84,45,0.4)]">
                  PRD matang
                </span>
                , lewat wawancara.
              </h1>

              <p className="font-mono text-xs text-slate-400 tracking-widest uppercase">
                PRD · ERD · SQL · TASK LIST
              </p>
            </div>

            {/* RIGHT: Pitch, draft resume, quick-start */}
            <div className="w-full lg:w-7/12 flex flex-col items-start pointer-events-auto">
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-6 max-w-xl">
                Jawab pertanyaan seperti diinterview CTO, lalu dapatkan dokumen PRD lengkap termasuk ERD, SQL, dan task list.
              </p>

              {savedDraft && (
                <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#111A2E] to-[#0A0E1A] border border-[#F2542D]/40 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2542D]/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold">
                      <FolderOpen className="w-4 h-4 text-[#F2542D]" />
                      <span>Draf Tersimpan di Akunmu</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatSavedTime(savedDraft.savedAt)}</span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-white mb-2 line-clamp-1">
                    {savedDraft.projectName || 'Draf Spesifikasi Teknis Produk'}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/80">
                      {savedDraft.productTypeId.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/80">
                      {savedDraft.frontendId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/80">
                      {savedDraft.databaseId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#F2542D]/20 text-[#ff8e73] border border-[#F2542D]/30">
                      {savedDraft.lastStep === 'interview' ? `Interview Kelompok ${savedDraft.interviewGroup}/6` : savedDraft.lastStep}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={onResumeDraft}
                      className="flex-1 py-2 px-3.5 bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(242,84,45,0.3)] transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Lanjutkan Draf Ini</span>
                    </button>
                    <button
                      type="button"
                      onClick={onDiscardDraft}
                      className="py-2 px-3 bg-slate-800/80 hover:bg-red-950/40 hover:text-red-300 hover:border-red-500/40 text-slate-400 text-xs rounded-xl border border-slate-700/80 transition cursor-pointer flex items-center gap-1"
                      title="Hapus draf lama"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={quickIdea}
                    onChange={(e) => setQuickIdea(e.target.value)}
                    placeholder="Punya ide? Ketik di sini (cth: Airbnb untuk sewa alat camping)..."
                    className="w-full bg-[#0E1424]/90 border border-slate-700/80 rounded-xl px-4 py-3.5 pr-28 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] focus:ring-1 focus:ring-[#F2542D] shadow-lg backdrop-blur-sm transition"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(242,84,45,0.4)] hover:shadow-[0_0_20px_rgba(242,84,45,0.6)] transition-all"
                  >
                    <span>{savedDraft ? 'Ide Baru' : 'Mulai'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 tracking-wide flex items-center gap-2 pt-1 font-mono">
                  <span>Cepat</span>
                  <span className="text-slate-600">•</span>
                  <span>Terstruktur</span>
                  <span className="text-slate-600">•</span>
                  <span>Siap untuk dikembangkan</span>
                </p>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* BELOW THE FOLD: technical preview + feature chips */}
      <div className="relative z-10 bg-[#070A12]" style={{ marginTop: '-8vh' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 pb-16">
          {/* Angled Terminal Slate */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-[#F2542D]/25 via-transparent to-amber-500/15 blur-2xl pointer-events-none" />
            <div className="relative bg-[#0E1321]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] p-7 shadow-2xl text-slate-200">
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-6 mb-6">
                <div className="font-mono text-xs space-y-1.5 text-slate-300 tracking-wider">
                  <div className="text-slate-400 font-semibold">IDE</div>
                  <div className="text-white flex items-center gap-1.5 font-medium">
                    <span className="text-[#F2542D]">→</span> INTERVIEW
                  </div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-[#F2542D]">→</span> PRD
                  </div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-[#F2542D]">→</span> BUILD
                  </div>
                </div>

                <div className="font-mono text-[11px] leading-relaxed text-slate-400 text-right uppercase tracking-widest pl-4">
                  <span className="text-slate-600">&#123;</span>
                  <p className="text-slate-300">SIAP PAKAI</p>
                  <p className="text-slate-300">BUKAN DRAF</p>
                  <p className="text-slate-400">PRD · ERD</p>
                  <p className="text-slate-400">SQL · TASK</p>
                  <span className="text-slate-600">&#125;</span>
                </div>
              </div>

              <div className="mb-7 cursor-pointer" onClick={() => startOrGate(quickIdea)}>
                <div className="rounded-xl bg-[#090C16] border border-white/[0.08] p-4 font-mono text-xs shadow-inner hover:border-[#F2542D]/50 transition">
                  <div className="flex items-center gap-2 text-[#F2542D] mb-1.5 font-semibold">
                    <span>&gt;</span>
                    <span className="text-slate-200">Apa yang ingin kamu bangun?</span>
                  </div>
                  <p className="text-slate-500 pl-4 italic">
                    {quickIdea || "Ketik ide kamu di sini..."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-end pt-2">
                <div className="col-span-12 sm:col-span-6 font-mono text-[11px] tracking-widest uppercase text-slate-400">
                  <p>DIBAHAS DI</p>
                  <p className="text-slate-300 font-bold">WAWANCARA</p>
                  <div className="w-8 h-[2px] bg-[#F2542D] mt-2" />
                </div>

                <div className="col-span-12 sm:col-span-6 font-mono text-xs space-y-2 text-slate-400">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-3 h-[1px] bg-slate-600" />
                    <span>PRODUK</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-3 h-[1px] bg-slate-600" />
                    <span>PENGGUNA</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-3 h-[1px] bg-slate-600" />
                    <span>FITUR</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-3 h-[1px] bg-slate-600" />
                    <span>DATABASE</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-3 h-[1px] bg-slate-600" />
                    <span>ARSITEKTUR</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-3 h-[1px] bg-slate-600" />
                    <span>ROADMAP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Four Key Features Highlight Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-10 mt-2 border-t border-white/[0.08]">
            <div className="flex flex-col items-start space-y-2 group">
              <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-300 group-hover:text-[#F2542D] group-hover:border-[#F2542D]/40 transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white tracking-wide">PRD</p>
                <p className="text-xs text-slate-400">Lengkap</p>
              </div>
            </div>

            <div className="flex flex-col items-start space-y-2 group">
              <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-300 group-hover:text-[#F2542D] group-hover:border-[#F2542D]/40 transition">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white tracking-wide">ERD &amp; SQL</p>
                <p className="text-xs text-slate-400">Siap pakai</p>
              </div>
            </div>

            <div className="flex flex-col items-start space-y-2 group">
              <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-300 group-hover:text-[#F2542D] group-hover:border-[#F2542D]/40 transition">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white tracking-wide">Task List</p>
                <p className="text-xs text-slate-400">Terstruktur</p>
              </div>
            </div>

            <div className="flex flex-col items-start space-y-2 group">
              <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-300 group-hover:text-[#F2542D] group-hover:border-[#F2542D]/40 transition">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white tracking-wide">Tanpa Backend</p>
                <p className="text-xs text-slate-400">Langsung hasil</p>
              </div>
            </div>
          </div>

          {/* Real usage stats — no data yet, no section (nothing to fake here) */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-10 mt-2 border-t border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-[#F2542D] shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">{stats.totalUsers.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-slate-400">Pengguna terdaftar</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-[#F2542D] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">{stats.totalGenerated.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-slate-400">PRD berhasil dibuat</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-[#F2542D] shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-white">
                    {stats.reviewCount > 0 ? `${stats.averageRating.toFixed(1)} / 5` : '—'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {stats.reviewCount > 0 ? `Dari ${stats.reviewCount.toLocaleString('id-ID')} ulasan` : 'Belum ada ulasan'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PRD history — saved to the account, reopenable after logging
              back in. Only shown when the user actually has any. */}
          {isLoggedIn && savedPrds.length > 0 && (
            <div className="pt-10 mt-2 border-t border-white/[0.08]">
              <h2 className="flex items-center gap-2 text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">
                <History className="w-4 h-4 text-[#F2542D]" />
                <span>PRD Tersimpan di Akunmu</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedPrds.map((prd) => (
                  <button
                    key={prd.id}
                    type="button"
                    onClick={() => onOpenSavedPrd?.(prd.id)}
                    className="text-left p-4 rounded-xl bg-[#101626] border border-slate-800 hover:border-[#F2542D]/50 transition flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{prd.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/80">{prd.productType}</span>
                        <span>{formatSavedDate(prd.createdAt)}</span>
                      </div>
                    </div>
                    <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
