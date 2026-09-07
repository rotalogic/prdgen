import React, { useState } from 'react';
import { WizardStep, InterviewGroupIndex } from '../types';
import { Settings, Save, Check, ExternalLink, Key, LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  currentStep: WizardStep;
  interviewGroup: InterviewGroupIndex;
  onNavigateStep: (step: WizardStep) => void;
  onOpenDocs: () => void;
  onOpenChangelog: () => void;
  onOpenSettings: () => void;
  onOpenApiKeyDialog?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onSaveAndExit: () => void;
  onStartWizard: () => void;
  userEmail?: string;
  userName?: string;
  userPhoto?: string;
  isLoggedIn?: boolean;
  isSaving?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  interviewGroup,
  onNavigateStep,
  onOpenDocs,
  onOpenChangelog,
  onOpenSettings,
  onOpenApiKeyDialog,
  onOpenAuthModal,
  onLogout,
  onSaveAndExit,
  onStartWizard,
  userEmail,
  userName,
  userPhoto,
  isLoggedIn = false,
  isSaving = false
}) => {
  const isHero = currentStep === 'hero';
  const isSetupSteps = ['product_type', 'frontend', 'database', 'summary'].includes(currentStep);
  const isInterview = currentStep === 'interview';
  const isResult = currentStep === 'result';
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#070A12]/85 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Brand Logo & Identity */}
      <div
        onClick={() => onNavigateStep('hero')}
        className="flex items-center cursor-pointer group select-none shrink-0"
      >
        <img
          src="/assets/brand/rotalogic-logo.png"
          alt="RotaLogic — PRD Generator"
          className="h-8 sm:h-9 w-auto transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Stepper Progression Navigation (when not in Hero) */}
      {!isHero && (
        <nav aria-label="Progress Stepper" className="hidden md:flex items-center gap-2 lg:gap-3 text-xs">
          {/* If in Setup Phase (Steps 1 to 4) */}
          {isSetupSteps && (
            <div className="flex items-center">
              {/* Step 1: Jenis Produk */}
              <button 
                onClick={() => onNavigateStep('product_type')}
                className="flex items-center gap-2 group focus:outline-none"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 'product_type'
                    ? 'bg-[#F2542D] text-white ring-4 ring-[#F2542D]/20 shadow-md'
                    : 'bg-[#F2542D] text-white'
                }`}>
                  {currentStep !== 'product_type' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                </div>
                <span className={`text-xs font-medium ${currentStep === 'product_type' ? 'text-white font-semibold' : 'text-slate-300'}`}>
                  Jenis Produk
                </span>
              </button>

              <div className={`w-8 lg:w-12 h-[2px] mx-2 ${currentStep !== 'product_type' ? 'bg-[#F2542D]' : 'bg-slate-800'}`} />

              {/* Step 2: Frontend */}
              <button 
                onClick={() => onNavigateStep('frontend')}
                className="flex items-center gap-2 group focus:outline-none"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 'frontend'
                    ? 'bg-[#F2542D] text-white ring-4 ring-[#F2542D]/20 shadow-md'
                    : ['database', 'summary'].includes(currentStep)
                    ? 'bg-[#F2542D] text-white'
                    : 'bg-[#161F30] border border-slate-700 text-slate-400'
                }`}>
                  {['database', 'summary'].includes(currentStep) ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                </div>
                <span className={`text-xs font-medium ${currentStep === 'frontend' ? 'text-white font-semibold' : 'text-slate-400'}`}>
                  Frontend
                </span>
              </button>

              <div className={`w-8 lg:w-12 h-[2px] mx-2 ${['database', 'summary'].includes(currentStep) ? 'bg-[#F2542D]' : 'bg-slate-800'}`} />

              {/* Step 3: Database */}
              <button 
                onClick={() => onNavigateStep('database')}
                className="flex items-center gap-2 group focus:outline-none"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 'database'
                    ? 'bg-[#F2542D] text-white ring-4 ring-[#F2542D]/20 shadow-md'
                    : currentStep === 'summary'
                    ? 'bg-[#F2542D] text-white'
                    : 'bg-[#161F30] border border-slate-700 text-slate-400'
                }`}>
                  {currentStep === 'summary' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
                </div>
                <span className={`text-xs font-medium ${currentStep === 'database' ? 'text-white font-semibold' : 'text-slate-400'}`}>
                  Database
                </span>
              </button>

              <div className={`w-8 lg:w-12 h-[2px] mx-2 ${currentStep === 'summary' ? 'bg-[#F2542D]' : 'bg-slate-800'}`} />

              {/* Step 4: Ringkasan */}
              <button 
                onClick={() => onNavigateStep('summary')}
                className="flex items-center gap-2 group focus:outline-none"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 'summary'
                    ? 'bg-[#F2542D] text-white ring-4 ring-[#F2542D]/20 shadow-md'
                    : 'bg-[#161F30] border border-slate-700 text-slate-400'
                }`}>
                  4
                </div>
                <span className={`text-xs font-medium ${currentStep === 'summary' ? 'text-white font-semibold' : 'text-slate-400'}`}>
                  Ringkasan
                </span>
              </button>
            </div>
          )}

          {/* If in Interview or Result Phase (6-Step Stepper) */}
          {(isInterview || isResult) && (
            <div className="flex items-center">
              {/* Step 1-4 Done */}
              <button onClick={() => onNavigateStep('product_type')} className="flex items-center gap-1.5 hover:opacity-80">
                <div className="w-5 h-5 rounded-full bg-[#F2542D] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-[11px] font-medium text-slate-300">Jenis</span>
              </button>
              <div className="w-5 h-[1.5px] bg-[#F2542D] mx-1.5" />

              <button onClick={() => onNavigateStep('frontend')} className="flex items-center gap-1.5 hover:opacity-80">
                <div className="w-5 h-5 rounded-full bg-[#F2542D] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-[11px] font-medium text-slate-300">Frontend</span>
              </button>
              <div className="w-5 h-[1.5px] bg-[#F2542D] mx-1.5" />

              <button onClick={() => onNavigateStep('database')} className="flex items-center gap-1.5 hover:opacity-80">
                <div className="w-5 h-5 rounded-full bg-[#F2542D] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-[11px] font-medium text-slate-300">Database</span>
              </button>
              <div className="w-5 h-[1.5px] bg-[#F2542D] mx-1.5" />

              <button onClick={() => onNavigateStep('summary')} className="flex items-center gap-1.5 hover:opacity-80">
                <div className="w-5 h-5 rounded-full bg-[#F2542D] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-[11px] font-medium text-slate-300">Ringkasan</span>
              </button>
              <div className="w-5 h-[1.5px] bg-[#F2542D] mx-1.5" />

              {/* Step 5: Interview */}
              <button onClick={() => onNavigateStep('interview')} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isInterview 
                    ? 'bg-[#F2542D] text-white ring-4 ring-[#F2542D]/25 shadow-sm'
                    : 'bg-[#F2542D] text-white'
                }`}>
                  {isResult ? <Check className="w-3 h-3 stroke-[3]" /> : '5'}
                </div>
                <span className={`text-[11px] font-semibold ${isInterview ? 'text-white' : 'text-slate-300'}`}>
                  Interview {isInterview ? `(${interviewGroup}/5)` : ''}
                </span>
              </button>
              <div className={`w-5 h-[1.5px] mx-1.5 ${isResult ? 'bg-[#F2542D]' : 'bg-slate-700'}`} />

              {/* Step 6: Hasil */}
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isResult 
                    ? 'bg-[#F2542D] text-white ring-4 ring-[#F2542D]/25 shadow-md shadow-[#F2542D]/40'
                    : 'bg-[#161F30] border border-slate-700 text-slate-400'
                }`}>
                  6
                </div>
                <span className={`text-[11px] font-medium ${isResult ? 'text-white font-bold' : 'text-slate-500'}`}>
                  Hasil
                </span>
              </div>
            </div>
          )}
        </nav>
      )}

      {/* Right Header Navigation & Actions */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Docs, Changelog, Kunci AI & Pengaturan — hanya untuk pengguna yang sudah masuk */}
        {isLoggedIn && (
          <>
            <button
              onClick={onOpenDocs}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              type="button"
            >
              Docs
            </button>

            <button
              onClick={onOpenChangelog}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              type="button"
            >
              Changelog
            </button>

            {onOpenApiKeyDialog && (
              <button
                onClick={onOpenApiKeyDialog}
                aria-label="Konfigurasi Kunci AI"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20 cursor-pointer"
                type="button"
                title="Kunci AI (Gemini, Claude, GPT & Custom)"
              >
                <Key className="w-4 h-4 text-amber-400/90" />
              </button>
            )}

            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/10 cursor-pointer"
              type="button"
              title="Pengaturan & Preferensi"
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        )}

        {/* User Account / Auth Section */}
        {isLoggedIn ? (
          <div className="relative pl-2 border-l border-white/10">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/[0.06] transition cursor-pointer text-left"
              type="button"
              title={userEmail || 'Akun Saya'}
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName || userEmail || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover border border-white/20 shadow-sm"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#F2542D] to-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  {userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-semibold text-slate-200 leading-tight max-w-[110px] truncate">
                  {userName || (userEmail ? userEmail.split('@')[0] : 'Pengguna')}
                </span>
                <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Terhubung
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl bg-[#0E1526] border border-slate-700 shadow-2xl z-50 text-slate-200 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1.5 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{userName || 'Pengguna RotaLogic'}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
                  </div>

                  <div className="px-2 py-1 text-[10px] text-slate-400">
                    Draf dan progres PRD Anda tersinkronisasi otomatis dengan akun ini.
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout?.();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="pl-2 border-l border-white/10">
            <button
              onClick={onOpenAuthModal}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2542D]/15 hover:bg-[#F2542D]/25 border border-[#F2542D]/40 text-[#ff8e73] hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#F2542D]" />
              <span>Masuk / Daftar</span>
            </button>
          </div>
        )}

        {/* CTA: Either "Mulai Sekarang" on Hero, or "Simpan & Keluar" on Wizard */}
        {isHero ? (
          <button
            onClick={onStartWizard}
            className="inline-flex items-center gap-2 bg-[#F2542D] hover:bg-[#ff6742] text-white font-medium text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-[0_0_20px_rgba(242,84,45,0.4)] hover:shadow-[0_0_30px_rgba(242,84,45,0.6)] transition-all duration-200 cursor-pointer"
            type="button"
          >
            <span>Mulai Sekarang</span>
            <span className="text-base leading-none">→</span>
          </button>
        ) : (
          <button
            onClick={onSaveAndExit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#F2542D]/50 bg-[#F2542D]/15 hover:bg-[#F2542D]/25 text-xs font-semibold text-[#ff8e73] hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            type="button"
            title={`Simpan progres ke akun ${userEmail} dan kembali ke homepage`}
          >
            <Save className={`w-3.5 h-3.5 text-[#F2542D] ${isSaving ? 'animate-bounce' : ''}`} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan & Keluar'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
