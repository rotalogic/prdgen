// ============================================================================
// BACKUP FILE: src/App.backup.tsx
// Dibuat sebelum penambahan wallpaper background sesuai permintaan user:
// "tapi sebelumnya backup dulu karna kalo gak cocok nanti aku mau kembali ke tampilan yang ini"
// Tanggal Backup: 2026-09-07
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  WizardStep, 
  InterviewGroupIndex, 
  InterviewData, 
  GeneratedPRDResult 
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
import confetti from 'canvas-confetti';

export function App() {
  // Navigation & Flow State
  const [currentStep, setCurrentStep] = useState<WizardStep>('hero');
  const [interviewGroup, setInterviewGroup] = useState<InterviewGroupIndex>(1);

  // Stack Selection State
  const [productTypeId, setProductTypeId] = useState<string>('web');
  const [frontendId, setFrontendId] = useState<string>('nextjs');
  const [databaseId, setDatabaseId] = useState<string>('postgresql');

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save interview answers to localStorage
  useEffect(() => {
    localStorage.setItem('rotalogic_prd_interview', JSON.stringify(interviewData));
  }, [interviewData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Start from Hero
  const handleStartFromHero = (initialIdea?: string) => {
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
    setIsGenerating(true);

    try {
      let enrichedMarkdown = '';
      try {
        const res = await fetch('/api/ai/generate-prd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: interviewData.q1_problem,
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

  const handleSaveAndExit = () => {
    localStorage.setItem('rotalogic_prd_interview', JSON.stringify(interviewData));
    localStorage.setItem('rotalogic_prd_stack', JSON.stringify({ productTypeId, frontendId, databaseId }));
    showToast('Progres kamu tersimpan di browser!');
  };

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
      <div className="glowing-horizon" />

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
        onSaveAndExit={handleSaveAndExit}
        onStartWizard={() => handleStartFromHero()}
      />

      {currentStep === 'hero' ? (
        <main className="flex-1">
          <HeroView onStart={handleStartFromHero} />
        </main>
      ) : (
        <main className="flex-1 max-w-[1540px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            <LeftRail currentStep={currentStep} />

            <div className="flex-1 w-full max-w-4xl">
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

              {currentStep === 'result' && result && (
                <ResultView
                  result={result}
                  onDownloadAll={handleDownloadAll}
                />
              )}
            </div>

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

      <footer className="w-full border-t border-white/[0.05] py-5 px-6 text-center text-xs text-slate-400 font-mono relative z-10">
        <p>© {new Date().getFullYear()} RotaLogic • PRD Generator — Dari ide 1 kalimat jadi PRD matang.</p>
      </footer>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#F2542D]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
export default App;
