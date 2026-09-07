import React from 'react';
import { PRODUCT_TYPES } from '../data/constants';
import { Globe, Smartphone, Monitor, Bot, Box, FileText, Wrench, ArrowRight, Check } from 'lucide-react';

interface StepProductTypeProps {
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}

export const StepProductType: React.FC<StepProductTypeProps> = ({
  selectedId,
  onSelect,
  onNext
}) => {
  const getIcon = (name: string, isSelected: boolean) => {
    const className = `w-8 h-8 ${isSelected ? 'text-[#F2542D]' : 'text-slate-300'}`;
    switch (name) {
      case 'globe': return <Globe className={className} />;
      case 'smartphone': return <Smartphone className={className} />;
      case 'monitor': return <Monitor className={className} />;
      case 'bot': return <Bot className={className} />;
      case 'box': return <Box className={className} />;
      case 'file-text': return <FileText className={className} />;
      case 'wrench': return <Wrench className={className} />;
      default: return <Globe className={className} />;
    }
  };

  return (
    <section className="w-full max-w-[1020px] mx-auto bg-[#0C1220]/90 border border-[#1E293B] rounded-2xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl relative">
      {/* Card Step Tag */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs font-mono font-bold tracking-widest text-[#F2542D] uppercase">
          STEP 1/4 • JENIS PRODUK
        </span>
      </div>

      {/* Title & Description */}
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-2">
        Apa yang ingin kamu bangun?
      </h1>
      <p className="text-sm text-slate-400 mb-8 font-normal">
        Pilihan menentukan stack default &amp; output akhir.
      </p>

      {/* Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PRODUCT_TYPES.map((item) => {
          const isSelected = item.id === selectedId;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group relative flex items-start gap-4 p-5 rounded-xl border text-left transition-all duration-150 ${
                isSelected
                  ? 'border-[#F2542D] bg-[#111A2E]/90 shadow-[0_0_24px_-2px_rgba(242,84,45,0.3),inset_0_0_16px_-4px_rgba(242,84,45,0.15)]'
                  : 'border-slate-800 bg-[#0E1526]/70 hover:border-slate-700 hover:bg-[#121B30]'
              }`}
              type="button"
            >
              {/* Checkmark Badge Top Right */}
              {isSelected && (
                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-[#F2542D] flex items-center justify-center text-white shadow-sm">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Icon */}
              <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center">
                {getIcon(item.iconName, isSelected)}
              </div>

              <div className="pr-3">
                <h2 className={`text-base font-semibold mb-1 transition-colors ${
                  isSelected ? 'text-white' : 'text-white group-hover:text-[#F2542D]'
                }`}>
                  {item.title}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Card Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        {/* Info Pill (Left) */}
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <div className="w-4 h-4 rounded-full bg-slate-700/80 text-slate-200 flex items-center justify-center font-serif text-[11px] italic font-semibold shrink-0">
            i
          </div>
          <span>Tenang, kamu bisa mengubah pilihan ini nanti.</span>
        </div>

        {/* CTA Button (Right) */}
        <button
          onClick={onNext}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-[#F2542D]/30 active:scale-[0.99]"
          type="button"
        >
          <span>Lanjut</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
