import React from 'react';
import { FRONTEND_OPTIONS } from '../data/constants';
import { ArrowLeft, ArrowRight, Check, Atom, Smartphone, Monitor, Code, Globe } from 'lucide-react';

interface StepFrontendProps {
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepFrontend: React.FC<StepFrontendProps> = ({
  selectedId,
  onSelect,
  onBack,
  onNext
}) => {
  const renderIcon = (iconName: string, isSelected: boolean) => {
    switch (iconName) {
      case 'nextjs':
        return (
          <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
            N
          </div>
        );
      case 'react':
        return (
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 text-cyan-400">
            <Atom className="w-9 h-9" />
          </div>
        );
      case 'vue':
        return (
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 256 221" xmlns="http://www.w3.org/2000/svg">
              <path d="M204.8 0H256L128 220.8L0 0h97.92L128 51.2L157.44 0h47.36z" fill="#41B883" />
              <path d="M0 0l128 220.8L256 0h-51.2L128 132.48L49.92 0H0z" fill="#41B883" />
              <path d="M49.92 0L128 133.12L204.8 0h-47.36L128 51.2L97.92 0H49.92z" fill="#35495E" />
            </svg>
          </div>
        );
      case 'tailwind':
        return (
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 text-sky-400">
            <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.975 12 6.001 12z" />
            </svg>
          </div>
        );
      case 'mobile':
        return (
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 text-cyan-400">
            <Smartphone className="w-8 h-8" />
          </div>
        );
      case 'electron':
        return (
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 text-cyan-300">
            <Monitor className="w-8 h-8" />
          </div>
        );
      default:
        return <Code className="w-8 h-8 text-slate-400" />;
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto bg-[#161C2E]/95 border border-[#1E293B] rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative">
      {/* Header Tag and Title */}
      <div className="mb-8">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
          <span>STEP 2/4</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">FRONTEND</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight mb-2">
          Pilih teknologi frontend
        </h2>
        <p className="text-sm text-slate-400">
          Sudah terisi default dari jenis produk. Bisa diganti kapan saja.
        </p>
      </div>

      {/* 2x3 Grid of Frontend Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {FRONTEND_OPTIONS.map((item) => {
          const isSelected = item.id === selectedId;

          return (
            <article
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`relative rounded-xl p-5 border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-[#121726] border-[#F2542D] shadow-[0_0_0_1.5px_#F2542D,0_10px_25px_-5px_rgba(242,84,45,0.25)]'
                  : 'bg-[#121726]/60 border-slate-800 hover:border-slate-700 hover:bg-[#121726]'
              }`}
            >
              {/* Selected check badge */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#F2542D] flex items-center justify-center text-white shadow">
                  <Check className="w-3 h-3 stroke-[3.5]" />
                </div>
              )}

              <div className="flex items-start space-x-4">
                {renderIcon(item.iconName, isSelected)}
                <div className="pr-6">
                  <div className="flex items-center space-x-2.5 mb-1.5">
                    <h3 className="font-bold text-white text-base">{item.title}</h3>
                    {item.badge && (
                      <span className="text-[10px] font-semibold bg-[#F2542D] text-white px-2 py-0.5 rounded-md leading-tight">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Action Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
        {/* Back CTA */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg border border-[#334155] bg-transparent hover:bg-slate-800/70 text-slate-300 hover:text-white transition font-medium text-sm"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        {/* Next CTA */}
        <button
          onClick={onNext}
          className="inline-flex items-center space-x-2 px-8 py-2.5 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-sm shadow-lg shadow-[#F2542D]/20 transition-transform active:scale-[0.99]"
          type="button"
        >
          <span>Lanjut</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
