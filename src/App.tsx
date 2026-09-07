import React, { useState, useEffect } from 'react';
import { 
  WizardStep, 
  InterviewGroupIndex, 
  InterviewData, 
  GeneratedPRDResult,
  SavedDraftInfo,
  AiConfig
} from './types';
import { 
  INITIAL_INTERVIEW_DATA 
} from './data/constants';
import { generatePRDFromInputs } from './data/generator';

// Modular Components
import { Header } from './components/Header';
import { LeftRail } from './components/LeftRail';
import { RightRail } from './components/RightRail';
import { HeroView } from './components/HeroView';
import { StepProductType } from './components/StepProductType';
import { StepFrontend } from './components/StepFrontend';
import { StepDatabase } from './components/StepDatabase';
import { StepSummary } from './components/StepSummary';
import { InterviewView } from './components/InterviewView';
import { ResultView } from './components/ResultView';
import { DocsModal, ChangelogModal, SettingsModal } from './components/Modals';
import { ApiKeyDialog } from './components/ApiKeyDialog';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import { saveDraftToCloud, loadDraftFromCloud } from './lib/firebase';
import { CosmicBackground, BackgroundMode } from './components/CosmicBackground';
import { WallpaperControls } from './components/WallpaperControls';
import confetti from 'canvas-confetti';

