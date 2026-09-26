import React from 'react';
import { FileText, FolderOpen, Clock, Trash2, Plus, LayoutGrid } from 'lucide-react';
import { SavedDraftInfo, SavedPrdSummary } from '../types';

interface DashboardViewProps {
  userName?: string;
  savedDraft?: SavedDraftInfo | null;
  onResumeDraft?: () => void;
  onDiscardDraft?: () => void;
  savedPrds?: SavedPrdSummary[];
  onOpenSavedPrd?: (id: number) => void;
  onStartNew: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userName,
  savedDraft,
  onResumeDraft,
  onDiscardDraft,
  savedPrds = [],
  onOpenSavedPrd,
  onStartNew
}) => {
  const formatSavedTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const hasNothingYet = !savedDraft && savedPrds.length === 0;

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12 w-full">
      {/* Header row: greeting + primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1.5">
            Dashboard{userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-sm text-slate-400">
            {savedPrds.length > 0
              ? `${savedPrds.length} PRD tersimpan di akunmu.`
              : 'Belum ada PRD tersimpan di akunmu.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onStartNew}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-sm shadow-[0_0_20px_rgba(242,84,45,0.35)] hover:shadow-[0_0_30px_rgba(242,84,45,0.55)] transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat PRD Baru</span>
        </button>
      </div>

      {/* In-progress draft */}
      {savedDraft && (
        <div className="mb-10">
          <h2 className="flex items-center gap-2 text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">
            <Clock className="w-4 h-4 text-[#F2542D]" />
            <span>Draf Belum Selesai</span>
          </h2>
          <div className="w-full max-w-xl p-4 rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#111A2E] to-[#0A0E1A] border border-[#F2542D]/40 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2542D]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2 relative">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold">
                <FolderOpen className="w-4 h-4 text-[#F2542D]" />
                <span>Draf Tersimpan</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{formatSavedTime(savedDraft.savedAt)}</span>
              </div>
            </div>

            <p className="text-xs font-bold text-white mb-2 line-clamp-1 relative">
              {savedDraft.projectName || 'Draf Spesifikasi Teknis Produk'}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[10px] font-mono relative">
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

            <div className="flex items-center gap-2 pt-1 border-t border-white/[0.08] relative">
              <button
                type="button"
                onClick={onResumeDraft}
                className="flex-1 py-2 px-3.5 bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(242,84,45,0.3)] transition cursor-pointer"
              >
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
        </div>
      )}

      {/* Saved PRDs */}
      <div>
        <h2 className="flex items-center gap-2 text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">
          <LayoutGrid className="w-4 h-4 text-[#F2542D]" />
          <span>PRD Tersimpan</span>
        </h2>

        {savedPrds.length > 0 ? (
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
        ) : hasNothingYet ? (
          <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-slate-800 bg-[#0E1424]/40 text-center">
            <div className="w-11 h-11 rounded-xl bg-[#F2542D]/10 border border-[#F2542D]/25 flex items-center justify-center text-[#F2542D] mx-auto mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-white mb-1.5">Belum ada PRD di sini</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-5">
              Setiap PRD yang kamu buat akan otomatis tersimpan di akun ini dan muncul di dashboard, dan tetap bisa dibuka lagi kapan saja.
            </p>
            <button
              type="button"
              onClick={onStartNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat PRD Pertamamu</span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Belum ada PRD selesai, tapi draf di atas masih menunggu dilanjutkan.</p>
        )}
      </div>
    </div>
  );
};
