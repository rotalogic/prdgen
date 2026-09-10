import React, { useState } from 'react';
import { GeneratedPRDResult, ResultTab, TaskItem } from '../types';
import { 
  FileText, 
  Database, 
  CheckSquare, 
  Server, 
  AlertTriangle, 
  Copy, 
  CheckCheck, 
  Download, 
  Edit3, 
  Eye, 
  Layers, 
  Sparkles, 
  Share2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Filter,
  FileArchive
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultViewProps {
  result: GeneratedPRDResult;
  onNavigateTab?: (tab: ResultTab) => void;
  onDownloadMarkdown: () => void;
  onDownloadZip: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  onDownloadMarkdown,
  onDownloadZip
}) => {
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultTab>('ringkasan');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>(result.tasks);
  const [isEditingPrd, setIsEditingPrd] = useState(false);
  const [customPrdText, setCustomPrdText] = useState(result.prdMarkdown);
  const [erdMode, setErdMode] = useState<'visual' | 'mermaid'>('visual');
  const [archMode, setArchMode] = useState<'visual' | 'mermaid'>('visual');
  const [sprintFilter, setSprintFilter] = useState<number | 'all'>('all');
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'roadmap'>('list');

  // FK inference for the ERD visual canvas — mirrors data/generator.ts so
  // the canvas shows the project's real entities, not a fixed example.
  const entityNames = new Set(result.entities.map(e => e.name));
  const erdRelations = result.entities.flatMap(entity =>
    entity.fields
      .filter(f => !f.isPrimaryKey && f.name.endsWith('_id'))
      .map(f => ({ from: f.name.replace(/_id$/, 's'), to: entity.name, field: f.name }))
      .filter(rel => entityNames.has(rel.from) && rel.from !== rel.to)
  );

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const filteredTasks = sprintFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.sprint === sprintFilter);

  const completedTasksCount = tasks.filter(t => t.completed).length;

  return (
    <div className="w-full space-y-6">
      {/* Top Success Banner */}
      <section className="bg-gradient-to-r from-[#172036] via-[#1A1728] to-[#141B2D] border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#F2542D]/15 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SIAP IMPLEMENTASI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              PRD Kamu Sudah Siap!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Dokumen spesifikasi, arsitektur, ERD, dan script migrasi database berhasil dibuat untuk <span className="font-semibold text-white">{result.productName}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => handleCopy(window.location.href, 'share')}
              className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              type="button"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{copiedSection === 'share' ? 'Link Tersalin!' : 'Bagikan'}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsDownloadMenuOpen((v) => !v)}
                className="px-5 py-2 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#F2542D]/25 transition"
                type="button"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Dokumen</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDownloadMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDownloadMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 p-1.5 rounded-xl bg-[#0E1526] border border-slate-700 shadow-2xl z-50 text-slate-200 space-y-1">
                    <button
                      onClick={() => { setIsDownloadMenuOpen(false); onDownloadMarkdown(); }}
                      type="button"
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-slate-800 transition"
                    >
                      <FileText className="w-4 h-4 text-[#F2542D] mt-0.5 shrink-0" />
                      <span>
                        <span className="block text-xs font-semibold text-white">Satu file Markdown (.md)</span>
                        <span className="block text-[11px] text-slate-400">Semua dokumen digabung jadi satu file</span>
                      </span>
                    </button>
                    <button
                      onClick={() => { setIsDownloadMenuOpen(false); onDownloadZip(); }}
                      type="button"
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-slate-800 transition"
                    >
                      <FileArchive className="w-4 h-4 text-[#F2542D] mt-0.5 shrink-0" />
                      <span>
                        <span className="block text-xs font-semibold text-white">Arsip ZIP (.zip)</span>
                        <span className="block text-[11px] text-slate-400">PRD, ERD, arsitektur, SQL, task list &amp; risiko — file terpisah</span>
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation Header */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1 overflow-x-auto select-none">
        {[
          { id: 'ringkasan' as ResultTab, label: 'Ringkasan', icon: Layers },
          { id: 'prd' as ResultTab, label: 'Dokumen PRD', icon: FileText },
          { id: 'erd' as ResultTab, label: 'ERD', icon: Database },
          { id: 'sql' as ResultTab, label: 'SQL Schema', icon: CodeIcon },
          { id: 'tasks' as ResultTab, label: `Task & Sprint (${completedTasksCount}/${tasks.length})`, icon: CheckSquare },
          { id: 'architecture' as ResultTab, label: 'Arsitektur', icon: Server },
          { id: 'risks' as ResultTab, label: 'Asumsi & Risiko', icon: AlertTriangle }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#151D30] border border-[#F2542D]/50 text-white font-bold shadow-[0_0_12px_rgba(242,84,45,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              type="button"
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#F2542D]' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Container */}
      <div className="bg-[#0C1220]/95 border border-[#1A2638] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

        {/* =========================================================================
            TAB 1: RINGKASAN
           ========================================================================= */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-8">
            {/* Product Specifications Matrix */}
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F2542D]" />
                <span>Spesifikasi Produk</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Nama Produk', val: result.productName },
                  { label: 'Jenis Produk', val: result.productType },
                  { label: 'Deskripsi Singkat', val: result.description },
                  { label: 'Tujuan Utama', val: result.mainGoal },
                  { label: 'Frontend Framework', val: result.frontend },
                  { label: 'Database Engine', val: result.database },
                  { label: 'Backend Layer', val: result.backend },
                  { label: 'Target Pengguna', val: result.targetUser },
                  { label: 'Estimasi Pengguna (Th 1)', val: result.userEstimate },
                  { label: 'Target Rilis', val: result.targetRelease }
                ].map((spec, i) => (
                  <div key={i} className="flex items-start justify-between p-3.5 rounded-xl bg-[#101626] border border-slate-800/80">
                    <span className="text-slate-400 font-medium shrink-0 pr-4">{spec.label}</span>
                    <span className="text-slate-100 font-semibold text-right">{spec.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Preview Cards */}
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F2542D]" />
                <span>Pratinjau Modul Dokumen</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Preview Dokumen PRD */}
                <div className="p-4 rounded-xl bg-[#101626] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <FileText className="w-4 h-4 text-[#F2542D]" />
                      <span>Dokumen PRD Lengkap</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Format terstandar dengan 8 bab lengkap: latar belakang, user personas, MVP scope, NFR, dan metrik.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('prd')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#F2542D] hover:underline font-semibold"
                    type="button"
                  >
                    <span>Lihat Dokumen PRD</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 2. Preview ERD */}
                <div className="p-4 rounded-xl bg-[#101626] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Database className="w-4 h-4 text-sky-400" />
                      <span>Diagram Relasi Entitas (ERD)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Visual diagram skema data, foreign key mapping, dan source code Mermaid siap diekspor.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('erd')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#F2542D] hover:underline font-semibold"
                    type="button"
                  >
                    <span>Lihat ERD</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3. Preview SQL */}
                <div className="p-4 rounded-xl bg-[#101626] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <CodeIcon className="w-4 h-4 text-emerald-400" />
                      <span>SQL Schema Siap Pakai</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sintaks CREATE TABLE, constraints, dan index yang telah disesuaikan dengan sintaks {result.database}.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('sql')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#F2542D] hover:underline font-semibold"
                    type="button"
                  >
                    <span>Lihat SQL Schema</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4. Preview Task List */}
                <div className="p-4 rounded-xl bg-[#101626] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                      <span>Task List &amp; Sprint Plan</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Rincian backlog tugas developer dibagi dalam 3 sprint logis dengan bobot prioritas P0, P1, dan P2.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#F2542D] hover:underline font-semibold"
                    type="button"
                  >
                    <span>Lihat Task List</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: DOKUMEN PRD (Markdown view with copy/download/edit)
           ========================================================================= */}
        {activeTab === 'prd' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                <span className="font-bold text-white">PRD.md</span>
                <span className="text-slate-500">•</span>
                <span>Markdown Format</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setIsEditingPrd(!isEditingPrd)}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                    isEditingPrd 
                      ? 'bg-[#F2542D] border-[#F2542D] text-white font-bold' 
                      : 'border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  type="button"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingPrd ? 'Tampilan Baca' : 'Edit PRD'}</span>
                </button>

                <button
                  onClick={() => handleCopy(customPrdText, 'prd')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                  type="button"
                >
                  {copiedSection === 'prd' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'prd' ? 'Tersalin!' : 'Salin Markdown'}</span>
                </button>

                <button
                  onClick={() => handleDownloadFile(customPrdText, `${result.productName.toLowerCase().replace(/\s+/g, '_')}_PRD.md`)}
                  className="px-3 py-1.5 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold flex items-center gap-1.5 transition"
                  type="button"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {isEditingPrd ? (
              <textarea
                rows={24}
                value={customPrdText}
                onChange={(e) => setCustomPrdText(e.target.value)}
                className="w-full bg-[#080C16] border border-slate-700/80 rounded-xl p-4 font-mono text-xs text-slate-100 focus:outline-none focus:border-[#F2542D] leading-relaxed"
              />
            ) : (
              <div className="prose prose-invert prose-sm max-w-none p-6 rounded-xl bg-[#090D18] border border-slate-800/80 text-slate-200 overflow-x-auto leading-relaxed">
                <ReactMarkdown>{customPrdText}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: ERD (Visual Canvas & Mermaid Code)
           ========================================================================= */}
        {activeTab === 'erd' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setErdMode('visual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    erdMode === 'visual' ? 'bg-[#F2542D] text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                  type="button"
                >
                  Visual Canvas
                </button>
                <button
                  onClick={() => setErdMode('mermaid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    erdMode === 'mermaid' ? 'bg-[#F2542D] text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                  type="button"
                >
                  Mermaid Source
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(result.mermaidErd, 'mermaid')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
                  type="button"
                >
                  {copiedSection === 'mermaid' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'mermaid' ? 'Tersalin!' : 'Salin Mermaid'}</span>
                </button>
              </div>
            </div>

            {erdMode === 'visual' ? (
              <div className="erd-grid bg-[#070A14] border border-slate-800 rounded-xl p-6 min-h-[380px] space-y-6">
                <div className="flex flex-wrap gap-6 items-start justify-center">
                  {result.entities.map((entity) => (
                    <div key={entity.id} className="w-64 bg-[#101728] border border-slate-700 rounded-xl shadow-xl overflow-hidden font-mono text-xs">
                      <div className="bg-[#152038] px-3.5 py-2 border-b border-slate-700 flex items-center justify-between">
                        <span className="font-bold text-white">{entity.name}</span>
                        <span className="text-[10px] text-slate-400">TABLE</span>
                      </div>
                      <div className="p-3 space-y-1.5 text-[11px]">
                        {entity.fields.map((f) => {
                          const isFk = !f.isPrimaryKey && f.name.endsWith('_id');
                          return (
                            <div
                              key={f.id}
                              className={`flex items-center justify-between ${
                                f.isPrimaryKey ? 'text-amber-400' : isFk ? 'text-sky-400' : 'text-slate-300'
                              }`}
                            >
                              <span>{f.name}{f.isPrimaryKey ? ' [PK]' : isFk ? ' [FK]' : ''}</span>
                              <span>{f.type}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {erdRelations.length > 0 && (
                  <div className="border-t border-slate-800 pt-4 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Relasi Terdeteksi</span>
                    {erdRelations.map((rel, i) => (
                      <div key={i} className="text-[11px] font-mono text-slate-400">
                        <span className="text-white">{rel.from}</span>
                        <span className="text-[#F2542D] mx-1.5">──&lt; N</span>
                        <span className="text-white">{rel.to}</span>
                        <span className="text-slate-600"> via {rel.field}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <pre className="p-4 rounded-xl bg-[#080C16] border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                {result.mermaidErd}
              </pre>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: SQL SCHEMA
           ========================================================================= */}
        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                <span className="font-bold text-white">schema.sql</span>
                <span className="text-slate-500">•</span>
                <span>Dialek {result.database}</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleCopy(result.sqlSchema, 'sql')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5"
                  type="button"
                >
                  {copiedSection === 'sql' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'sql' ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>

                <button
                  onClick={() => handleDownloadFile(result.sqlSchema, 'schema.sql', 'application/sql')}
                  className="px-3 py-1.5 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold flex items-center gap-1.5"
                  type="button"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-[#080C16] border border-slate-800 font-mono text-xs text-emerald-400/90 overflow-x-auto leading-relaxed">
              {result.sqlSchema}
            </pre>
          </div>
        )}

        {/* =========================================================================
            TAB 5: TASK & SPRINT
           ========================================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Task List &amp; Sprint Plan</h3>
                <p className="text-xs text-slate-400">
                  {completedTasksCount} dari {tasks.length} task selesai ({Math.round((completedTasksCount / tasks.length) * 100)}%)
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTaskViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                      taskViewMode === 'list' ? 'bg-[#F2542D] text-white font-bold' : 'bg-slate-800 text-slate-300'
                    }`}
                    type="button"
                  >
                    Daftar
                  </button>
                  <button
                    onClick={() => setTaskViewMode('roadmap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                      taskViewMode === 'roadmap' ? 'bg-[#F2542D] text-white font-bold' : 'bg-slate-800 text-slate-300'
                    }`}
                    type="button"
                  >
                    Roadmap Fitur
                  </button>
                </div>

                {/* Sprint Filter Buttons */}
                {taskViewMode === 'list' && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {[
                      { id: 'all' as const, label: 'Semua Sprint' },
                      { id: 1 as const, label: 'Sprint 1' },
                      { id: 2 as const, label: 'Sprint 2' },
                      { id: 3 as const, label: 'Sprint 3' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSprintFilter(s.id)}
                        className={`px-2.5 py-1 rounded-lg transition font-mono ${
                          sprintFilter === s.id
                            ? 'bg-[#F2542D] text-white font-bold'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                        type="button"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {taskViewMode === 'roadmap' ? (
              <div className="rounded-xl bg-[#070A14] border border-slate-800 p-6 overflow-x-auto">
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#151D30] border border-[#F2542D]/40 mb-6">
                  <Layers className="w-4 h-4 text-[#F2542D]" />
                  <div>
                    <p className="text-xs font-bold text-white">{result.productName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Perencanaan</p>
                  </div>
                </div>

                <div className="relative pl-6 space-y-5 min-w-[700px]">
                  <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-700" />
                  {result.featureTree.map((node) => (
                    <div key={node.id} className="relative flex items-stretch gap-2">
                      <div className="absolute -left-6 top-8 w-6 h-px bg-slate-700" />

                      {/* Feature card */}
                      <div className="w-56 shrink-0 p-3.5 rounded-xl bg-[#101728] border border-slate-700 space-y-1.5">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          FASE {node.phase}
                        </span>
                        <p className="text-xs font-bold text-white leading-snug">{node.name}</p>
                        <p className="text-[10px] text-slate-500">{node.status}</p>
                      </div>

                      <div className="flex items-center text-slate-600 shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>

                      {/* Sub Fitur card */}
                      <div className="w-56 shrink-0 p-3.5 rounded-xl bg-[#101728] border border-slate-700 space-y-1.5">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Sub Fitur</span>
                        {node.subFeatures.map((sf, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                            <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                            <span>{sf}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center text-slate-600 shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>

                      {/* Tasks card */}
                      <div className="w-64 shrink-0 p-3.5 rounded-xl bg-[#101728] border border-slate-700 space-y-1.5">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Tasks</span>
                        {node.tasks.map((t, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                            <CheckSquare className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    task.completed
                      ? 'bg-[#0E1524]/40 border-slate-800/60 opacity-60'
                      : 'bg-[#101728] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="mt-0.5 sm:mt-0 rounded border-slate-700 text-[#F2542D] focus:ring-0 w-4 h-4"
                    />
                    <div>
                      <span className={`text-xs sm:text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-500">{task.sprintName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
                      {task.category}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      task.priority === 'P0' 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : task.priority === 'P1'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 6: ARSITEKTUR
           ========================================================================= */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Arsitektur Sistem &amp; Data Flow</h3>
                <p className="text-xs text-slate-400 mt-0.5">{result.architectureSummary.overview}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setArchMode('visual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    archMode === 'visual' ? 'bg-[#F2542D] text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                  type="button"
                >
                  Visual Layers
                </button>
                <button
                  onClick={() => setArchMode('mermaid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    archMode === 'mermaid' ? 'bg-[#F2542D] text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                  type="button"
                >
                  Mermaid Source
                </button>
                <button
                  onClick={() => handleCopy(result.mermaidArchitecture, 'arch-mermaid')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
                  type="button"
                >
                  {copiedSection === 'arch-mermaid' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'arch-mermaid' ? 'Tersalin!' : 'Salin Mermaid'}</span>
                </button>
              </div>
            </div>

            {archMode === 'mermaid' ? (
              <pre className="p-4 rounded-xl bg-[#080C16] border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                {result.mermaidArchitecture}
              </pre>
            ) : (
              <>
                {/* Visual Architecture Layers Flow */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#101728] border border-slate-700 space-y-2">
                    <div className="text-[10px] font-mono text-[#F2542D] uppercase font-bold tracking-wider">
                      LAYER 1 • CLIENT
                    </div>
                    <h4 className="font-bold text-white text-sm">{result.frontend}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {result.architectureSummary.frontendLayer}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#101728] border border-slate-700 space-y-2">
                    <div className="text-[10px] font-mono text-sky-400 uppercase font-bold tracking-wider">
                      LAYER 2 • BACKEND / API
                    </div>
                    <h4 className="font-bold text-white text-sm">{result.backend}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {result.architectureSummary.backendLayer}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#101728] border border-slate-700 space-y-2">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                      LAYER 3 • DATABASE
                    </div>
                    <h4 className="font-bold text-white text-sm">{result.database}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {result.architectureSummary.databaseLayer}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#101728] border border-slate-700 space-y-2">
                    <div className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                      LAYER 4 • CLOUD RUNTIME
                    </div>
                    <h4 className="font-bold text-white text-sm">{result.deployment}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {result.architectureSummary.deploymentLayer}
                    </p>
                  </div>
                </div>

                {/* Security, Data Flow & Scaling */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#101728] border border-slate-700 space-y-2">
                    <div className="text-[10px] font-mono text-rose-400 uppercase font-bold tracking-wider">
                      Keamanan
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {result.architectureSummary.securityLayer}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#101728] border border-slate-700 space-y-2">
                    <div className="text-[10px] font-mono text-violet-400 uppercase font-bold tracking-wider">
                      Alur Data
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {result.architectureSummary.dataFlow}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#101728] border border-slate-700 space-y-2">
                    <div className="text-[10px] font-mono text-teal-400 uppercase font-bold tracking-wider">
                      Skalabilitas
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {result.architectureSummary.scalingNotes}
                    </p>
                  </div>
                </div>

                {/* Connected Services Badge List */}
                <div className="p-4 rounded-xl bg-[#090E1A] border border-slate-800 space-y-2.5">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Third-Party &amp; Supporting Services
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.architectureSummary.services.map((svc, sIdx) => (
                      <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 7: ASUMSI & RISIKO
           ========================================================================= */}
        {activeTab === 'risks' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Matriks Asumsi, Risiko &amp; Mitigasi</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluasi potensi kendala teknis dan operasional beserta strategi mitigasinya sejak hari pertama.
              </p>
            </div>

            <div className="space-y-3">
              {result.risks.map((risk) => (
                <div key={risk.id} className="p-4 rounded-xl bg-[#101728] border border-slate-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>{risk.risk}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {risk.category}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        risk.severity === 'Tinggi' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        Dampak: {risk.severity}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0A0F1D] border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-emerald-400">Rekomendasi Mitigasi: </span>
                    {risk.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}
