import React, { useState } from 'react';
import { 
  InterviewData, 
  InterviewGroupIndex, 
  EntitySchema, 
  EntityField 
} from '../types';
import { 
  Users, 
  Briefcase, 
  Building, 
  Code, 
  GraduationCap, 
  Palette, 
  Network, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Database, 
  Check, 
  Eye, 
  Layers, 
  Table, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Server,
  Cloud,
  Lock,
  Cpu
} from 'lucide-react';

interface InterviewViewProps {
  groupIndex: InterviewGroupIndex;
  data: InterviewData;
  databaseId: string;
  frontendId: string;
  onChange: (newData: Partial<InterviewData>) => void;
  onNavigateGroup: (group: InterviewGroupIndex) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  groupIndex,
  data,
  databaseId,
  frontendId,
  onChange,
  onNavigateGroup,
  onGenerate,
  isGenerating = false
}) => {
  // State for Group 3: Model Data active entity & preview tab
  const [activeEntityId, setActiveEntityId] = useState<string>(data.q8_entities[0]?.id || 'users');
  const [schemaPreviewTab, setSchemaPreviewTab] = useState<'erd' | 'sql' | 'sample'>('erd');
  const [newEntityName, setNewEntityName] = useState('');
  const [showAddEntityModal, setShowAddEntityModal] = useState(false);

  const activeEntity = data.q8_entities.find(e => e.id === activeEntityId) || data.q8_entities[0];

  // Handler for adding a new field to active entity
  const handleAddField = () => {
    if (!activeEntity) return;
    const newField: EntityField = {
      id: Date.now().toString(),
      name: `field_${activeEntity.fields.length + 1}`,
      type: 'VARCHAR',
      isRequired: false
    };
    const updatedEntities = data.q8_entities.map(entity => {
      if (entity.id === activeEntity.id) {
        return { ...entity, fields: [...entity.fields, newField] };
      }
      return entity;
    });
    onChange({ q8_entities: updatedEntities });
  };

  // Handler for updating a specific field
  const handleUpdateField = (fieldId: string, updates: Partial<EntityField>) => {
    const updatedEntities = data.q8_entities.map(entity => {
      if (entity.id === activeEntity?.id) {
        return {
          ...entity,
          fields: entity.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
        };
      }
      return entity;
    });
    onChange({ q8_entities: updatedEntities });
  };

  // Handler for removing a field
  const handleRemoveField = (fieldId: string) => {
    const updatedEntities = data.q8_entities.map(entity => {
      if (entity.id === activeEntity?.id) {
        return {
          ...entity,
          fields: entity.fields.filter(f => f.id !== fieldId)
        };
      }
      return entity;
    });
    onChange({ q8_entities: updatedEntities });
  };

  // Handler for adding a new entity
  const handleCreateEntity = () => {
    if (!newEntityName.trim()) return;
    const cleanName = newEntityName.trim().toLowerCase().replace(/\s+/g, '_');
    const newEnt: EntitySchema = {
      id: cleanName,
      name: cleanName,
      description: `Menyimpan data ${cleanName}`,
      fields: [
        { id: '1', name: 'id', type: 'UUID', isPrimaryKey: true },
        { id: '2', name: 'name', type: 'VARCHAR', isRequired: true },
        { id: '3', name: 'created_at', type: 'TIMESTAMP', defaultValue: 'now()' }
      ]
    };
    const updated = [...data.q8_entities, newEnt];
    onChange({ 
      q8_entities: updated,
      q7_mainEntities: data.q7_mainEntities ? `${data.q7_mainEntities}, ${cleanName}` : cleanName
    });
    setActiveEntityId(cleanName);
    setNewEntityName('');
    setShowAddEntityModal(false);
  };

  // Target User Cards (Group 1)
  const targetUsersList = [
    { id: 'Pengguna umum / publik', label: 'Pengguna umum / publik', icon: Users },
    { id: 'Internal perusahaan / tim', label: 'Internal perusahaan / tim', icon: Briefcase },
    { id: 'Bisnis / B2B', label: 'Bisnis / B2B', icon: Building },
    { id: 'Developer / Teknis', label: 'Developer / Teknis', icon: Code },
    { id: 'Mahasiswa / Pelajar', label: 'Mahasiswa / Pelajar', icon: GraduationCap },
    { id: 'Kreator / Freelancer', label: 'Kreator / Freelancer', icon: Palette },
    { id: 'Komunitas / Organisasi', label: 'Komunitas / Organisasi', icon: Network },
    { id: 'Lainnya', label: 'Lainnya', icon: Sparkles }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <section className="bg-[#0C1220]/95 border border-[#1A2638] rounded-2xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl relative">
        
        {/* =========================================================================
            KELOMPOK 1/5: PRODUK & PENGGUNA
           ========================================================================= */}
        {groupIndex === 1 && (
          <div className="space-y-8">
            {/* Header Tag */}
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-[#F2542D] uppercase mb-2">
                KELOMPOK 1/5 • PRODUK &amp; PENGGUNA
              </div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
                Pondasi Produk &amp; Pengguna
              </h2>
              <p className="text-sm text-slate-400">
                Mari mulai dari masalah yang ingin diselesaikan dan siapa yang akan menggunakannya.
              </p>
            </div>

            {/* Q1: Masalah apa yang ingin diselesaikan? */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                1. Masalah apa yang ingin diselesaikan?
              </label>
              <p className="text-xs text-slate-400">
                Jelaskan latar belakang dan masalah utama yang dihadapi pengguna sasaran.
              </p>
              <textarea
                rows={4}
                value={data.q1_problem}
                onChange={(e) => onChange({ q1_problem: e.target.value })}
                placeholder="Contoh: Tim developer sering menghabiskan waktu berminggu-minggu meraba-raba requirement yang tidak terstruktur sebelum mulai koding..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] focus:ring-1 focus:ring-[#F2542D] transition leading-relaxed"
              />
              <div className="text-right text-[11px] font-mono text-slate-500">
                {data.q1_problem.length} karakter
              </div>
            </div>

            {/* Q2: Siapa penggunanya? (8 cards 4x2) */}
            <div className="space-y-3">
              <label className="block font-bold text-white text-sm">
                2. Siapa penggunanya?
              </label>
              <p className="text-xs text-slate-400">
                Pilih tipe pengguna utama yang paling relevan dengan produkmu.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {targetUsersList.map((user) => {
                  const isSelected = data.q2_targetUser === user.id;
                  const IconComp = user.icon;

                  return (
                    <button
                      key={user.id}
                      onClick={() => onChange({ q2_targetUser: user.id })}
                      className={`relative flex flex-col items-center text-center p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#111A2E] border-[#F2542D] shadow-[0_0_15px_rgba(242,84,45,0.25)] text-white'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#F2542D] flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <IconComp className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#F2542D]' : 'text-slate-400'}`} />
                      <span className="text-xs font-medium leading-snug">{user.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3: Apa fungsi paling penting yang harus ada di versi pertama? */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                3. Apa fungsi paling penting yang harus ada di versi pertama?
              </label>
              <p className="text-xs text-slate-400">
                Fokus pada satu fungsi inti yang menyelesaikan masalah utama di atas.
              </p>
              <textarea
                rows={3}
                value={data.q3_coreFeature}
                onChange={(e) => onChange({ q3_coreFeature: e.target.value })}
                placeholder="Contoh: Wizard wawancara interaktif yang langsung menghasilkan dokumen PRD, ERD, dan script migrasi SQL..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] focus:ring-1 focus:ring-[#F2542D] transition leading-relaxed"
              />
              <div className="text-right text-[11px] font-mono text-slate-500">
                {data.q3_coreFeature.length} karakter
              </div>
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                onClick={() => onNavigateGroup(1)}
                className="text-xs text-slate-500 hover:text-slate-300 transition cursor-not-allowed opacity-50"
                disabled
                type="button"
              >
                Awal
              </button>

              <button
                onClick={() => onNavigateGroup(2)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-sm shadow-lg shadow-[#F2542D]/25 transition"
                type="button"
              >
                <span>Lanjut ke Alur &amp; Lingkup (2/5)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            KELOMPOK 2/5: ALUR & LINGKUP
           ========================================================================= */}
        {groupIndex === 2 && (
          <div className="space-y-8">
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-[#F2542D] uppercase mb-2">
                KELOMPOK 2/5 • ALUR &amp; LINGKUP
              </div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
                Alur Pengguna &amp; Batasan Lingkup
              </h2>
              <p className="text-sm text-slate-400">
                Tentukan perjalanan pengguna dari awal hingga akhir, serta apa yang tidak masuk ke versi pertama.
              </p>
            </div>

            {/* Q4: User Flow */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                1. Ceritakan alur utama penggunaan produk dari awal sampai selesai
              </label>
              <p className="text-xs text-slate-400">
                Mulai dari pengguna membuka produk, melakukan aksi utama, hingga mendapatkan hasil.
              </p>
              <textarea
                rows={4}
                value={data.q4_userFlow}
                onChange={(e) => onChange({ q4_userFlow: e.target.value })}
                placeholder="Pengguna membuka aplikasi → mengisi form ide awal → memilih stack teknologi → menjawab interview terarah → mendapatkan hasil PRD komprehensif..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] focus:ring-1 focus:ring-[#F2542D] transition leading-relaxed"
              />
              <div className="text-right text-[11px] font-mono text-slate-500">
                {data.q4_userFlow.length} karakter
              </div>
            </div>

            {/* Q5: Aha Moment */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                2. Apa momen &quot;Aha&quot; bagi pengguna?
              </label>
              <p className="text-xs text-slate-400">
                Titik di mana pengguna merasa produk ini benar-benar bermanfaat bagi mereka.
              </p>
              <textarea
                rows={3}
                value={data.q5_ahaMoment}
                onChange={(e) => onChange({ q5_ahaMoment: e.target.value })}
                placeholder="Saat melihat skema database ERD visual dan script SQL yang langsung bisa dicopy-paste ke database..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] focus:ring-1 focus:ring-[#F2542D] transition leading-relaxed"
              />
              <div className="text-right text-[11px] font-mono text-slate-500">
                {data.q5_ahaMoment.length} karakter
              </div>
            </div>

            {/* Q6: Out of scope */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                3. Apa saja yang TIDAK masuk dalam versi pertama (V1)?
              </label>
              <p className="text-xs text-slate-400">
                Menentukan apa yang ditunda sama pentingnya dengan menentukan apa yang dibangun.
              </p>
              <textarea
                rows={3}
                value={data.q6_outOfScope}
                onChange={(e) => onChange({ q6_outOfScope: e.target.value })}
                placeholder="Pembayaran multi-currency, integrasi cloud VCS otomatis ke GitHub repository, mobile app..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] focus:ring-1 focus:ring-[#F2542D] transition leading-relaxed"
              />
              <div className="text-right text-[11px] font-mono text-slate-500">
                {data.q6_outOfScope.length} karakter
              </div>
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                onClick={() => onNavigateGroup(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                type="button"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali (1/5)</span>
              </button>

              <button
                onClick={() => onNavigateGroup(3)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-sm shadow-lg shadow-[#F2542D]/25 transition"
                type="button"
              >
                <span>Lanjut ke Model Data (3/5)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            KELOMPOK 3/5: MODEL DATA (Interactive Field Builder & Live ERD / SQL)
           ========================================================================= */}
        {groupIndex === 3 && (
          <div className="space-y-8">
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-[#F2542D] uppercase mb-2">
                KELOMPOK 3/5 • MODEL DATA
              </div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
                Model Data &amp; Relasi
              </h2>
              <p className="text-sm text-slate-400">
                Rancang struktur data yang akan digunakan. Kami bantu susun skema awal berdasarkan entitas yang kamu butuhkan.
              </p>
            </div>

            {/* Q7: Main entities */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                1. Entitas utama apa saja yang dibutuhkan?
              </label>
              <p className="text-xs text-slate-400">
                Sebutkan objek-objek data penting (contoh: user, project, task, order, product).
              </p>
              <input
                type="text"
                value={data.q7_mainEntities}
                onChange={(e) => onChange({ q7_mainEntities: e.target.value })}
                placeholder="user, project, task, prd_document..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] transition"
              />
            </div>

            {/* Q8: Interactive Field Builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-white text-sm">
                    2. Detail Field per Entitas
                  </label>
                  <p className="text-xs text-slate-400">
                    Tentukan field untuk masing-masing entitas. Kamu bisa menambah, mengubah, atau menghapus field.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddEntityModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-[#F2542D] text-[#F2542D] text-xs font-semibold hover:bg-[#F2542D]/10 transition"
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Entitas</span>
                </button>
              </div>

              {/* Entity Tabs Header */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                {data.q8_entities.map((entity) => {
                  const isActive = entity.id === activeEntity?.id;
                  return (
                    <button
                      key={entity.id}
                      onClick={() => setActiveEntityId(entity.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                        isActive
                          ? 'bg-[#F2542D] text-white shadow-sm'
                          : 'bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                      type="button"
                    >
                      <span>{entity.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-black/25 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {entity.fields.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Entity Fields Editor */}
              {activeEntity && (
                <div className="bg-[#0F1424] border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-mono text-slate-400 flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white uppercase">Table: {activeEntity.name}</span>
                    <span className="text-[11px] text-slate-500">{activeEntity.description || 'Database Entity'}</span>
                  </div>

                  {/* Field list */}
                  <div className="space-y-2.5">
                    {activeEntity.fields.map((field) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#131A2D]/80 p-2.5 rounded-lg border border-slate-800 text-xs"
                      >
                        {/* Name */}
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                            className="w-full bg-[#0B0F1B] border border-slate-700/80 rounded px-2.5 py-1.5 font-mono text-white text-xs focus:outline-none focus:border-[#F2542D]"
                            placeholder="field_name"
                          />
                        </div>

                        {/* Type */}
                        <div className="sm:col-span-3">
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(field.id, { type: e.target.value })}
                            className="w-full bg-[#0B0F1B] border border-slate-700/80 rounded px-2 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-[#F2542D]"
                          >
                            <option value="UUID">UUID</option>
                            <option value="VARCHAR">VARCHAR</option>
                            <option value="TEXT">TEXT</option>
                            <option value="INTEGER">INTEGER</option>
                            <option value="BOOLEAN">BOOLEAN</option>
                            <option value="TIMESTAMP">TIMESTAMP</option>
                            <option value="JSONB">JSONB / JSON</option>
                          </select>
                        </div>

                        {/* Flags: PK, Req, Unq */}
                        <div className="sm:col-span-3 flex items-center gap-3 font-mono text-[11px] text-slate-300">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!field.isPrimaryKey}
                              onChange={(e) => handleUpdateField(field.id, { isPrimaryKey: e.target.checked })}
                              className="rounded border-slate-700 text-[#F2542D] focus:ring-0"
                            />
                            <span>PK</span>
                          </label>

                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!field.isRequired}
                              onChange={(e) => handleUpdateField(field.id, { isRequired: e.target.checked })}
                              className="rounded border-slate-700 text-[#F2542D] focus:ring-0"
                            />
                            <span>Req</span>
                          </label>

                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!field.isUnique}
                              onChange={(e) => handleUpdateField(field.id, { isUnique: e.target.checked })}
                              className="rounded border-slate-700 text-[#F2542D] focus:ring-0"
                            />
                            <span>Unq</span>
                          </label>
                        </div>

                        {/* Default Value & Remove Button */}
                        <div className="sm:col-span-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={field.defaultValue || ''}
                            onChange={(e) => handleUpdateField(field.id, { defaultValue: e.target.value })}
                            placeholder="default..."
                            className="w-full bg-[#0B0F1B] border border-slate-700/80 rounded px-2 py-1.5 font-mono text-slate-300 text-xs focus:outline-none focus:border-[#F2542D]"
                          />

                          <button
                            onClick={() => handleRemoveField(field.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                            title="Hapus field"
                            type="button"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Field Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleAddField}
                      className="inline-flex items-center gap-1.5 text-xs text-[#F2542D] hover:underline font-semibold"
                      type="button"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Field</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Q9: Relations */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                3. Apakah ada relasi antar entitas yang perlu diperhatikan?
              </label>
              <p className="text-xs text-slate-400">
                Jelaskan bagaimana entitas-entitas di atas saling terhubung (contoh: 1 user punya banyak project).
              </p>
              <textarea
                rows={2}
                value={data.q9_relations}
                onChange={(e) => onChange({ q9_relations: e.target.value })}
                placeholder="user memiliki banyak project (1:N), project memiliki banyak task (1:N)..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] transition"
              />
            </div>

            {/* Q10: Data Rules */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                4. Apakah ada aturan khusus untuk data?
              </label>
              <p className="text-xs text-slate-400">
                Misal: email harus unik, status hanya boleh bernilai tertentu, data tidak boleh dihapus permanen (soft delete).
              </p>
              <textarea
                rows={2}
                value={data.q10_dataRules}
                onChange={(e) => onChange({ q10_dataRules: e.target.value })}
                placeholder="Email harus unik, password di-hash dengan bcrypt/argon2, soft delete dengan deleted_at..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] transition"
              />
            </div>

            {/* Live Schema & ERD Preview Box */}
            <div className="bg-[#090D18] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Eye className="w-4 h-4 text-[#F2542D]" />
                  <span>Live Preview Skema ({databaseId.toUpperCase()})</span>
                </div>

                {/* Switcher Tabs */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => setSchemaPreviewTab('erd')}
                    className={`px-2.5 py-1 rounded transition ${
                      schemaPreviewTab === 'erd'
                        ? 'bg-[#F2542D] text-white font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                    type="button"
                  >
                    Diagram ERD
                  </button>
                  <button
                    onClick={() => setSchemaPreviewTab('sql')}
                    className={`px-2.5 py-1 rounded transition ${
                      schemaPreviewTab === 'sql'
                        ? 'bg-[#F2542D] text-white font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                    type="button"
                  >
                    Schema SQL
                  </button>
                  <button
                    onClick={() => setSchemaPreviewTab('sample')}
                    className={`px-2.5 py-1 rounded transition ${
                      schemaPreviewTab === 'sample'
                        ? 'bg-[#F2542D] text-white font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                    type="button"
                  >
                    Contoh Data
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              {schemaPreviewTab === 'erd' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 erd-grid p-3 rounded-lg bg-[#070A14]/90 border border-slate-800/60 min-h-[160px]">
                  {data.q8_entities.map((entity) => (
                    <div key={entity.id} className="bg-[#101628] border border-slate-700/80 rounded-lg p-3 text-xs shadow-md">
                      <div className="font-mono font-bold text-white pb-1.5 mb-1.5 border-b border-slate-700/60 flex items-center justify-between">
                        <span className="text-[#F2542D]">{entity.name}</span>
                        <span className="text-[10px] text-slate-500">{entity.fields.length} cols</span>
                      </div>
                      <div className="space-y-1 font-mono text-[11px]">
                        {entity.fields.map(f => (
                          <div key={f.id} className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1">
                              {f.isPrimaryKey && <span className="text-amber-400 text-[9px] font-bold">PK</span>}
                              {f.name}
                            </span>
                            <span className="text-slate-500 text-[10px]">{f.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {schemaPreviewTab === 'sql' && (
                <pre className="p-3 rounded-lg bg-[#070A14] border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                  {`-- DDL Preview: ${databaseId.toUpperCase()}
${data.q8_entities.map(e => `CREATE TABLE ${e.name} (\n${e.fields.map(f => `    ${f.name.padEnd(14)} ${f.type}${f.isPrimaryKey ? ' PRIMARY KEY' : ''}${f.isRequired ? ' NOT NULL' : ''}`).join(',\n')}\n);`).join('\n\n')}`}
                </pre>
              )}

              {schemaPreviewTab === 'sample' && (
                <div className="p-2 rounded-lg bg-[#070A14] border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px] text-slate-300">
                    <thead className="border-b border-slate-700 text-slate-400">
                      <tr>
                        {activeEntity?.fields.map(f => (
                          <th key={f.id} className="p-2 font-semibold">{f.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      <tr>
                        {activeEntity?.fields.map(f => (
                          <td key={f.id} className="p-2 text-slate-400">
                            {f.isPrimaryKey ? '101' : f.type === 'VARCHAR' ? 'Sample Name' : f.type === 'TIMESTAMP' ? '2025-01-15' : 'true'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                onClick={() => onNavigateGroup(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                type="button"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali (2/5)</span>
              </button>

              <button
                onClick={() => onNavigateGroup(4)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-sm shadow-lg shadow-[#F2542D]/25 transition"
                type="button"
              >
                <span>Lanjut ke Batasan &amp; Skala (4/5)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            KELOMPOK 4/5: BATASAN & SKALA
           ========================================================================= */}
        {groupIndex === 4 && (
          <div className="space-y-8">
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-[#F2542D] uppercase mb-2">
                KELOMPOK 4/5 • BATASAN &amp; SKALA
              </div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
                Batasan &amp; Estimasi Skala
              </h2>
              <p className="text-sm text-slate-400">
                Informasi ini membantu menentukan arsitektur teknis, kebutuhan infrastruktur, dan rekomendasi performa.
              </p>
            </div>

            {/* Q11: Technical / Infra Constraints */}
            <div className="space-y-3">
              <label className="block font-bold text-white text-sm">
                1. Apakah ada batasan teknis atau infrastruktur tertentu?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  'Bisa jalan offline / lokal',
                  'Wajib cloud / hosted',
                  'Open source only',
                  'Gunakan layanan tertentu'
                ].map((opt) => {
                  const isChecked = data.q11_infraConstraints.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        const updated = isChecked
                          ? data.q11_infraConstraints.filter(x => x !== opt)
                          : [...data.q11_infraConstraints, opt];
                        onChange({ q11_infraConstraints: updated });
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#111A2E] border-[#F2542D] text-white'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      <span>{opt}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#F2542D] stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={data.q11_infraDetails}
                onChange={(e) => onChange({ q11_infraDetails: e.target.value })}
                placeholder="Catatan batasan teknis lainnya (opsional)..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
              />
            </div>

            {/* Q12: Estimasi Pengguna */}
            <div className="space-y-3">
              <label className="block font-bold text-white text-sm">
                2. Berapa perkiraan jumlah pengguna di tahun pertama?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Hanya saya',
                  '1 – 100',
                  '100 – 1.000',
                  '1.000 – 10.000',
                  '10.000+',
                  'Tidak tahu'
                ].map((scale) => {
                  const isSelected = data.q12_userEstimate === scale;
                  return (
                    <button
                      key={scale}
                      onClick={() => onChange({ q12_userEstimate: scale })}
                      className={`p-3 rounded-xl border text-center text-xs font-mono font-medium transition ${
                        isSelected
                          ? 'bg-[#111A2E] border-[#F2542D] text-white shadow-sm'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      {scale}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q13: Target Platform */}
            <div className="space-y-3">
              <label className="block font-bold text-white text-sm">
                3. Target platform untuk rilis pertama?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Web App', 'Mobile App', 'Desktop App', 'Lainnya'].map((platform) => {
                  const isSelected = data.q13_targetPlatform === platform;
                  return (
                    <button
                      key={platform}
                      onClick={() => onChange({ q13_targetPlatform: platform })}
                      className={`p-3 rounded-xl border text-center text-xs font-medium transition ${
                        isSelected
                          ? 'bg-[#111A2E] border-[#F2542D] text-white'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q14: Integrations */}
            <div className="space-y-3">
              <label className="block font-bold text-white text-sm">
                4. Apakah produk ini perlu terhubung dengan layanan lain?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Payment Gateway (Stripe/Midtrans)',
                  'Email Service (Resend/SendGrid)',
                  'AI (OpenAI, Claude, Gemini)',
                  'Storage (S3, Cloudflare R2)',
                  'Auth Provider (Google, GitHub)',
                  'Lainnya'
                ].map((integration) => {
                  const isChecked = data.q14_integrations.includes(integration);
                  return (
                    <button
                      key={integration}
                      onClick={() => {
                        const updated = isChecked
                          ? data.q14_integrations.filter(x => x !== integration)
                          : [...data.q14_integrations, integration];
                        onChange({ q14_integrations: updated });
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#111A2E] border-[#F2542D] text-white'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      <span className="truncate pr-1">{integration}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#F2542D] shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q15: Special Requirements */}
            <div className="space-y-3">
              <label className="block font-bold text-white text-sm">
                5. Kebutuhan khusus performa, keamanan, atau regulasi?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Performa tinggi',
                  'Keamanan data tinggi',
                  'Kepatuhan regulasi',
                  'Multi-tenant',
                  'Audit log',
                  'Lainnya'
                ].map((req) => {
                  const isChecked = data.q15_specialRequirements.includes(req);
                  return (
                    <button
                      key={req}
                      onClick={() => {
                        const updated = isChecked
                          ? data.q15_specialRequirements.filter(x => x !== req)
                          : [...data.q15_specialRequirements, req];
                        onChange({ q15_specialRequirements: updated });
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#111A2E] border-[#F2542D] text-white'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      <span>{req}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#F2542D] stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q16: Timeline */}
            <div className="space-y-3">
              <label className="block font-bold text-white text-sm">
                6. Kapan target rilis versi pertama (V1)?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  '< 1 bulan',
                  '1 – 3 bulan',
                  '3 – 6 bulan',
                  '> 6 bulan',
                  'Tidak ada target spesifik'
                ].map((time) => {
                  const isSelected = data.q16_timeline === time;
                  return (
                    <button
                      key={time}
                      onClick={() => onChange({ q16_timeline: time })}
                      className={`p-2.5 rounded-xl border text-center text-xs font-medium transition ${
                        isSelected
                          ? 'bg-[#111A2E] border-[#F2542D] text-white'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                onClick={() => onNavigateGroup(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                type="button"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali (3/5)</span>
              </button>

              <button
                onClick={() => onNavigateGroup(5)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white font-semibold text-sm shadow-lg shadow-[#F2542D]/25 transition"
                type="button"
              >
                <span>Lanjut ke Teknis &amp; Preferensi (5/5)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            KELOMPOK 5/5: TEKNIS & PREFERENSI (Final Group before Generation)
           ========================================================================= */}
        {groupIndex === 5 && (
          <div className="space-y-8">
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-[#F2542D] uppercase mb-2">
                KELOMPOK 5/5 • TEKNIS &amp; PREFERENSI
              </div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
                Preferensi Teknis &amp; Arsitektur
              </h2>
              <p className="text-sm text-slate-400">
                Langkah terakhir! Tentukan preferensi teknis untuk melengkapi dokumen PRD, arsitektur sistem, dan task list.
              </p>
            </div>

            {/* 1. Target Deployment */}
            <div className="space-y-2.5">
              <label className="block font-bold text-white text-sm">
                1. Target Deployment
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'vercel', title: 'Vercel', badge: 'Rekomendasi' },
                  { id: 'aws', title: 'AWS' },
                  { id: 'cloudflare', title: 'Cloudflare Pages' },
                  { id: 'vps', title: 'VPS / Docker' }
                ].map((item) => {
                  const isSelected = data.q17_deployment === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChange({ q17_deployment: item.id })}
                      className={`p-3 rounded-xl border text-center text-xs font-medium transition relative ${
                        isSelected
                          ? 'bg-[#111A2E] border-[#F2542D] text-white shadow-sm'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      <div className="font-semibold">{item.title}</div>
                      {item.badge && (
                        <div className="text-[9px] text-[#F2542D] font-mono mt-0.5">{item.badge}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Strategi Autentikasi */}
            <div className="space-y-2.5">
              <label className="block font-bold text-white text-sm">
                2. Strategi Autentikasi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'nextauth', title: 'NextAuth / Auth.js', badge: 'Rekomendasi', desc: 'Standar untuk Next.js' },
                  { id: 'supabase', title: 'Supabase Auth', desc: 'Terintegrasi BaaS' },
                  { id: 'clerk', title: 'Clerk', desc: 'Drop-in user management' }
                ].map((item) => {
                  const isSelected = data.q18_auth === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChange({ q18_auth: item.id })}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition ${
                        isSelected
                          ? 'bg-[#111A2E] border-[#F2542D] text-white shadow-sm'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{item.title}</span>
                        {item.badge && <span className="text-[9px] bg-[#F2542D] text-white px-1.5 py-0.2 rounded font-bold">{item.badge}</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Gaya Arsitektur API */}
            <div className="space-y-2.5">
              <label className="block font-bold text-white text-sm">
                3. Gaya Arsitektur API
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'server_actions', title: 'Next.js Server Actions', badge: 'Rekomendasi' },
                  { id: 'rest', title: 'RESTful API standard' },
                  { id: 'trpc', title: 'tRPC (End-to-end type safe)' }
                ].map((item) => {
                  const isSelected = data.q19_apiArch === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChange({ q19_apiArch: item.id })}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition ${
                        isSelected
                          ? 'bg-[#111A2E] border-[#F2542D] text-white shadow-sm'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{item.title}</span>
                        {item.badge && <span className="text-[9px] bg-[#F2542D] text-white px-1.5 py-0.2 rounded font-bold">{item.badge}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. File Storage */}
            <div className="space-y-2.5">
              <label className="block font-bold text-white text-sm">
                4. File Storage
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 's3_r2', title: 'S3 / Cloudflare R2' },
                  { id: 'supabase_storage', title: 'Supabase Storage' },
                  { id: 'uploadthing', title: 'Uploadthing' },
                  { id: 'none', title: 'Tidak perlu' }
                ].map((item) => {
                  const isSelected = data.q20_storage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChange({ q20_storage: item.id })}
                      className={`p-3 rounded-xl border text-center text-xs font-medium transition ${
                        isSelected
                          ? 'bg-[#111A2E] border-[#F2542D] text-white'
                          : 'bg-[#101726]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      type="button"
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Observability & Standards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block font-bold text-white text-xs">Observability &amp; Analytics</label>
                <div className="space-y-1.5">
                  {['Sentry', 'PostHog', 'Vercel Web Analytics'].map((item) => {
                    const isChecked = data.q21_observability.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => {
                          const updated = isChecked
                            ? data.q21_observability.filter(x => x !== item)
                            : [...data.q21_observability, item];
                          onChange({ q21_observability: updated });
                        }}
                        className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium transition flex items-center justify-between ${
                          isChecked ? 'bg-[#111A2E] border-[#F2542D] text-white' : 'bg-[#101726]/60 border-slate-800 text-slate-400'
                        }`}
                        type="button"
                      >
                        <span>{item}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#F2542D] stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-white text-xs">Testing &amp; Code Standards</label>
                <div className="space-y-1.5">
                  {['TypeScript Strict Mode', 'Vitest / Jest', 'ESLint + Prettier Config'].map((item) => {
                    const isChecked = data.q22_codeStandards.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => {
                          const updated = isChecked
                            ? data.q22_codeStandards.filter(x => x !== item)
                            : [...data.q22_codeStandards, item];
                          onChange({ q22_codeStandards: updated });
                        }}
                        className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium transition flex items-center justify-between ${
                          isChecked ? 'bg-[#111A2E] border-[#F2542D] text-white' : 'bg-[#101726]/60 border-slate-800 text-slate-400'
                        }`}
                        type="button"
                      >
                        <span>{item}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#F2542D] stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 7. Catatan teknis khusus */}
            <div className="space-y-2">
              <label className="block font-bold text-white text-sm">
                7. Catatan teknis khusus (opsional)
              </label>
              <textarea
                rows={2}
                value={data.q23_technicalNotes}
                onChange={(e) => onChange({ q23_technicalNotes: e.target.value })}
                placeholder="Misal: Gunakan server actions untuk mutasi data, caching ISR untuk halaman publik..."
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D] transition"
              />
            </div>

            {/* Bottom notification card */}
            <div className="p-3.5 rounded-xl bg-[#0E1528] border border-slate-800 text-slate-400 text-xs flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#F2542D]/20 text-[#F2542D] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p>
                Semua jawaban akan digabungkan untuk menghasilkan PRD lengkap, ERD, skema SQL, arsitektur sistem, dan task list sprint.
              </p>
            </div>

            {/* Final Action Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                onClick={() => onNavigateGroup(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                type="button"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali (4/5)</span>
              </button>

              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2.5 px-9 py-3.5 rounded-xl bg-[#F2542D] hover:bg-[#ff6742] text-white font-bold text-sm shadow-[0_0_30px_rgba(242,84,45,0.45)] hover:shadow-[0_0_40px_rgba(242,84,45,0.7)] transition-all duration-200 transform active:scale-[0.99]"
                type="button"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyusun Spesifikasi &amp; Dokumen PRD...</span>
                  </>
                ) : (
                  <>
                    <span>Buat Dokumen PRD</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </section>

      {/* Add Entity Modal */}
      {showAddEntityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0F1424] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Tambah Entitas Baru</h3>
            <p className="text-xs text-slate-400">
              Masukkan nama tabel / entitas database (contoh: orders, payments, comments).
            </p>
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              placeholder="nama_entitas"
              className="w-full bg-[#080C16] border border-slate-700 rounded-lg p-3 font-mono text-sm text-white focus:outline-none focus:border-[#F2542D]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddEntityModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                type="button"
              >
                Batal
              </button>
              <button
                onClick={handleCreateEntity}
                className="px-5 py-2 bg-[#F2542D] hover:bg-[#ff6742] text-white text-xs font-semibold rounded-lg shadow"
                type="button"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