export function App() {
  // Navigation & Flow State
  const [currentStep, setCurrentStep] = useState<WizardStep>('hero');
  const [interviewGroup, setInterviewGroup] = useState<InterviewGroupIndex>(1);

  // Stack Selection State
  const [productTypeId, setProductTypeId] = useState<string>('web');
  const [frontendId, setFrontendId] = useState<string>('nextjs');
  const [databaseId, setDatabaseId] = useState<string>('postgresql');

  // Background Theme & Wallpaper State (with instant 1-click restore to original backup)
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(() => {
    return (localStorage.getItem('rotalogic_bg_mode') as BackgroundMode) || 'cosmic_lava';
  });
  const [customBgImage, setCustomBgImage] = useState<string | null>(() => {
    return localStorage.getItem('rotalogic_custom_bg') || null;
  });
  const [dimOpacity, setDimOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('rotalogic_bg_dim');
    return saved ? parseFloat(saved) : 0.25;
  });

  // User Authentication & Cloud Account State
  const { user, isLoggedIn, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [authModalPrompt, setAuthModalPrompt] = useState<{ title?: string; description?: string }>({});

  const currentUserEmail = user?.email || '';
  const currentUserName = user?.displayName || (user?.email ? user.email.split('@')[0] : '');
  const currentUserPhoto = user?.photoURL || '';

  const [isSaving, setIsSaving] = useState(false);
  const [savedDraft, setSavedDraft] = useState<SavedDraftInfo | null>(null);

  // Load draft from Cloud Firestore when user signs in
  useEffect(() => {
    if (user?.uid) {
      loadDraftFromCloud(user.uid)
        .then((cloudDraft) => {
          if (cloudDraft && (cloudDraft as any).lastStep) {
            setSavedDraft(cloudDraft as SavedDraftInfo);
          } else {
            const local = localStorage.getItem(`rotalogic_user_draft_${user.uid}`) || 
                          localStorage.getItem(`rotalogic_user_draft_${user.email}`);
            if (local) {
              try {
                setSavedDraft(JSON.parse(local));
              } catch (e) {
                // ignore
              }
            }
          }
        })
        .catch((err) => {
          console.log('Cloud draft load info:', err);
        });
    } else {
      setSavedDraft(null);
    }
  }, [user]);

  // Interview Answers State
  const [interviewData, setInterviewData] = useState<InterviewData>(() => {
    const saved = localStorage.getItem('rotalogic_prd_interview');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_INTERVIEW_DATA;
  });

  // Generated PRD Result State
  const [result, setResult] = useState<GeneratedPRDResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals & Toast State
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Custom AI Engine Configuration (Gemini, OpenAI, Claude, Custom)
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('rotalogic_ai_config');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
      const legacyGeminiKey = localStorage.getItem('rotalogic_custom_api_key') || '';
      return {
        provider: 'gemini',
        apiKey: legacyGeminiKey,
        model: 'gemini-2.5-flash',
      };
    } catch {
      return {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-2.5-flash',
      };
    }
  });

  const handleSaveAiConfig = (config: AiConfig) => {
    setAiConfig(config);
    try {
      localStorage.setItem('rotalogic_ai_config', JSON.stringify(config));
      // For backwards compatibility with legacy key
      if (config.provider === 'gemini') {
        if (config.apiKey) {
          localStorage.setItem('rotalogic_custom_api_key', config.apiKey);
        } else {
          localStorage.removeItem('rotalogic_custom_api_key');
        }
      }
      const providerNames: Record<string, string> = {
        gemini: 'Google Gemini',
        openai: 'OpenAI (GPT)',
        claude: 'Anthropic Claude',
        custom: 'Kustom API',
      };
      const name = providerNames[config.provider] || config.provider;
      showToast(`Konfigurasi AI (${name}) berhasil disimpan`);
    } catch (e) {
      console.error('Storage error:', e);
    }
  };

  const handleClearAiConfig = () => {
    const defaultConfig: AiConfig = {
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-2.5-flash',
    };
    setAiConfig(defaultConfig);
    try {
      localStorage.removeItem('rotalogic_ai_config');
      localStorage.removeItem('rotalogic_custom_api_key');
      showToast('Konfigurasi AI direset ke bawaan server');
    } catch (e) {
      console.error('Storage error:', e);
    }
  };

  // Auto-save interview answers to localStorage
  useEffect(() => {
    localStorage.setItem('rotalogic_prd_interview', JSON.stringify(interviewData));
  }, [interviewData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSetBackgroundMode = (mode: BackgroundMode) => {
    setBackgroundMode(mode);
    localStorage.setItem('rotalogic_bg_mode', mode);
    if (mode === 'default_minimal') {
      showToast('Tampilan dikembalikan ke versi orisinal (Backup)');
    } else {
      showToast('Wallpaper gunung kosmik aktif');
    }
  };

  const handleUploadCustomImage = (dataUrl: string) => {
    setCustomBgImage(dataUrl);
    setBackgroundMode('custom_upload');
    localStorage.setItem('rotalogic_custom_bg', dataUrl);
    localStorage.setItem('rotalogic_bg_mode', 'custom_upload');
    showToast('Wallpaper custom berhasil diterapkan!');
  };

  const handleChangeDim = (dim: number) => {
    setDimOpacity(dim);
    localStorage.setItem('rotalogic_bg_dim', dim.toString());
  };

  const handleResetToOriginal = () => {
    setBackgroundMode('default_minimal');
    localStorage.setItem('rotalogic_bg_mode', 'default_minimal');
    showToast('Tampilan berhasil dikembalikan ke versi awal (Backup)!');
  };

  // Start from Hero
  const handleStartFromHero = (initialIdea?: string) => {
    if (!isLoggedIn) {
      setAuthModalMode('register');
      setAuthModalPrompt({
        title: 'Daftar Akun untuk Memulai',
        description: 'Untuk mulai membuat PRD, Anda harus mendaftar melalui akun Google atau email terlebih dahulu.'
      });
      setIsAuthModalOpen(true);
      return;
    }

    if (initialIdea && initialIdea.trim()) {
      setInterviewData(prev => ({
        ...prev,
        q1_problem: initialIdea.trim()
      }));
    }
    setCurrentStep('product_type');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Interview Answers updater
  const handleUpdateInterview = (newData: Partial<InterviewData>) => {
    setInterviewData(prev => ({ ...prev, ...newData }));
  };

  // Final PRD Generation trigger
  const handleGeneratePRD = async () => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setAuthModalPrompt({
        title: 'Masuk untuk Menghasilkan PRD',
        description: 'Silakan masuk dengan akun Google atau email Anda untuk memproses dan menyimpan PRD.'
      });
      setIsAuthModalOpen(true);
      return;
    }

    setIsGenerating(true);

    try {
      // Optional call to server-side AI route supporting Gemini, OpenAI, Claude, and Custom
      let enrichedMarkdown = '';
      try {
        const res = await fetch('/api/ai/generate-prd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: interviewData.q1_problem,
            aiConfig: aiConfig,
            customApiKey: aiConfig.apiKey?.trim() || undefined,
            currentData: {
              ...interviewData,
              productType: productTypeId,
              frontend: frontendId,
              database: databaseId
            }
          })
        });
        const json = await res.json();
        if (json.success && json.aiFeedback) {
          enrichedMarkdown = json.aiFeedback;
        }
      } catch (e) {
        console.log('AI route info:', e);
      }

      // Generate full structured PRD
      const generated = generatePRDFromInputs(
        productTypeId,
        frontendId,
        databaseId,
        interviewData
      );

      if (enrichedMarkdown) {
        generated.prdMarkdown += `\n\n---\n\n## 8. Rekomendasi Tambahan (AI CTO Analysis)\n${enrichedMarkdown}`;
      }

      setResult(generated);
      setCurrentStep('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Celebration Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F2542D', '#ff8464', '#ffffff', '#38bdf8']
      });

      showToast('PRD dan artefak teknis berhasil dibuat!');
    } catch (error) {
      console.error(error);
      showToast('Gagal memproses PRD. Silakan coba kembali.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save & Exit handler: Simpan ke akun user dan keluar ke homepage awal
  const handleSaveAndExit = async () => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setAuthModalPrompt({
        title: 'Masuk untuk Menyimpan Draf',
        description: 'Daftar melalui Google atau email untuk menyimpan draf PRD ke Cloud Firestore.'
      });
      setIsAuthModalOpen(true);
      return;
    }

    setIsSaving(true);

    const draftInfo: SavedDraftInfo = {
      userEmail: currentUserEmail,
      savedAt: new Date().toISOString(),
      lastStep: currentStep,
      interviewGroup,
      productTypeId,
      frontendId,
      databaseId,
      interviewData,
      projectName: interviewData.q1_problem ? interviewData.q1_problem.trim().slice(0, 60) : 'Draf PRD'
    };

    // Simpan ke storage lokal
    if (user?.uid) {
      localStorage.setItem(`rotalogic_user_draft_${user.uid}`, JSON.stringify(draftInfo));
    }
    localStorage.setItem('rotalogic_prd_interview', JSON.stringify(interviewData));
    localStorage.setItem('rotalogic_prd_stack', JSON.stringify({ productTypeId, frontendId, databaseId }));
    setSavedDraft(draftInfo);

    // Simpan ke Cloud Firestore
    try {
      if (user?.uid) {
        await saveDraftToCloud(user.uid, draftInfo);
      }
      showToast(`Progres berhasil disimpan ke Cloud untuk ${currentUserEmail}!`);
    } catch (e) {
      showToast(`Progres tersimpan secara lokal.`);
    } finally {
      setIsSaving(false);
      setCurrentStep('hero');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResumeDraft = () => {
    if (!savedDraft) return;
    setProductTypeId(savedDraft.productTypeId);
    setFrontendId(savedDraft.frontendId);
    setDatabaseId(savedDraft.databaseId);
    setInterviewData(savedDraft.interviewData);
    setInterviewGroup(savedDraft.interviewGroup);
    setCurrentStep(savedDraft.lastStep === 'hero' ? 'product_type' : savedDraft.lastStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Draf proyek "${savedDraft.projectName}" dilanjutkan!`);
  };

  const handleDiscardDraft = async () => {
    if (user?.uid) {
      localStorage.removeItem(`rotalogic_user_draft_${user.uid}`);
      try {
        await saveDraftToCloud(user.uid, { lastStep: null, savedAt: null });
      } catch (e) {
        // ignore
      }
    }
    setSavedDraft(null);
    showToast('Draf tersimpan telah dihapus.');
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Anda telah berhasil keluar dari akun.');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Download all files bundle
  const handleDownloadAll = () => {
    if (!result) return;
    const allText = `# ${result.productName} — ARTIFACT BUNDLE
Generated by RotaLogic PRD Generator
Date: ${new Date().toISOString()}

============================================================
1. DOKUMEN PRD (PRD.md)
============================================================
${result.prdMarkdown}

============================================================
2. DATABASE SCHEMA (schema.sql)
============================================================
${result.sqlSchema}

============================================================
3. ENTITY RELATIONSHIP DIAGRAM (erd.mmd)
============================================================
${result.mermaidErd}

============================================================
4. SPRINT TASK LIST (tasks.md)
============================================================
${result.tasks.map(t => `- [${t.completed ? 'x' : ' '}] [${t.priority}] ${t.title} (${t.sprintName})`).join('\n')}
`;

    const blob = new Blob([allText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.productName.toLowerCase().replace(/\s+/g, '_')}_COMPLETE_DOCS.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Semua dokumen berhasil di-export!');
  };

  return (
    <div className="min-h-screen flex flex-col deep-atmosphere font-sans text-slate-100 selection:bg-[#F2542D] selection:text-white relative overflow-x-hidden">
      {/* Dynamic Cosmic Volcano Wallpaper & Atmospheric Layer (with instant backup restore) */}
      <CosmicBackground
        mode={backgroundMode}
        customImageUrl={customBgImage}
        dimOpacity={dimOpacity}
      />

      {/* Main Header */}
      <Header
        currentStep={currentStep}
        interviewGroup={interviewGroup}
        onNavigateStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenApiKeyDialog={() => setIsApiKeyDialogOpen(true)}
        onOpenAuthModal={() => {
          setAuthModalMode('register');
          setAuthModalPrompt({});
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onSaveAndExit={handleSaveAndExit}
        onStartWizard={() => handleStartFromHero()}
        userEmail={currentUserEmail}
        userName={currentUserName}
        userPhoto={currentUserPhoto}
        isLoggedIn={isLoggedIn}
        isSaving={isSaving}
      />

      {/* Hero View vs Wizard View Container */}
      {currentStep === 'hero' ? (
        <main className="flex-1">
          <HeroView 
            onStart={handleStartFromHero}
            savedDraft={savedDraft}
            onResumeDraft={handleResumeDraft}
            onDiscardDraft={handleDiscardDraft}
            userEmail={currentUserEmail}
            userName={currentUserName}
            isLoggedIn={isLoggedIn}
            onOpenAuthModal={() => {
              setAuthModalMode('register');
              setAuthModalPrompt({});
              setIsAuthModalOpen(true);
            }}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-[1540px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            {/* Left Rail (IDE • INTERVIEW • PRD • BUILD) */}
            <LeftRail currentStep={currentStep} />

            {/* Central Stage Card */}
            <div className="flex-1 w-full max-w-4xl">
              {/* Step 1: Jenis Produk */}
              {currentStep === 'product_type' && (
                <StepProductType
                  selectedId={productTypeId}
                  onSelect={setProductTypeId}
                  onNext={() => {
                    setCurrentStep('frontend');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {/* Step 2: Frontend */}
              {currentStep === 'frontend' && (
                <StepFrontend
                  selectedId={frontendId}
                  onSelect={setFrontendId}
                  onBack={() => {
                    setCurrentStep('product_type');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNext={() => {
                    setCurrentStep('database');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {/* Step 3: Database */}
              {currentStep === 'database' && (
                <StepDatabase
                  selectedId={databaseId}
                  onSelect={setDatabaseId}
                  onBack={() => {
                    setCurrentStep('frontend');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNext={() => {
                    setCurrentStep('summary');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {/* Step 4: Ringkasan */}
              {currentStep === 'summary' && (
                <StepSummary
                  productTypeId={productTypeId}
                  frontendId={frontendId}
                  databaseId={databaseId}
                  onBack={() => {
                    setCurrentStep('database');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onJumpToStep={(step) => {
                    setCurrentStep(step);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onStartInterview={() => {
                    setCurrentStep('interview');
                    setInterviewGroup(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {/* Step 5: Interview 5 Kelompok */}
              {currentStep === 'interview' && (
                <InterviewView
                  groupIndex={interviewGroup}
                  data={interviewData}
                  databaseId={databaseId}
                  frontendId={frontendId}
                  onChange={handleUpdateInterview}
                  onNavigateGroup={(grp) => {
                    setInterviewGroup(grp);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onGenerate={handleGeneratePRD}
                  isGenerating={isGenerating}
                />
              )}

              {/* Step 6: Hasil (Dokumen PRD & Artifacts) */}
              {currentStep === 'result' && result && (
                <ResultView
                  result={result}
                  onDownloadAll={handleDownloadAll}
                />
              )}
            </div>

            {/* Right Rail (Progress Interview / Ringkasan Pilihan / Tips) */}
            <RightRail
              currentStep={currentStep}
              interviewGroup={interviewGroup}
              productTypeId={productTypeId}
              frontendId={frontendId}
              databaseId={databaseId}
              onEditStack={() => {
                setCurrentStep('product_type');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDownloadAll={handleDownloadAll}
              onSelectInterviewGroup={(grp) => {
                setInterviewGroup(grp);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </main>
      )}

      {/* Footer Branding */}
      <footer className="w-full border-t border-white/[0.05] py-5 px-6 text-center text-xs text-slate-400 font-mono relative z-10">
        <p>© {new Date().getFullYear()} RotaLogic • PRD Generator — Dari ide 1 kalimat jadi PRD matang.</p>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#F2542D]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Wallpaper Control Bar & Quick Backup Revert */}
      <WallpaperControls
        mode={backgroundMode}
        onSetMode={handleSetBackgroundMode}
        customImageUrl={customBgImage}
        onUploadCustomImage={handleUploadCustomImage}
        onResetToOriginal={handleResetToOriginal}
        dimOpacity={dimOpacity}
        onChangeDim={handleChangeDim}
      />

      {/* Modals & Dialogs */}
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        backgroundMode={backgroundMode}
        onSetBackgroundMode={handleSetBackgroundMode}
        onResetToOriginal={handleResetToOriginal}
        customApiKey={aiConfig.apiKey}
        aiConfig={aiConfig}
        onOpenApiKeyDialog={() => setIsApiKeyDialogOpen(true)}
        user={user}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={() => {
          setAuthModalMode('register');
          setAuthModalPrompt({});
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />
      <ApiKeyDialog
        isOpen={isApiKeyDialogOpen}
        onClose={() => setIsApiKeyDialogOpen(false)}
        currentConfig={aiConfig}
        onSaveConfig={handleSaveAiConfig}
        onClearConfig={handleClearAiConfig}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        title={authModalPrompt.title}
        description={authModalPrompt.description}
      />
    </div>
  );
}
export default App;
