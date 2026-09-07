import React, { useState } from 'react';
import { PRODUCT_TYPES, FRONTEND_OPTIONS, DATABASE_OPTIONS } from '../data/constants';
import { ArrowLeft, ArrowRight, Globe, Database, Server, Check, Copy, CheckCheck, RefreshCw } from 'lucide-react';
import { WizardStep } from '../types';

interface StepSummaryProps {
  productTypeId: string;
  frontendId: string;
  databaseId: string;
  onBack: () => void;
  onStartInterview: () => void;
  onJumpToStep: (step: WizardStep) => void;
}

export const StepSummary: React.FC<StepSummaryProps> = ({
  productTypeId,
  frontendId,
  databaseId,
  onBack,
  onStartInterview,
  onJumpToStep
}) => {
  const [copied, setCopied] = useState(false);

  const prodType = PRODUCT_TYPES.find(p => p.id === productTypeId) || PRODUCT_TYPES[0];
  const frontend = FRONTEND_OPTIONS.find(f => f.id === frontendId) || FRONTEND_OPTIONS[0];
  const database = DATABASE_OPTIONS.find(d => d.id === databaseId) || DATABASE_OPTIONS[0];

  let backendTitle = 'Next.js API Routes';
  let backendDesc = 'Dipilih otomatis berdasarkan frontend Next.js.';
  if (frontendId === 'vue_nuxt') {
    backendTitle = 'Nuxt Server Engine (Nitro)';
    backendDesc = 'Dipilih otomatis berdasarkan framework Nuxt.';
  } else if (frontendId === 'react_native') {
    backendTitle = 'Node.js / Express REST API';
    backendDesc = 'Backend API terpisah untuk mobile native client.';
  } else if (frontendId === 'electron') {
    backendTitle = 'Electron IPC & Local Node.js';
    backendDesc = 'Komunikasi proses internal aplikasi desktop.';
  } else if (databaseId === 'supabase') {
    backendTitle = 'Supabase Edge Functions & API';
    backendDesc = 'BaaS serverless dengan PostgreSQL bawaan.';
  }

  const stackText = `01 Product   : ${prodType.title}
02 Frontend  : ${frontend.title}
03 Database  : ${database.title}
04 Backend   : ${backendTitle}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(stackText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full max-w-5xl mx-auto bg-[#161C2E]/95 border border-[#1E293B] rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative">
      {/* Header Tag and Title */}
      <div className="mb-8">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
          <span>STEP 4/4</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">RINGKASAN</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight mb-2">
          Konfirmasi pilihanmu
        </h2>
        <p className="text-sm text-slate-400">
          Semua sudah siap. Periksa kembali sebelum masuk ke sesi interview.
        </p>
      </div>

      {/* Two Column Layout: Selected Stack (Left) + Snippet & Deliverables (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column: Stack Cards */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* #1 Jenis Produk */}
          <div className="bg-[#121726]/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[#F2542D] shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  #1 JENIS PRODUK
                </div>
                <h3 className="text-base font-bold text-white">{prodType.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{prodType.desc}</p>
              </div>
            </div>
            <button
              onClick={() => onJumpToStep('product_type')}
              className="text-xs font-semibold text-[#F2542D] hover:underline px-2 py-1"
              type="button"
            >
              Ubah
            </button>
          </div>

          {/* #2 Frontend */}
          <div className="bg-[#121726]/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-white text-black flex items-center justify-center font-bold text-base shrink-0 shadow">
                N
              </div>
              <div>
                <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  #2 FRONTEND
                </div>
                <h3 className="text-base font-bold text-white">{frontend.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{frontend.desc}</p>
              </div>
            </div>
            <button
              onClick={() => onJumpToStep('frontend')}
              className="text-xs font-semibold text-[#F2542D] hover:underline px-2 py-1"
              type="button"
            >
              Ubah
            </button>
          </div>

          {/* #3 Database */}
          <div className="bg-[#121726]/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  #3 DATABASE
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{database.title}</h3>
                  {database.badge && (
                    <span className="text-[9px] font-bold bg-[#F2542D] text-white px-1.5 py-0.2 rounded">
                      {database.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{database.desc}</p>
              </div>
            </div>
            <button
              onClick={() => onJumpToStep('database')}
              className="text-xs font-semibold text-[#F2542D] hover:underline px-2 py-1"
              type="button"
            >
              Ubah
            </button>
          </div>

          {/* #4 Backend (Otomatis) */}
          <div className="bg-[#121726]/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  #4 BACKEND (OTOMATIS)
                </div>
                <h3 className="text-base font-bold text-white">{backendTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{backendDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Snippet & Output Checklist */}
        <div className="lg:col-span-5 space-y-4">
          {/* Copyable Stack Snippet */}
          <div className="bg-[#101524] border border-slate-800 rounded-xl p-4 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 pb-2.5 mb-2.5 border-b border-slate-800">
              <span className="text-[11px] font-semibold text-slate-300">Ringkasan Stack</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800/80 transition"
                type="button"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px]">
              {stackText}
            </pre>
          </div>

          {/* Deliverables Checklist */}
          <div className="bg-[#101524] border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Output yang akan dihasilkan
            </h4>
            <div className="space-y-2 text-xs">
              {[
                'Dokumen PRD lengkap (.md)',
                'ERD (Entity Relationship Diagram)',
                'SQL Schema (.sql)',
                'Task List & Sprint Plan',
                'Arsitektur Sistem',
                'Asumsi & Risiko'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[9px] shrink-0">
                    ✓
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg border border-[#334155] bg-transparent hover:bg-slate-800/70 text-slate-300 hover:text-white transition font-medium text-sm"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <button
            onClick={() => onJumpToStep('product_type')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-800 hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 transition text-xs font-medium"
            type="button"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ubah Pilihan</span>
          </button>
        </div>

        <button
          onClick={onStartInterview}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-sm shadow-[0_0_25px_rgba(242,84,45,0.4)] hover:shadow-[0_0_35px_rgba(242,84,45,0.6)] transition-all active:scale-[0.99]"
          type="button"
        >
          <span>Mulai Interview</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
