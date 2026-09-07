import React, { useState } from 'react';
import { FileText, Database, CheckSquare, Zap, ArrowRight, Sparkles, Trash2, FolderOpen, Clock } from 'lucide-react';
import { SavedDraftInfo } from '../types';

interface HeroViewProps {
  onStart: (initialIdea?: string) => void;
  savedDraft?: SavedDraftInfo | null;
  onResumeDraft?: () => void;
  onDiscardDraft?: () => void;
  userEmail?: string;
  userName?: string;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
}

export const HeroView: React.FC<HeroViewProps> = ({ 
  onStart, 
  savedDraft, 
  onResumeDraft, 
  onDiscardDraft, 
  userEmail,
  userName,
  isLoggedIn = false,
  onOpenAuthModal
}) => {
  const [quickIdea, setQuickIdea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onOpenAuthModal?.();
      return;
    }
    onStart(quickIdea);
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

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-8 lg:pt-16 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* LEFT COLUMN: Value Proposition & CTAs */}
        <section className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left z-20">
          {/* Version Badge & User Account Indicator */}
          <div className="flex flex-wrap items-center gap-2.5 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700/60 bg-slate-900/60 backdrop-blur-md">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-300">V1.0</span>
              <span className="text-slate-600 text-[9px]">•</span>
              <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">BY ROTALOGIC</span>
            </div>

            {isLoggedIn ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-emerald-300">
                  Akun: <strong className="text-white font-medium">{userName || userEmail}</strong>
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/40 backdrop-blur-md transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[11px] font-mono text-amber-300">
                  Wajib Masuk / Daftar (Google atau Email) →
                </span>
              </button>
            )}
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.12] tracking-tight text-white mb-6">
            Dari ide 1 kalimat jadi{' '}
            <span className="text-[#F2542D] drop-shadow-[0_0_20px_rgba(242,84,45,0.4)]">
              PRD matang
            </span>
            , lewat wawancara.
          </h1>

          {/* Subheading Paragraph */}
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed mb-6 max-w-xl">
            Jawab pertanyaan seperti diinterview CTO, lalu dapatkan dokumen PRD lengkap termasuk ERD, SQL, dan task list.
          </p>

          {/* SAVED DRAFT NOTIFICATION CARD */}
          {savedDraft && (
            <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#111A2E] to-[#0A0E1A] border border-[#F2542D]/40 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
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
                  {savedDraft.lastStep === 'interview' ? `Interview Kelompok ${savedDraft.interviewGroup}/5` : savedDraft.lastStep}
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

          {/* Quick Idea Input & Primary Action Area */}
          <form onSubmit={handleSubmit} className="w-full max-w-md mb-10 space-y-3">
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

            {/* Micro copy tags */}
            <p className="text-xs text-slate-400 tracking-wide flex items-center gap-2 pt-1 font-mono">
              <span>Cepat</span>
              <span className="text-slate-600">•</span>
              <span>Terstruktur</span>
              <span className="text-slate-600">•</span>
              <span>Siap untuk dikembangkan</span>
            </p>
          </form>

          {/* Four Key Features Highlight Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-white/[0.08] w-full">
            {/* Feature 1: PRD Lengkap */}
            <div className="flex flex-col items-start space-y-2 group">
              <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-300 group-hover:text-[#F2542D] group-hover:border-[#F2542D]/40 transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white tracking-wide">PRD</p>
                <p className="text-xs text-slate-400">Lengkap</p>
              </div>
            </div>

            {/* Feature 2: ERD & SQL */}
            <div className="flex flex-col items-start space-y-2 group">
              <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-300 group-hover:text-[#F2542D] group-hover:border-[#F2542D]/40 transition">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white tracking-wide">ERD &amp; SQL</p>
                <p className="text-xs text-slate-400">Siap pakai</p>
              </div>
            </div>

            {/* Feature 3: Task List */}
            <div className="flex flex-col items-start space-y-2 group">
              <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-300 group-hover:text-[#F2542D] group-hover:border-[#F2542D]/40 transition">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white tracking-wide">Task List</p>
                <p className="text-xs text-slate-400">Terstruktur</p>
              </div>
            </div>

            {/* Feature 4: Tanpa Backend */}
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
        </section>

        {/* RIGHT COLUMN: 3D Angled Technical Preview Mockup */}
        <section className="lg:col-span-6 xl:col-span-6 relative flex justify-center lg:justify-end terminal-perspective">
          {/* Glowing rim light behind card */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-[#F2542D]/25 via-transparent to-amber-500/15 blur-2xl pointer-events-none" />

          {/* Angled Terminal Slate */}
          <div className="terminal-skew relative w-full max-w-[540px] bg-[#0E1321]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] p-7 shadow-2xl text-slate-200 select-none">
            {/* Card Top Bar: Workflow Indicator & Motto */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-6 mb-6">
              {/* Workflow Steps */}
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

              {/* Monospace Philosophy Note */}
              <div className="font-mono text-[11px] leading-relaxed text-slate-400 text-right uppercase tracking-widest pl-4">
                <span className="text-slate-600">&#123;</span>
                <p className="text-slate-300">A CLEARER</p>
                <p className="text-slate-300">PRODUCT</p>
                <p className="text-slate-400">A BRIGHTER</p>
                <p className="text-slate-400">TOMORROW</p>
                <span className="text-slate-600">&#125;</span>
              </div>
            </div>

            {/* Prompt Interactive Shell Simulation */}
            <div className="mb-7 cursor-pointer" onClick={() => onStart(quickIdea)}>
              <div className="rounded-xl bg-[#090C16] border border-white/[0.08] p-4 font-mono text-xs shadow-inner hover:border-[#F2542D]/50 transition">
                <div className="flex items-center gap-2 text-[#F2542D] mb-1.5 font-semibold">
                  <span>&gt;</span>
                  <span className="text-slate-200">What will you build?</span>
                </div>
                <p className="text-slate-500 pl-4 italic">
                  {quickIdea || "Type your idea here..."}
                </p>
              </div>
            </div>

            {/* Card Mid/Bottom Split: Motto Tag & Checklist Sections */}
            <div className="grid grid-cols-12 gap-4 items-end pt-2">
              {/* Left slogan tag */}
              <div className="col-span-6 font-mono text-[11px] tracking-widest uppercase text-slate-400">
                <p>TURN IDEAS</p>
                <p className="text-slate-300 font-bold">INTO REAL PRODUCTS</p>
                <div className="w-8 h-[2px] bg-[#F2542D] mt-2" />
              </div>

              {/* Right checklist of generated PRD chapters */}
              <div className="col-span-6 font-mono text-xs space-y-2 text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-3 h-[1px] bg-slate-600" />
                  <span>PRODUCT</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-3 h-[1px] bg-slate-600" />
                  <span>USERS</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-3 h-[1px] bg-slate-600" />
                  <span>FEATURES</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-3 h-[1px] bg-slate-600" />
                  <span>DATABASE</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-3 h-[1px] bg-slate-600" />
                  <span>ARCHITECTURE</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-3 h-[1px] bg-slate-600" />
                  <span>ROADMAP</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
