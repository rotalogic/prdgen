import React from 'react';
import { WizardStep } from '../types';

interface LeftRailProps {
  currentStep: WizardStep;
}

export const LeftRail: React.FC<LeftRailProps> = ({ currentStep }) => {
  const isIde = ['hero', 'product_type', 'frontend', 'database', 'summary'].includes(currentStep);
  const isInterview = currentStep === 'interview';
  const isPrd = currentStep === 'result';
  const isBuild = false;

  return (
    <aside className="hidden xl:flex flex-col justify-between w-32 py-4 self-stretch select-none text-[11px] font-mono tracking-wider text-slate-500 shrink-0">
      <div className="space-y-4">
        {/* IDE Phase */}
        <div className="flex items-center gap-2">
          {isIde ? (
            <>
              <div className="w-3.5 h-[1.5px] bg-[#F2542D]" />
              <span className="text-white font-bold tracking-wider">IDE</span>
            </>
          ) : (
            <span className="text-slate-500 font-semibold tracking-wider hover:text-slate-400 cursor-default">IDE</span>
          )}
        </div>

        {/* INTERVIEW Phase */}
        <div className="flex items-center gap-2">
          {isInterview ? (
            <>
              <div className="w-3.5 h-[1.5px] bg-[#F2542D]" />
              <span className="text-white font-bold tracking-wider">INTERVIEW</span>
            </>
          ) : (
            <span className="text-slate-500 font-semibold tracking-wider hover:text-slate-400 cursor-default">INTERVIEW</span>
          )}
        </div>

        {/* PRD Phase */}
        <div className="flex items-center gap-2">
          {isPrd ? (
            <>
              <div className="w-3.5 h-[1.5px] bg-[#F2542D]" />
              <span className="text-white font-bold tracking-wider">PRD</span>
            </>
          ) : (
            <span className="text-slate-500 font-semibold tracking-wider hover:text-slate-400 cursor-default">PRD</span>
          )}
        </div>

        {/* BUILD Phase */}
        <div className="flex items-center gap-2">
          {isBuild ? (
            <>
              <div className="w-3.5 h-[1.5px] bg-[#F2542D]" />
              <span className="text-white font-bold tracking-wider">BUILD</span>
            </>
          ) : (
            <span className="text-slate-500 font-semibold tracking-wider hover:text-slate-400 cursor-default">BUILD</span>
          )}
        </div>
      </div>

      {/* Technical Spec Indicator Bottom Left */}
      <div className="space-y-1 text-[10px] text-slate-500 font-mono tracking-widest leading-loose uppercase">
        <p className="text-slate-400">SPESIFIKASI</p>
        <p className="text-slate-400">PRD • ERD • SQL</p>
        <p className="text-slate-500">SPRINT BACKLOG</p>
        <p className="text-slate-500">STANDAR TEKNIS</p>
      </div>
    </aside>
  );
};
