import React from 'react';
import { WizardStep, InterviewGroupIndex } from '../types';
import { Check, Globe, Database, Server, Lightbulb, Download, Sparkles } from 'lucide-react';
import { PRODUCT_TYPES, FRONTEND_OPTIONS, DATABASE_OPTIONS } from '../data/constants';

interface RightRailProps {
  currentStep: WizardStep;
  interviewGroup?: InterviewGroupIndex;
  productTypeId: string;
  frontendId: string;
  databaseId: string;
  deployment?: string;
  onEditStack: () => void;
  onDownloadAll?: () => void;
  onSelectInterviewGroup?: (group: InterviewGroupIndex) => void;
}

export const RightRail: React.FC<RightRailProps> = ({
  currentStep,
  interviewGroup = 1,
  productTypeId,
  frontendId,
  databaseId,
  deployment = 'Vercel (Edge/Node)',
  onEditStack,
  onDownloadAll,
  onSelectInterviewGroup
}) => {
  const prodType = PRODUCT_TYPES.find(p => p.id === productTypeId)?.title || 'Website / Web App';
  const frontend = FRONTEND_OPTIONS.find(f => f.id === frontendId)?.title || 'Next.js (React)';
  const db = DATABASE_OPTIONS.find(d => d.id === databaseId)?.title || 'PostgreSQL';
  
  let backend = 'Next.js API Routes';
  if (frontendId === 'vue_nuxt') backend = 'Nuxt Server Engine';
  else if (frontendId === 'react_native') backend = 'Node.js Express API';
  else if (frontendId === 'electron') backend = 'Electron IPC Handler';

  // For Steps 1 - 4: Render simple right watermark
  if (['product_type', 'frontend', 'database', 'summary'].includes(currentStep)) {
    return (
      <aside className="hidden xl:flex flex-col justify-start w-36 py-4 self-stretch select-none pl-6 text-slate-500 font-mono text-[10px] tracking-widest uppercase">
        <div className="space-y-1">
          <p className="text-slate-400">PANDUAN</p>
          <p className="text-slate-400">ARSITEKTUR</p>
          <p className="text-slate-200 font-bold">SPESIFIKASI</p>
          <div className="w-6 h-[2px] bg-[#F2542D] mt-2" />
        </div>
      </aside>
    );
  }

  // Tips tailored to each interview group
  const tipsByGroup: Record<InterviewGroupIndex, { title: string, quote: string }> = {
    1: {
      title: 'Tips Produk',
      quote: 'Pertanyaan yang tepat akan membawa pada dokumen yang tepat. Fokus pada masalah nyata pengguna.'
    },
    2: {
      title: 'Tips Alur',
      quote: 'Jelaskan dengan sederhana. Tidak perlu terlalu teknis, yang penting alur perjalanan pengguna jelas.'
    },
    3: {
      title: 'Tips Model Data',
      quote: 'Mulai dari entitas inti terlebih dahulu. Detail field bisa kamu lengkapi atau ubah nanti di PRD.'
    },
    4: {
      title: 'Tips Batasan',
      quote: 'Lebih baik menentukan batasan sejak awal, daripada mengubah arsitektur mendasar di tengah jalan.'
    },
    5: {
      title: 'Tips Teknis',
      quote: 'Keputusan teknis yang spesifik akan langsung menghasilkan boilerplate, scripts SQL, dan task sprint yang akurat.'
    }
  };

  // For Interview Step (5)
  if (currentStep === 'interview') {
    const progressPercent = (interviewGroup / 5) * 100;
    const currentTip = tipsByGroup[interviewGroup] || tipsByGroup[1];

    return (
      <aside className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Progress Interview Card */}
        <div className="bg-[#09111C]/90 border border-[#17273C] rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white tracking-wide">Progress Interview</span>
            <span className="text-xs font-mono font-bold text-[#F2542D] bg-[#F2542D]/10 px-2 py-0.5 rounded">
              {interviewGroup} / 5
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#172435] h-1.5 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-[#F2542D] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(242,84,45,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Steps List */}
          <div className="space-y-2 text-xs">
            {[
              { idx: 1 as InterviewGroupIndex, name: 'Produk & Pengguna' },
              { idx: 2 as InterviewGroupIndex, name: 'Alur & Lingkup' },
              { idx: 3 as InterviewGroupIndex, name: 'Model Data' },
              { idx: 4 as InterviewGroupIndex, name: 'Batasan & Skala' },
              { idx: 5 as InterviewGroupIndex, name: 'Teknis & Preferensi' },
            ].map((step) => {
              const isCompleted = step.idx < interviewGroup;
              const isCurrent = step.idx === interviewGroup;

              return (
                <div
                  key={step.idx}
                  onClick={() => onSelectInterviewGroup && onSelectInterviewGroup(step.idx)}
                  className={`flex items-center space-x-2.5 p-1.5 rounded-lg transition cursor-pointer ${
                    isCurrent 
                      ? 'bg-slate-800/40 border border-[#F2542D]/30 text-white font-semibold' 
                      : isCompleted
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                    isCompleted
                      ? 'border border-[#F2542D] text-[#F2542D]'
                      : isCurrent
                      ? 'bg-[#F2542D] text-white shadow-sm'
                      : 'border border-slate-700 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : step.idx}
                  </div>
                  <span className={isCurrent ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Pilihan Card */}
        <div className="bg-[#09111C]/90 border border-[#17273C] rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold text-white tracking-wide">Ringkasan Pilihan</span>
            <button
              onClick={onEditStack}
              className="text-xs font-semibold text-[#F2542D] hover:underline"
              type="button"
            >
              Ubah
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Jenis Produk */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400">
                <Globe className="w-3.5 h-3.5 text-[#F2542D] shrink-0" />
                <span className="text-[11px]">Jenis Produk</span>
              </div>
              <span className="text-white font-medium text-right text-[11px] truncate max-w-[140px]">{prodType}</span>
            </div>

            {/* Frontend */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-4 h-4 rounded bg-slate-800 text-[#F2542D] font-mono text-[9px] font-bold flex items-center justify-center shrink-0">
                  N
                </div>
                <span className="text-[11px]">Frontend</span>
              </div>
              <span className="text-white font-medium text-right text-[11px] truncate max-w-[140px]">{frontend}</span>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400">
                <Database className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-[11px]">Database</span>
              </div>
              <span className="text-white font-medium text-right text-[11px] truncate max-w-[140px]">{db}</span>
            </div>

            {/* Backend */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400">
                <Server className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="text-[11px]">Backend</span>
              </div>
              <span className="text-white font-medium text-right text-[11px] truncate max-w-[140px]">{backend}</span>
            </div>

            {/* Deployment on step 5 */}
            {interviewGroup === 5 && (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[#F2542D]">▲</span>
                  <span className="text-[11px]">Deployment</span>
                </div>
                <span className="text-[#F2542D] font-medium text-right text-[11px] truncate max-w-[140px]">{deployment}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Tip & Quotation Card */}
        <div className="bg-[#09111C]/90 border border-[#17273C] rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">{currentTip.title}</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed italic">
            "{currentTip.quote}"
          </p>
          <div className="text-[10px] font-mono text-slate-500 text-right">— RotaLogic</div>
        </div>
      </aside>
    );
  }

  // For Result Step (6: Hasil)
  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4">
      {/* Ringkasan Stack */}
      <div className="bg-[#0B101D]/90 border border-slate-800/90 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ringkasan Stack</h3>
          <button onClick={onEditStack} className="text-xs font-medium text-[#F2542D] hover:underline" type="button">
            Ubah
          </button>
        </div>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-[#F2542D]" />
              <span>Jenis Produk</span>
            </div>
            <span className="text-slate-200 font-medium">{prodType}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-4 h-4 rounded bg-slate-800 text-white font-mono text-[9px] font-bold flex items-center justify-center">N</span>
              <span>Frontend</span>
            </div>
            <span className="text-slate-200 font-medium">{frontend}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Database</span>
            </div>
            <span className="text-slate-200 font-medium">{db}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Server className="w-3.5 h-3.5 text-slate-300" />
              <span>Backend</span>
            </div>
            <span className="text-slate-200 font-medium">{backend}</span>
          </div>
        </div>
      </div>

      {/* Output yang Dihasilkan Checklist */}
      <div className="bg-[#0B101D]/90 border border-slate-800/90 rounded-xl p-4 shadow-xl">
        <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Output yang Dihasilkan</h3>
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
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Langkah Selanjutnya */}
      <div className="bg-[#0B101D]/90 border border-slate-800/90 rounded-xl p-4 shadow-xl">
        <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Langkah Selanjutnya</h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#F2542D] text-white flex-shrink-0 flex items-center justify-center font-bold text-[10px]">
              1
            </span>
            <div>
              <div className="font-bold text-white">Tinjau hasil PRD</div>
              <div className="text-[11px] text-slate-400 leading-tight">Pastikan semua informasi sudah sesuai.</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex-shrink-0 flex items-center justify-center font-bold text-[10px]">
              2
            </span>
            <div>
              <div className="font-bold text-white">Edit jika diperlukan</div>
              <div className="text-[11px] text-slate-400 leading-tight">Kamu bisa mengubah jawaban atau mengedit dokumen.</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex-shrink-0 flex items-center justify-center font-bold text-[10px]">
              3
            </span>
            <div>
              <div className="font-bold text-white">Mulai pengembangan</div>
              <div className="text-[11px] text-slate-400 leading-tight">Gunakan dokumen ini sebagai panduan tim developer.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Big Download All Button */}
      {onDownloadAll && (
        <button
          onClick={onDownloadAll}
          className="w-full py-3.5 px-4 rounded-xl bg-[#F2542D] hover:bg-[#ff6742] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(242,84,45,0.4)] hover:shadow-[0_0_35px_rgba(242,84,45,0.6)] transition duration-200"
          type="button"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Semua Dokumen (.ZIP / .MD)</span>
        </button>
      )}
    </aside>
  );
};
