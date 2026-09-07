import React, { useState } from 'react';
import { DATABASE_OPTIONS } from '../data/constants';
import { ArrowLeft, ArrowRight, Check, Search, Database, Layers, Flame, Zap, Disc, Circle, Slash, Feather, Leaf } from 'lucide-react';

interface StepDatabaseProps {
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepDatabase: React.FC<StepDatabaseProps> = ({
  selectedId,
  onSelect,
  onBack,
  onNext
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua Kategori');

  const filteredDatabases = DATABASE_OPTIONS.filter((db) => {
    const matchesSearch = db.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (db.tags && db.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = categoryFilter === 'Semua Kategori' || db.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const renderDbIcon = (iconName: string, id: string) => {
    switch (iconName) {
      case 'database':
        return <Database className="w-6 h-6 text-sky-400" />;
      case 'leaf':
        return <Leaf className="w-6 h-6 text-emerald-400" />;
      case 'feather':
        return <Feather className="w-6 h-6 text-indigo-400" />;
      case 'flame':
        return <Flame className="w-6 h-6 text-amber-500" />;
      case 'zap':
        return <Zap className="w-6 h-6 text-emerald-400" />;
      case 'layers':
        return <Layers className="w-6 h-6 text-blue-500" />;
      case 'disc':
        return <Disc className="w-6 h-6 text-red-500" />;
      case 'circle':
        return <Circle className="w-6 h-6 text-slate-300" />;
      case 'slash':
        return <Slash className="w-6 h-6 text-slate-400" />;
      default:
        return <Database className="w-6 h-6 text-sky-400" />;
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto bg-[#161C2E]/95 border border-[#1E293B] rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative">
      {/* Header Tag and Title */}
      <div className="mb-6">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
          <span>STEP 3/4</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">DATABASE</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight mb-2">
          Pilih database
        </h2>
        <p className="text-sm text-slate-400">
          Menentukan tipe data di ERD, script SQL migrasi, dan konfigurasi koneksi.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari database..."
            className="w-full bg-[#101423] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] focus:ring-1 focus:ring-[#F2542D] transition"
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter Kategori Database"
          className="w-full sm:w-56 bg-[#101423] border border-slate-700/80 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#F2542D]"
        >
          <option value="Semua Kategori">Semua Kategori</option>
          <option value="Relational (SQL)">Relational (SQL)</option>
          <option value="NoSQL / Document">NoSQL / Document</option>
          <option value="Serverless / BaaS">Serverless / BaaS</option>
        </select>
      </div>

      {/* Database Options Grid (12 Items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8 max-h-[460px] overflow-y-auto pr-1">
        {filteredDatabases.map((db) => {
          const isSelected = db.id === selectedId;

          return (
            <div
              key={db.id}
              onClick={() => onSelect(db.id)}
              className={`relative rounded-xl p-4 border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#121726] border-[#F2542D] shadow-[0_0_0_1.5px_#F2542D,0_6px_20px_rgba(242,84,45,0.2)]'
                  : 'bg-[#121726]/60 border-slate-800 hover:border-slate-700 hover:bg-[#121726]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#F2542D] flex items-center justify-center text-white shadow">
                  <Check className="w-3 h-3 stroke-[3.5]" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                    {renderDbIcon(db.iconName, db.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-sm">{db.title}</span>
                      {db.badge && (
                        <span className="text-[9px] font-bold bg-[#F2542D] text-white px-1.5 py-0.2 rounded">
                          {db.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-3">
                  {db.desc}
                </p>
              </div>

              {/* Tags */}
              {db.tags && db.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800/60">
                  {db.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info notice bar */}
      <div className="mb-6 py-2.5 px-3.5 rounded-lg bg-[#0F1424] border border-slate-800/80 text-slate-400 text-xs flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-slate-700/80 text-slate-200 flex items-center justify-center font-serif text-[11px] italic font-semibold shrink-0">
          i
        </div>
        <span>ERD dan script SQL akan disesuaikan otomatis dengan sintaks database yang kamu pilih.</span>
      </div>

      {/* Action Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg border border-[#334155] bg-transparent hover:bg-slate-800/70 text-slate-300 hover:text-white transition font-medium text-sm"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

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
