import { GeneratedPRDResult, InterviewData, TaskItem, RiskItem, FeatureTreeNode } from '../types';
import { PRODUCT_TYPES, FRONTEND_OPTIONS, DATABASE_OPTIONS } from './constants';

// Breaks a free-text interview answer into up to `max` short bullet points —
// used to derive sub-feature/task labels from the user's own words instead
// of inventing generic filler text.
function splitIntoPoints(text: string, max: number): string[] {
  const cleaned = (text || '').trim();
  if (!cleaned) return [];
  let parts = cleaned
    .split(/\r?\n+/)
    .map(s => s.replace(/^[-•*\d.\)]+\s*/, '').trim())
    .filter(Boolean);
  if (parts.length < 2) {
    parts = cleaned.split(/(?<=[.;])\s+/).map(s => s.trim()).filter(Boolean);
  }
  if (parts.length === 0) parts = [cleaned];
  return parts.slice(0, max);
}

function capitalizeWords(str: string): string {
  return str.replace(/(^|[_\s])(\w)/g, (_, sep, ch) => (sep === '_' ? ' ' : sep) + ch.toUpperCase());
}

// Honest gap markers for the Master PRD structure below — used instead of
// inventing specifics the interview never asked about (business metrics,
// wireframes, CI/CD pipeline config, etc).
const NOT_DETERMINED = '*Belum ditentukan pada tahap wawancara ini — perlu dilengkapi tim produk saat scoping lanjutan.*';
function notRelevant(reason: string): string {
  return `*Tidak relevan untuk produk ini — ${reason}*`;
}

export function generatePRDFromInputs(
  productTypeId: string,
  frontendId: string,
  databaseId: string,
  interview: InterviewData
): GeneratedPRDResult {
  const prodType = PRODUCT_TYPES.find(p => p.id === productTypeId)?.title || 'Website / Web App';
  const frontend = FRONTEND_OPTIONS.find(f => f.id === frontendId)?.title || 'Next.js (React)';
  const database = DATABASE_OPTIONS.find(d => d.id === databaseId)?.title || 'PostgreSQL';
  
  // Backend derived
  let backend = 'Next.js API Routes';
  if (frontendId === 'vue_nuxt') backend = 'Nuxt Server Engine / Nitro';
  else if (frontendId === 'react_native') backend = 'Node.js / Express API';
  else if (frontendId === 'electron') backend = 'Electron IPC & Local Node.js Backend';
  else if (databaseId === 'supabase') backend = 'Supabase Edge Functions & REST';
  else if (databaseId === 'none') backend = 'Tanpa Backend (Static Client)';

  const deploymentMap: Record<string, string> = {
    vercel: 'Vercel (Edge/Node Serverless)',
    aws: 'AWS (Amplify / ECS)',
    cloudflare: 'Cloudflare Pages / Workers',
    vps: 'VPS / Docker Linux Container'
  };
  const deployment = deploymentMap[interview.q17_deployment] || 'Vercel (Edge/Node)';

  // Product Name derivation
  const productName = interview.q1_problem.slice(0, 40).trim() 
    ? `${prodType} Solution`
    : 'Modern Web Application';

  // Build SQL Schema based on entities and database flavor
  const isPostgres = databaseId === 'postgresql' || databaseId === 'neon' || databaseId === 'supabase';
  const isSqlite = databaseId === 'sqlite';
  const isMysql = databaseId === 'mysql' || databaseId === 'mariadb' || databaseId === 'planetscale';

  let sqlLines: string[] = [];
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATABASE SCHEMA: ${database.toUpperCase()}`);
  sqlLines.push(`-- Generated for: ${prodType}`);
  sqlLines.push(`-- Target Deployment: ${deployment}`);
  sqlLines.push(`-- Created at: ${new Date().toISOString().split('T')[0]}`);
  sqlLines.push(`-- =========================================================\n`);

  if (isPostgres) {
    sqlLines.push(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`);
  }

  // Generate tables from interview.q8_entities
  interview.q8_entities.forEach(entity => {
    sqlLines.push(`-- Table: ${entity.name}`);
    sqlLines.push(`CREATE TABLE IF NOT EXISTS ${entity.name} (`);
    const fieldDefs = entity.fields.map(f => {
      let typeStr = f.type;
      if (f.isPrimaryKey) {
        if (isPostgres) {
          typeStr = f.type === 'UUID' ? 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()' : `${f.type} PRIMARY KEY`;
        } else if (isSqlite) {
          typeStr = f.type === 'UUID' ? 'TEXT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        } else if (isMysql) {
          typeStr = f.type === 'UUID' ? 'VARCHAR(36) PRIMARY KEY' : 'INT AUTO_INCREMENT PRIMARY KEY';
        } else {
          typeStr = `${f.type} PRIMARY KEY`;
        }
      } else {
        if (f.type === 'UUID' && !isPostgres) {
          typeStr = isSqlite ? 'TEXT' : 'VARCHAR(36)';
        } else if (f.type === 'VARCHAR') {
          typeStr = 'VARCHAR(255)';
        } else if (f.type === 'TIMESTAMP') {
          typeStr = isPostgres ? 'TIMESTAMPTZ' : isMysql ? 'DATETIME' : 'TEXT';
        }
      }

      let constraints = [];
      if (f.isRequired && !f.isPrimaryKey) constraints.push('NOT NULL');
      if (f.isUnique && !f.isPrimaryKey) constraints.push('UNIQUE');
      if (f.defaultValue) {
        if (f.defaultValue === 'now()' && isPostgres) constraints.push('DEFAULT CURRENT_TIMESTAMP');
        else if (f.defaultValue === 'now()') constraints.push('DEFAULT CURRENT_TIMESTAMP');
        else constraints.push(`DEFAULT ${f.defaultValue}`);
      }

      // Foreign key inference
      if (f.name.endsWith('_id') && !f.isPrimaryKey) {
        const refTable = f.name.replace('_id', 's');
        if (isPostgres || isMysql) {
          constraints.push(`REFERENCES ${refTable}(id) ON DELETE CASCADE`);
        }
      }

      return `    ${f.name.padEnd(16)} ${typeStr}${constraints.length > 0 ? ' ' + constraints.join(' ') : ''}`;
    });
    sqlLines.push(fieldDefs.join(',\n'));
    sqlLines.push(`);\n`);
  });

  // Indexes
  sqlLines.push(`-- Recommended Indexes for performance`);
  interview.q8_entities.forEach(entity => {
    entity.fields.filter(f => f.name.endsWith('_id') || f.isUnique).forEach(f => {
      sqlLines.push(`CREATE INDEX IF NOT EXISTS idx_${entity.name}_${f.name} ON ${entity.name}(${f.name});`);
    });
  });

  const sqlSchema = sqlLines.join('\n');

  // Infer FK relationships from real field names (same convention the SQL
  // generator uses: a `<x>_id` field points at a `<x>s` table) instead of
  // ever hardcoding which entities exist — every project has different ones.
  const entityNames = new Set(interview.q8_entities.map(e => e.name));
  type InferredRelation = { from: string; to: string; field: string };
  const inferredRelations: InferredRelation[] = [];
  interview.q8_entities.forEach(entity => {
    entity.fields.forEach(f => {
      if (f.isPrimaryKey || !f.name.endsWith('_id')) return;
      const refTable = f.name.replace(/_id$/, 's');
      if (entityNames.has(refTable) && refTable !== entity.name) {
        inferredRelations.push({ from: refTable, to: entity.name, field: f.name });
      }
    });
  });

  // Mermaid ERD
  let mermaidLines: string[] = ['erDiagram'];
  interview.q8_entities.forEach(entity => {
    mermaidLines.push(`    ${entity.name} {`);
    entity.fields.forEach(f => {
      let keyType = f.isPrimaryKey ? 'PK' : (f.name.endsWith('_id') ? 'FK' : '');
      mermaidLines.push(`        ${f.type} ${f.name} ${keyType}`.trim());
    });
    mermaidLines.push(`    }`);
  });
  inferredRelations.forEach(rel => {
    mermaidLines.push(`    ${rel.from} ||--o{ ${rel.to} : "${rel.field}"`);
  });
  const mermaidErd = mermaidLines.join('\n');

  // Mermaid system architecture diagram — built from the same interview
  // answers as the tables below, not a fixed diagram every project gets.
  const authLabel = interview.q18_auth || 'NextAuth / Auth.js';
  const storageLabel = interview.q20_storage || 'Cloudflare R2';
  const apiArchLabel = interview.q19_apiArch || 'REST API';
  const integrations = (interview.q14_integrations || []).filter(Boolean);
  const observability = (interview.q21_observability || []).filter(Boolean);

  const archLines: string[] = ['flowchart TD'];
  archLines.push(`    Client["${frontend}<br/><i>Client</i>"]`);
  archLines.push(`    API["${backend}<br/><i>${apiArchLabel}</i>"]`);
  archLines.push(`    DB[("${database}")]`);
  archLines.push(`    Auth["${authLabel}"]`);
  archLines.push(`    Storage["${storageLabel}"]`);
  archLines.push(`    Deploy(["${deployment}"])`);
  archLines.push('');
  archLines.push('    Client -->|Request| API');
  archLines.push('    API -->|Query| DB');
  archLines.push('    API --> Auth');
  archLines.push('    API --> Storage');
  archLines.push('    Deploy -.->|hosts| API');

  if (integrations.length > 0) {
    archLines.push('    subgraph Integrasi["Layanan Eksternal"]');
    integrations.forEach((name, i) => archLines.push(`        Int${i}["${name}"]`));
    archLines.push('    end');
    archLines.push('    API --> Integrasi');
  }

  if (observability.length > 0) {
    archLines.push('    subgraph Observability["Observability"]');
    observability.forEach((name, i) => archLines.push(`        Obs${i}["${name}"]`));
    archLines.push('    end');
    archLines.push('    API -.->|logs & metrics| Observability');
  }

  const mermaidArchitecture = archLines.join('\n');

  // Generate actionable tasks & sprints
  const tasks: TaskItem[] = [
    // Sprint 1: Foundation
    { id: 't1', sprint: 1, sprintName: 'Sprint 1 – Foundation & Setup', title: `Inisialisasi Project Repo (${frontend})`, category: 'Setup', priority: 'P0', completed: true },
    { id: 't2', sprint: 1, sprintName: 'Sprint 1 – Foundation & Setup', title: `Setup Database ${database} & Migrasi Awal`, category: 'Database', priority: 'P0', completed: true },
    { id: 't3', sprint: 1, sprintName: 'Sprint 1 – Foundation & Setup', title: `Konfigurasi Autentikasi (${interview.q18_auth || 'NextAuth'})`, category: 'Auth', priority: 'P0', completed: false },
    { id: 't4', sprint: 1, sprintName: 'Sprint 1 – Foundation & Setup', title: `Desain Design System & Layout Utama (Tailwind CSS)`, category: 'Frontend', priority: 'P1', completed: false },

    // Sprint 2: Core Features
    { id: 't5', sprint: 2, sprintName: 'Sprint 2 – Core MVP Execution', title: `Implementasi Alur Utama: ${interview.q3_coreFeature.slice(0, 45)}...`, category: 'Core', priority: 'P0', completed: false },
    { id: 't6', sprint: 2, sprintName: 'Sprint 2 – Core MVP Execution', title: 'Pembuatan CRUD Entitas: ' + interview.q8_entities.map(e => e.name).join(', '), category: 'Backend', priority: 'P0', completed: false },
    { id: 't7', sprint: 2, sprintName: 'Sprint 2 – Core MVP Execution', title: `Validasi Formulir & Schema Zod (${interview.q19_apiArch})`, category: 'API', priority: 'P1', completed: false },
    { id: 't8', sprint: 2, sprintName: 'Sprint 2 – Core MVP Execution', title: `Optimasi Momen "Aha" Pengguna: ${interview.q5_ahaMoment.slice(0, 40)}...`, category: 'UX', priority: 'P1', completed: false },

    // Sprint 3: Integration, Polish & Deploy
    { id: 't9', sprint: 3, sprintName: 'Sprint 3 – Integration & Launch', title: `Integrasi Layanan Eksternal (${interview.q14_integrations.join(', ') || 'AI / Storage'})`, category: 'Integration', priority: 'P1', completed: false },
    { id: 't10', sprint: 3, sprintName: 'Sprint 3 – Integration & Launch', title: `Setup Observability (${interview.q21_observability.join(', ') || 'Error Monitoring'})`, category: 'DevOps', priority: 'P2', completed: false },
    { id: 't11', sprint: 3, sprintName: 'Sprint 3 – Integration & Launch', title: `Automated Testing & Linting (${interview.q22_codeStandards.join(', ') || 'TypeScript Strict'})`, category: 'QA', priority: 'P1', completed: false },
    { id: 't12', sprint: 3, sprintName: 'Sprint 3 – Integration & Launch', title: `Deploy Production ke ${deployment}`, category: 'Release', priority: 'P0', completed: false }
  ];

  // Feature roadmap tree (Fitur -> Sub Fitur -> Tasks). Every node is derived
  // from real interview answers — the core feature description, the user's
  // own flow steps, and the entities/auth they actually configured — never
  // a fixed example feature set.
  const featureTree: FeatureTreeNode[] = [];

  const coreFeatureLabel = interview.q3_coreFeature.trim().slice(0, 48) || 'Fitur Inti Produk';
  featureTree.push({
    id: 'feat-core',
    name: coreFeatureLabel + (interview.q3_coreFeature.trim().length > 48 ? '…' : ''),
    phase: 1,
    status: 'Fitur utama produk',
    subFeatures: splitIntoPoints(interview.q4_userFlow, 3),
    tasks: [
      `Implementasi alur utama: ${interview.q3_coreFeature.slice(0, 45)}${interview.q3_coreFeature.length > 45 ? '...' : ''}`,
      `Optimasi momen "aha": ${interview.q5_ahaMoment.slice(0, 40)}${interview.q5_ahaMoment.length > 40 ? '...' : ''}`
    ]
  });

  const entityPhase = (index: number) => (index < 2 ? 2 : 3);
  interview.q8_entities.forEach((entity, idx) => {
    const label = capitalizeWords(entity.name);
    featureTree.push({
      id: `feat-entity-${entity.id}`,
      name: `Manajemen ${label}`,
      phase: entityPhase(idx),
      status: `${entity.fields.length} kolom data`,
      subFeatures: [
        `Tambah ${label}`,
        `Kelola & Cari ${label}`,
        `Edit / Hapus ${label}`
      ],
      tasks: [
        `Rancang skema & migrasi tabel ${entity.name}`,
        `Bangun endpoint API ${entity.name} (${interview.q19_apiArch || 'REST API'})`,
        `Bangun antarmuka ${label} (${frontend})`
      ]
    });
  });

  const lastPhase = interview.q8_entities.length <= 2 ? 2 : 3;
  featureTree.push({
    id: 'feat-auth',
    name: 'Autentikasi & Sesi Pengguna',
    phase: lastPhase,
    status: interview.q18_auth || 'Auth.js / NextAuth',
    subFeatures: ['Registrasi & Login', 'Manajemen Sesi', 'Proteksi Rute Privat'],
    tasks: [
      `Konfigurasi autentikasi (${interview.q18_auth || 'NextAuth'})`,
      `Middleware otorisasi berbasis sesi di ${backend}`
    ]
  });

  // Risks
  const risks: RiskItem[] = [
    {
      id: 'r1',
      risk: 'Skalabilitas dan response time saat pengguna mencapai batas awal',
      category: 'Performa',
      severity: 'Sedang',
      likelihood: 'Sedang',
      mitigation: 'Implementasikan caching pada layer database, query indexing, dan optimasi edge caching.'
    },
    {
      id: 'r2',
      risk: 'Kebocoran data kredensial atau otorisasi tidak valid pada multi-user',
      category: 'Keamanan',
      severity: 'Tinggi',
      likelihood: 'Rendah',
      mitigation: 'Terapkan Row Level Security (RLS) atau middleware otorisasi berbasis sesi server-side ketat.'
    },
    {
      id: 'r3',
      risk: 'Scope creep di luar target rilis awal (' + interview.q16_timeline + ')',
      category: 'Manajemen Proyek',
      severity: 'Tinggi',
      likelihood: 'Sedang',
      mitigation: 'Tegakkan batasan V1: fitur seperti ' + (interview.q6_outOfScope || 'fitur lanjutan') + ' ditunda ke rilis V2.'
    },
    {
      id: 'r4',
      risk: 'Ketergantungan pada third-party API ' + (interview.q14_integrations.join(', ') || 'external services'),
      category: 'Infrastruktur',
      severity: 'Sedang',
      likelihood: 'Sedang',
      mitigation: 'Sediakan fallback graceful degradation dan queue retry system saat API eksternal mengalami latency.'
    }
  ];

  // ===========================================================================
  // Derived signals reused across the Master PRD chapters below — computed
  // once instead of repeating the same interview.q* checks in every chapter.
  // ===========================================================================
  const usesAi = interview.q14_integrations.some(i => i.startsWith('AI'));
  const offlineCapable = interview.q11_infraConstraints.includes('Bisa jalan offline / lokal');
  const complianceReal = interview.q28_complianceNeeds.filter(c => c !== 'Tidak ada kebutuhan khusus');
  const rolesReal = interview.q26_teamRoles.filter(r => r !== 'Owner Tunggal (tanpa role)');
  const techProficiency = interview.q2_targetUser === 'Developer / Teknis'
    ? 'Tinggi — nyaman dengan istilah teknis, API, dan dokumentasi mentah.'
    : interview.q2_targetUser === 'Mahasiswa / Pelajar'
    ? 'Sedang — terbiasa dengan aplikasi web modern namun tidak selalu paham istilah teknis.'
    : 'Sedang — mengutamakan antarmuka yang intuitif tanpa perlu pelatihan khusus.';
  const adminPersona = rolesReal.includes('Admin')
    ? `**Admin**: mengelola data ${interview.q8_entities.map(e => e.name).join(', ')}, memonitor aktivitas pengguna, dan mengatur konfigurasi sistem.`
    : NOT_DETERMINED;
  const notAGeneratorProduct = notRelevant('bagian ini hanya berlaku untuk produk yang secara khusus membangun mesin generate PRD/ERD/SQL/Sprint otomatis (seperti RotaLogic PRD Generator sendiri).');
  const phase1Names = featureTree.filter(n => n.phase === 1).map(n => n.name);
  const phase2Names = featureTree.filter(n => n.phase === 2).map(n => n.name);
  const phase3Names = featureTree.filter(n => n.phase === 3).map(n => n.name);

  // Sitemap derived from real entities + core feature — same pattern as the
  // ERD/SQL generators: rules applied to real data, not invented pages.
  const sitemapBlock = [
    '- **Beranda / Dashboard** — ringkasan & titik masuk utama.',
    '- **Autentikasi** — Login, Registrasi' + (interview.q18_auth ? ` (${authLabel})` : '') + '.',
    ...interview.q8_entities.map(e => `- **Manajemen ${capitalizeWords(e.name)}** — daftar, detail, tambah/ubah/hapus.`),
    '- **Pengaturan / Profil** — preferensi akun pengguna.'
  ].join('\n');

  // Functional requirement block per feature — the featureTree already
  // carries real sub-features/tasks derived from the interview, so each
  // node maps 1:1 onto the master structure's per-feature template.
  const functionalRequirementsBlock = featureTree.map((node, i) => `### 08.${i + 1} ${node.name}
- **Feature Objective**: ${node.status}
- **User Story**: Sebagai ${interview.q2_targetUser.toLowerCase()}, saya ingin ${node.name.toLowerCase()} agar mendapatkan nilai seperti: "${interview.q5_ahaMoment.slice(0, 70)}${interview.q5_ahaMoment.length > 70 ? '...' : ''}"
- **Preconditions**: Pengguna telah melalui ${authLabel}.
- **Trigger**: Pengguna mengakses menu/halaman terkait ${node.name.toLowerCase()}.
- **Main Flow**:
${node.subFeatures.map((sf, j) => `  ${j + 1}. ${sf}`).join('\n')}
- **Alternative Flow**: Tidak ada alur alternatif khusus yang teridentifikasi dari wawancara.
- **Exception Flow**: Input tidak valid ditolak dengan pesan error yang jelas; permintaan gagal tidak mengubah data.
- **Business Rules**: ${interview.q10_dataRules || NOT_DETERMINED}
- **Validation Rules**: ${interview.q10_dataRules || NOT_DETERMINED}
- **Permissions**: ${rolesReal.length > 0 ? rolesReal.join(', ') : 'Seluruh pengguna terautentikasi'}
- **System Response**: Data tersimpan ke ${database} dan hasilnya ditampilkan kembali ke pengguna.
- **Acceptance Criteria**:
${node.tasks.map(t => `  - [ ] ${t}`).join('\n')}
- **Analytics Events**: ${NOT_DETERMINED}
- **Dependencies**: ${backend}, ${database}`).join('\n\n');

  const userStoriesBlock = featureTree.map(node =>
    `- Sebagai **${interview.q2_targetUser}**, saya ingin **${(node.subFeatures[0] || node.name).toLowerCase()}** sehingga saya bisa memanfaatkan ${node.name.toLowerCase()} dengan mudah.`
  ).join('\n');

  // Full PRD Markdown — structured to follow RotaLogic's Master PRD Structure
  // (00. Document Control ... 54. Appendices). Chapters with no real source
  // in the interview are marked honestly instead of filled with invented
  // specifics; chapters that only apply to PRD/ERD/SQL-generator products
  // (not to whatever the user is actually building) are marked not relevant.
  const prdMarkdown = `# Product Requirements Document (PRD)
**Proyek**: ${prodType}
**Versi**: 1.0.0 (Draft — Hasil Generate Otomatis)
**Status**: Draft — menunggu review manual sebelum implementasi
**Target Rilis**: ${interview.q16_timeline || '3 bulan'}
**Disusun oleh**: RotaLogic PRD Generator

---

## 00. Document Control

**00.1 Document Metadata**
| Field | Nilai |
| :--- | :--- |
| Nama Dokumen | PRD — ${productName} |
| Produk | ${prodType} |
| Versi | 1.0.0 |
| Status | Draft |
| Tanggal Generate | ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} |

**00.2 Version History**
| Versi | Tanggal | Perubahan |
| :--- | :--- | :--- |
| 1.0.0 | ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Generate awal otomatis dari sesi wawancara |

**00.3 Document Status**: Draft — belum direview manual oleh tim produk/engineering.

**00.4 Stakeholders**: ${interview.q2_targetUser} (pengguna akhir)${rolesReal.length > 0 ? `, ${rolesReal.join(', ')}` : ''}, Tim Engineering, Tim Produk RotaLogic.

**00.5 Approvals**: Belum ditandatangani — menunggu review Product Owner dan Tech Lead sebelum masuk fase implementasi.

---

## 01. Product Foundation

**01.1 Executive Summary**: ${productName} adalah ${prodType.toLowerCase()} untuk ${interview.q2_targetUser.toLowerCase()} yang menyelesaikan: ${interview.q1_problem}

**01.2 Background**: ${interview.q1_problem}

**01.3 Problem Statement**: ${interview.q1_problem}

**01.4 Opportunity Statement**: Menyediakan solusi terstruktur bagi ${interview.q2_targetUser.toLowerCase()} yang saat ini menghadapi kendala di atas, lewat fungsi inti: ${interview.q3_coreFeature}

**01.5 Product Vision**: Membangun solusi ${prodType.toLowerCase()} yang menyelesaikan masalah di atas dengan antarmuka cepat, terstruktur, dan siap dikembangkan.

**01.6 Product Mission**: Menghadirkan ${interview.q3_coreFeature.toLowerCase()} bagi ${interview.q2_targetUser.toLowerCase()} secara andal pada skala ${interview.q12_userEstimate || 'awal'}.

**01.7 Product Principles** & **01.8 Product Philosophy**: ${NOT_DETERMINED}

**01.9 Core Value Proposition**: ${interview.q3_coreFeature}

**01.10 Unique Value Proposition** & **01.11 Differentiation**: ${NOT_DETERMINED}

**01.12 Aha Moment / Core Value Metric**: "${interview.q5_ahaMoment}"

**01.13 Product North Star**: Jumlah ${interview.q2_targetUser.toLowerCase()} yang mencapai momen "Aha" di atas secara berulang.

**01.14 Product Goals**: ${interview.q3_coreFeature}

**01.15 Non-Goals**: ${interview.q6_outOfScope}

**01.16 Success Definition**: Rilis V1 tercapai dalam ${interview.q16_timeline || 'target waktu yang ditentukan'} dengan fungsi inti berjalan stabil untuk estimasi ${interview.q12_userEstimate || 'pengguna awal'}.

---

## 02. Business Requirements

**02.1 Business Context**: ${interview.q1_problem}

**02.2 Business Objectives**: Merilis ${interview.q3_coreFeature.toLowerCase()} dalam ${interview.q16_timeline || 'target waktu yang ditentukan'}.

**02.3 Business Model**: ${interview.q24_businessModel}

**02.4 Revenue Model** & **02.5 Pricing Strategy**: ${interview.q25_pricingNotes || NOT_DETERMINED}

**02.6 Cost Structure**, **02.7 Unit Economics**, **02.8 Market Opportunity**, **02.9 Competitive Landscape**, **02.10 Competitive Differentiation**, **02.11 Go-To-Market Considerations**: ${NOT_DETERMINED}

**02.12 Business Constraints**: ${interview.q11_infraConstraints.join(', ') || NOT_DETERMINED}

**02.13 Legal / Regulatory Constraints**: ${complianceReal.length > 0 ? complianceReal.join(', ') : NOT_DETERMINED}

**02.14 Business Assumptions**: Lihat Bab 36. **02.15 Business Risks**: Lihat Bab 38.

---

## 03. Users & Personas

**03.1 Target Users** & **03.2 User Segments**: ${interview.q2_targetUser}

**03.3 Primary Persona**: ${interview.q2_targetUser}, estimasi volume ${interview.q12_userEstimate || 'belum ditentukan'}, mengakses lewat ${interview.q13_targetPlatform}.

**03.4 Secondary Personas** & **03.5 Buyer Persona**: ${NOT_DETERMINED}

**03.6 Admin Persona**: ${adminPersona}

**03.7 Technical Persona**: ${NOT_DETERMINED}

**03.8 User Goals**: ${interview.q3_coreFeature}

**03.9 User Pain Points**: ${interview.q1_problem}

**03.10 User Motivations**: "${interview.q5_ahaMoment}"

**03.11 User Behaviors**: ${NOT_DETERMINED}

**03.12 Technical Proficiency**: ${techProficiency}

**03.13 User Environment**: Platform ${interview.q13_targetPlatform}.

**03.14 Accessibility Needs** & **03.15 Persona Prioritization**: ${NOT_DETERMINED}

---

## 04. User Journey & Experience

**04.1 User Journey Overview**: ${interview.q4_userFlow}

**04.2 Discovery Journey**, **04.3 Onboarding Journey**: ${NOT_DETERMINED}

**04.4 Core Product Journey**: ${interview.q4_userFlow}

**04.5 Activation Journey**: Titik aktivasi tercapai saat pengguna mengalami: "${interview.q5_ahaMoment}"

**04.6 Retention Journey**, **04.7 Conversion Journey**: ${NOT_DETERMINED}

**04.8 Export / Completion Journey**: ${interview.q4_userFlow}

**04.9 Error / Recovery Journey**: Kesalahan input ditolak dengan pesan jelas tanpa mengubah data yang tersimpan.

**04.10 Empty-State Journey**, **04.11 Returning User Journey**: ${NOT_DETERMINED}

**04.12 User Journey Map**: Lihat diagram alur pada Bab 10.

**04.13 Experience Principles**: ${NOT_DETERMINED}

---

## 05. Information Architecture

**05.1 Information Architecture Overview** & **05.2 Sitemap**:
${sitemapBlock}

**05.3 Navigation Structure**, **05.4 Global Navigation**, **05.5 Contextual Navigation**: ${NOT_DETERMINED}

**05.6 Workspace Structure**, **05.7 Project Structure**: ${NOT_DETERMINED}

**05.8 Settings Structure**: Pengaturan akun & preferensi pengguna.

**05.9 Search Architecture**: ${NOT_DETERMINED}

**05.10 Content Hierarchy**: Entitas utama — ${interview.q8_entities.map(e => e.name).join(', ')}.

---

## 06. Product Scope

**06.1 MVP Scope**: ${interview.q3_coreFeature}

**06.2 V1 Scope**: ${[...phase1Names, ...phase2Names].join(', ') || interview.q3_coreFeature}

**06.3 V1.1 Scope**: ${phase3Names.join(', ') || NOT_DETERMINED}

**06.4 V2 Scope**: ${interview.q30_postMvpPlan || NOT_DETERMINED}

**06.5 Future Scope**: ${interview.q30_postMvpPlan || NOT_DETERMINED}

**06.6 Out of Scope**: ${interview.q6_outOfScope}

**06.7 Scope Boundaries**: Batas V1 mengikuti fungsi inti di atas; fitur di luar itu ditunda ke V2.

**06.8 Feature Prioritization Framework** & **06.9 Priority Definition**: Prioritas P0 (wajib rilis), P1 (penting, bisa menyusul), P2 (nice-to-have) — lihat Bab 48/49.

**06.10 Feature Dependency Map**: Lihat kolom Dependencies pada setiap fitur di Bab 08.

---

## 07. Feature Map

**07.1 Feature Overview**: ${featureTree.length} kelompok fitur teridentifikasi dari wawancara (lihat juga tab "Roadmap Fitur").

**07.2 Core Features (Fase 1)**: ${phase1Names.join(', ') || NOT_DETERMINED}

**07.3 Supporting Features (Fase 2-3)**: ${[...phase2Names, ...phase3Names].join(', ') || NOT_DETERMINED}

**07.4 Platform Features**: Target platform ${interview.q13_targetPlatform}.

**07.5 Administrative Features**: ${rolesReal.includes('Admin') ? adminPersona : notRelevant('tidak ada role Admin yang didefinisikan untuk produk ini.')}

**07.6 AI Features**: ${usesAi ? `Terintegrasi AI (${interview.q14_integrationDetails || 'penalaran & enrich data'}).` : notRelevant('AI tidak dipilih sebagai kebutuhan integrasi produk ini.')}

**07.7 Collaboration Features**: ${rolesReal.length > 0 ? `Peran: ${rolesReal.join(', ')}.` : notRelevant('produk ini dijalankan oleh single owner tanpa peran tim tambahan.')}

**07.8 Export Features**: ${NOT_DETERMINED}

**07.9 Integration Features**: ${integrations.length > 0 ? integrations.join(', ') : NOT_DETERMINED}

**07.10 Feature Dependency Matrix**: Lihat Bab 08 per fitur. **07.11 Feature Status**: Seluruhnya berstatus "Menyusun spec" (baru digenerate).

---

## 08. Functional Requirements

**08.1 Overview**: Setiap fitur di bawah diturunkan langsung dari entitas dan alur yang didefinisikan pada sesi wawancara.

**08.2 Requirement ID Convention**: \`FR-08.x\` mengikuti nomor fitur di bawah.

**08.3 Requirement Priority**: Lihat prioritas P0/P1/P2 pada Bab 48/49.

**08.4 Requirement Traceability**: Lihat Bab 42.

**08.5 Functional Requirement Specification**:

${functionalRequirementsBlock}

---

## 09. User Stories

**09.1 User Story Format**: "Sebagai [persona], saya ingin [aksi] sehingga [manfaat]."

**09.2 Epic Definition** & **09.3 Epic List**: Satu epic per kelompok fitur pada Bab 07.

**09.4 User Story List**:
${userStoriesBlock}

**09.5 Story Priority**: Mengikuti prioritas fitur di Bab 48/49. **09.6 Story Dependencies**: Lihat Bab 08.

**09.7 Story Estimation**: ${NOT_DETERMINED}

**09.8 Definition of Ready**: Requirement pada Bab 08 terisi lengkap sebelum masuk sprint.

**09.9 Definition of Done**: Acceptance criteria pada Bab 08 tercentang semua & lolos QA (Bab 40).

---

## 10. User Flow

**10.1 Global User Flow**: ${interview.q4_userFlow}

**10.2 Authentication Flow**: Registrasi/Login via ${authLabel}.

**10.3 Onboarding Flow**: ${NOT_DETERMINED}

**10.4 Project Creation Flow**: ${NOT_DETERMINED}

**10.5 Interview Flow**, **10.6 AI Generation Flow**, **10.7 PRD Review Flow**, **10.8 ERD Flow**, **10.9 SQL Generation Flow**, **10.10 Sprint Generation Flow**: ${notAGeneratorProduct}

**10.11 Export Flow**: ${NOT_DETERMINED}

**10.12 Save / Resume Flow**: ${NOT_DETERMINED}

**10.13 Versioning Flow**, **10.14 Collaboration Flow**: ${rolesReal.length > 0 ? NOT_DETERMINED : notRelevant('tidak ada peran kolaborasi tim tambahan untuk produk ini.')}

**10.15 Error / Recovery Flow**: Kesalahan ditampilkan jelas ke pengguna tanpa mengubah data tersimpan.

**10.16 Mermaid User Flow Diagrams**: Lihat diagram arsitektur pada Bab 21.

---

## 11. UX / UI Requirements

**11.1 UX Principles** & **11.2 UI Principles**: ${NOT_DETERMINED}

**11.3 Screen Inventory**: Lihat sitemap pada Bab 05.

**11.4 Page Specifications**: ${NOT_DETERMINED}

**11.5 Wireframes**, **11.6 Design System**, **11.7 Design Tokens**, **11.8 Component Library**: ${NOT_DETERMINED}

**11.9 Responsive Rules**: Responsive by default (Tailwind CSS) untuk target platform ${interview.q13_targetPlatform}.

**11.10 Accessibility / WCAG**, **11.11 Motion & Interaction**: ${NOT_DETERMINED}

---

## 12. AI Product Requirements

${usesAi
  ? `**12.1 AI Role in Product**: ${interview.q14_integrationDetails || 'Digunakan untuk penalaran dan enrich data produk.'}\n\n**12.2–12.29**: ${NOT_DETERMINED}`
  : notRelevant('AI tidak dipilih sebagai kebutuhan integrasi produk ini (lihat Bab 23).')}

---

## 13. PRD Generation Engine
${notAGeneratorProduct}

---

## 14. ERD & Data Modeling Engine
${notAGeneratorProduct}

---

## 15. SQL Schema Generator
${notAGeneratorProduct}

---

## 16. Sprint & Task Generation
${notAGeneratorProduct}

---

## 17. Project Management
${NOT_DETERMINED}

---

## 18. Collaboration

${rolesReal.length > 0
  ? `**18.1 Members**: ${rolesReal.join(', ')}\n\n**18.2 Roles**: ${rolesReal.join(', ')}\n\n**18.3–18.10**: ${NOT_DETERMINED}`
  : notRelevant('produk ini dijalankan oleh single owner tanpa peran tim tambahan (lihat Bab 06.2).')}

---

## 19. Authentication & Authorization

**19.1 Authentication Strategy**: ${authLabel}

**19.2 Registration**, **19.3 Login**, **19.4 Logout**: Ditangani standar oleh ${authLabel}.

**19.5 Session Management**: Sesi divalidasi di setiap request melalui ${backend}.

**19.6 Password Reset**, **19.7 Email Verification**, **19.8 Multi-Factor Authentication**: ${NOT_DETERMINED}

**19.9 Role-Based Access Control**: ${rolesReal.length > 0 ? rolesReal.join(', ') : 'Single-role — tanpa RBAC bertingkat.'}

**19.10 Permission Matrix**: ${rolesReal.length > 0 ? NOT_DETERMINED : 'Tidak berlaku — hanya satu peran pengguna.'}

**19.11 Workspace-Level Authorization**, **19.12 Project-Level Authorization**: ${rolesReal.length > 0 ? NOT_DETERMINED : notRelevant('tidak ada struktur workspace/tim untuk produk ini.')}

**19.13 Account Deactivation**, **19.14 Account Deletion**: ${NOT_DETERMINED}

---

## 20. Data Architecture

**20.1 Overview**: ${interview.q8_entities.length} entitas utama — ${interview.q8_entities.map(e => e.name).join(', ')}.

**20.2 Domain Model** & **20.3 Entity Definitions**:
${interview.q8_entities.map(e => `- **${e.name}**: ${e.fields.map(f => f.name + (f.isPrimaryKey ? ' [PK]' : '')).join(', ')}`).join('\n')}

**20.4 Database Schema**: Lihat tab SQL Schema. **20.5 ERD**: Lihat tab ERD.

**20.6 Relationships**: ${inferredRelations.length > 0 ? inferredRelations.map(r => `${r.from} → ${r.to} (via ${r.field})`).join(', ') : 'Tidak ada relasi foreign-key eksplisit terdeteksi.'}

**20.7 Constraints** & **20.9 Data Validation**: ${interview.q10_dataRules}

**20.8 Indexing Strategy**: Index otomatis pada primary key dan setiap foreign key (\`_id\`).

**20.10 Data Lifecycle**, **20.11 Soft Delete**: ${interview.q10_dataRules}

**20.12 Versioning**: ${NOT_DETERMINED}

**20.13 Audit Trail**: ${complianceReal.includes('Audit trail wajib') ? 'Wajib — setiap perubahan data penting dicatat.' : NOT_DETERMINED}

**20.14 Backup Strategy**, **20.15 Data Recovery**, **20.16 Data Retention**: ${NOT_DETERMINED}

---

## 21. System Architecture

**21.1 Architecture Overview**: ${prodType} menggunakan ${frontend} dengan backend ${backend} dan database ${database}.

**21.2 Architecture Principles**: ${NOT_DETERMINED}

**21.3 Logical Architecture** & **21.15 Architecture Diagrams**:
\`\`\`mermaid
${mermaidArchitecture}
\`\`\`

**21.4 Physical Architecture**: Dihosting di ${deployment}.

**21.5 Application Architecture**: Gaya API ${apiArchLabel}.

**21.6 Frontend Architecture**: ${frontend} dengan Tailwind CSS.

**21.7 Backend Architecture**: ${backend}.

**21.8 Database Architecture**: ${database}, skema ternormalisasi (lihat Bab 20).

**21.9 Storage Architecture**: ${storageLabel}.

**21.10 Cache Architecture**, **21.11 Queue / Worker Architecture**: ${NOT_DETERMINED}

**21.12 AI Architecture**: ${usesAi ? (interview.q14_integrationDetails || NOT_DETERMINED) : notRelevant('AI tidak digunakan pada produk ini.')}

**21.13 Integration Architecture**: ${integrations.length > 0 ? integrations.join(', ') : NOT_DETERMINED}

**21.14 Deployment Architecture**: ${deployment}, dengan integrasi CI/CD otomatis.

---

## 22. API Specification

**22.1 API Architecture**: ${apiArchLabel}

**22.2 API Standards**, **22.3 Endpoint Naming**: ${NOT_DETERMINED}

**22.4 Authentication**: ${authLabel}

**22.5 Authorization**: ${rolesReal.length > 0 ? rolesReal.join(', ') : 'Seluruh pengguna terautentikasi'}

**22.6 Request Format**, **22.7 Response Format**, **22.8 Error Format**: ${NOT_DETERMINED}

**22.9 HTTP Status Codes**: Konvensi standar REST (2xx sukses, 4xx kesalahan klien, 5xx kesalahan server).

**22.10 Validation**: ${interview.q10_dataRules}

**22.11 Pagination**, **22.12 Filtering**, **22.13 Sorting**, **22.14 Search**, **22.15 Rate Limiting**, **22.16 API Versioning**, **22.17 Webhooks**, **22.18 API Endpoint Catalog**: ${NOT_DETERMINED}

---

## 23. External Integrations

**23.1 Integration Strategy**: ${integrations.length > 0 ? integrations.join(', ') : 'Tidak ada integrasi pihak ketiga yang dipilih.'}${interview.q14_integrationDetails ? ` — ${interview.q14_integrationDetails}` : ''}

**23.2 AI Providers**: ${usesAi ? 'Digunakan sesuai konfigurasi provider AI aplikasi.' : notRelevant('AI tidak digunakan pada produk ini.')}

**23.3 Authentication Providers**: ${authLabel}

**23.4 Payment Providers**: ${interview.q14_integrations.includes('Payment Gateway (Stripe/Midtrans)') ? 'Stripe/Midtrans' : notRelevant('payment gateway tidak dipilih sebagai kebutuhan integrasi.')}

**23.5 Storage Providers**: ${storageLabel}

**23.6 Analytics** & **23.7 Error Monitoring**: ${observability.length > 0 ? observability.join(', ') : NOT_DETERMINED}

**23.8 Communication Services**: ${interview.q14_integrations.includes('Email Service (Resend/SendGrid)') ? 'Resend/SendGrid' : NOT_DETERMINED}

**23.9 Version Control / Git Integration**: ${NOT_DETERMINED}

**23.10 Integration Failure Handling**, **23.11 Provider Fallback**: Fallback graceful degradation & retry queue saat layanan eksternal mengalami latensi.

**23.12 API Credential Management**: Disimpan sebagai environment variable, tidak pernah di sisi client.

---

## 24. Security Requirements

**24.1 Security Principles**: ${interview.q15_specialRequirements.join(', ') || 'Keamanan data standar'}

**24.2 Threat Model**: ${NOT_DETERMINED}

**24.3 Authentication Security**: ${authLabel}

**24.4 Authorization Security**: ${rolesReal.length > 0 ? rolesReal.join(', ') : 'Session-based, single-role'}

**24.5 Session Security**: Sesi divalidasi di ${backend} pada setiap request.

**24.6 Data Encryption**: Enkripsi data in-transit (TLS) dan at-rest.

**24.7 Secrets Management**: Environment variable, tidak pernah di-commit ke kode.

**24.8 Input Sanitization**, **24.9 XSS Protection**, **24.10 CSRF Protection**, **24.11 SQL Injection Protection**: Praktik standar (parameterized query & output escaping) diterapkan di layer ${backend}.

**24.12 File Upload Security**: ${storageLabel !== 'none' ? `Divalidasi sebelum disimpan ke ${storageLabel}.` : notRelevant('produk ini tidak menggunakan file storage.')}

**24.13 API Security**: ${apiArchLabel}, tervalidasi sesi di setiap endpoint.

**24.14 Rate Limiting**: ${NOT_DETERMINED}

**24.15 AI Prompt Injection Protection**: ${usesAi ? NOT_DETERMINED : notRelevant('AI tidak digunakan pada produk ini.')}

**24.16 Audit Logging**: ${complianceReal.includes('Audit trail wajib') ? 'Wajib.' : NOT_DETERMINED}

**24.17 Security Monitoring**: ${observability.length > 0 ? observability.join(', ') : NOT_DETERMINED}

**24.18 Dependency Security**, **24.19 Backup Security**, **24.20 Incident Response**: ${NOT_DETERMINED}

---

## 25. Privacy & Data Governance

**25.1 Data Classification**: ${NOT_DETERMINED}

**25.2 Personal Data**: Data akun pengguna (${interview.q2_targetUser.toLowerCase()}) dan entitas terkait — lihat Bab 20.

**25.3 Data Collection**, **25.4 Data Usage**, **25.5 Data Sharing**: ${NOT_DETERMINED}

**25.6 Data Retention**: Lihat Bab 20.16.

**25.7 Data Export**, **25.8 Data Deletion**: ${NOT_DETERMINED}

**25.9 User Consent**: ${NOT_DETERMINED}

**25.10 Privacy Policy Requirements**: ${NOT_DETERMINED}

**25.11 Regulatory Requirements**: ${complianceReal.length > 0 ? complianceReal.join(', ') : 'Tidak ada kebutuhan kepatuhan khusus yang dipilih.'}

---

## 26. Non-Functional Requirements

**26.1 Performance**: ${interview.q15_specialDetails || 'Responsif di bawah 1 detik untuk operasi umum.'}

**26.2 Scalability**: Ditargetkan untuk ${interview.q12_userEstimate || 'skala awal'}.

**26.3 Availability**, **26.4 Reliability**: ${NOT_DETERMINED}

**26.5 Maintainability**: Standar kode ${interview.q22_codeStandards.join(', ') || 'TypeScript Strict'}.

**26.6 Observability**: ${interview.q21_observability.join(', ') || NOT_DETERMINED}

**26.7 Security**: Lihat Bab 24.

**26.8 Accessibility**: ${NOT_DETERMINED}

**26.9 Compatibility**, **26.10 Browser Support**: ${NOT_DETERMINED}

**26.11 Mobile Responsiveness**: Responsive by default (Tailwind CSS).

**26.12 Internationalization**, **26.13 Localization**: ${NOT_DETERMINED}

**26.14 Offline / Local Mode**: Lihat Bab 27.

**26.15 Disaster Recovery**, **26.16 Backup**: ${NOT_DETERMINED}

**26.17 Resource Limits**: ${interview.q11_infraConstraints.join(', ') || NOT_DETERMINED}

---

## 27. Offline / Local Architecture

${offlineCapable
  ? `**27.1 Offline Scope**: Produk wajib dapat berjalan offline/lokal sesuai batasan infrastruktur yang dipilih.\n\n**27.2–27.13**: ${NOT_DETERMINED}`
  : notRelevant('produk ini tidak menyatakan kebutuhan untuk berjalan offline/lokal (lihat Bab 35).')}

---

## 28. Observability & Analytics

**28.1 Product Analytics**: ${interview.q21_observability.join(', ') || NOT_DETERMINED}

**28.2 Event Taxonomy**, **28.3 Conversion Events**, **28.4 Activation Events**, **28.5 Retention Events**: ${NOT_DETERMINED}

**28.6 AI Usage Metrics**, **28.7 AI Cost Metrics**: ${usesAi ? NOT_DETERMINED : notRelevant('AI tidak digunakan pada produk ini.')}

**28.8 Performance Monitoring**, **28.9 Error Monitoring**: ${observability.length > 0 ? observability.join(', ') : NOT_DETERMINED}

**28.10 Logs**, **28.11 Metrics**, **28.12 Traces**, **28.13 Alerting**, **28.14 Dashboard Requirements**: ${NOT_DETERMINED}

---

## 29. Experimentation
${NOT_DETERMINED}

---

## 30. Monetization & Subscription

**30.1 Pricing Tiers**: ${interview.q24_businessModel}${interview.q25_pricingNotes ? ` — ${interview.q25_pricingNotes}` : ''}

**30.2 Feature Limits**, **30.3 Usage Limits**: ${NOT_DETERMINED}

**30.4 AI Credit System**: ${usesAi ? NOT_DETERMINED : notRelevant('AI tidak digunakan pada produk ini.')}

**30.5 Free Tier**, **30.6 Paid Tier**, **30.7 Team Tier**, **30.8 Enterprise Tier**, **30.9 Trial**: ${['Gratis / Open Source', 'Internal / Tidak Dijual'].includes(interview.q24_businessModel) ? notRelevant(`model bisnis produk ini adalah "${interview.q24_businessModel}".`) : NOT_DETERMINED}

**30.10 Upgrade**, **30.11 Downgrade**, **30.12 Cancellation**, **30.13 Billing**, **30.14 Payment Failure**, **30.15 Entitlement Management**: ${['Gratis / Open Source', 'Internal / Tidak Dijual'].includes(interview.q24_businessModel) ? notRelevant(`model bisnis produk ini adalah "${interview.q24_businessModel}".`) : NOT_DETERMINED}

---

## 31. Notifications

**31.1 Notification Types** & **31.2–31.4 Channels**: ${interview.q27_notificationChannels.length > 0 && !interview.q27_notificationChannels.includes('Tidak perlu notifikasi') ? interview.q27_notificationChannels.join(', ') : notRelevant('tidak ada kanal notifikasi yang dipilih untuk produk ini.')}

**31.5 AI Generation Status**: ${usesAi ? NOT_DETERMINED : notRelevant('AI tidak digunakan pada produk ini.')}

**31.6 Export Completion**, **31.7 Collaboration Notifications**, **31.8 Notification Preferences**, **31.9 Notification Retry**: ${NOT_DETERMINED}

---

## 32. Export & Import
${NOT_DETERMINED}

---

## 33. Content & Knowledge Management

${usesAi
  ? `**33.1 Prompt Library**: ${interview.q14_integrationDetails || NOT_DETERMINED}\n\n**33.2–33.9**: ${NOT_DETERMINED}`
  : notRelevant('produk ini tidak menggunakan AI sebagai bagian dari fitur produk.')}

---

## 34. Admin & Operations

${rolesReal.includes('Admin')
  ? `**34.1 Admin Dashboard**: ${adminPersona}\n\n**34.2–34.12**: ${NOT_DETERMINED}`
  : notRelevant('tidak ada role Admin yang didefinisikan untuk produk ini.')}

---

## 35. Technical Constraints

**35.1 Technology Constraints**: ${frontend}, ${database}, ${backend}.

**35.2 Infrastructure Constraints**: ${interview.q11_infraConstraints.join(', ') || 'Tidak ada batasan khusus'} (${interview.q11_infraDetails || '-'})

**35.3 Browser Constraints**: ${NOT_DETERMINED}

**35.4 Dependency Constraints**: ${NOT_DETERMINED}

**35.5 Licensing Constraints**, **35.6 Open Source Requirements**: ${interview.q11_infraConstraints.includes('Open source only') ? 'Wajib menggunakan komponen open-source.' : NOT_DETERMINED}

**35.7 Offline Constraints**: Lihat Bab 27.

**35.8 AI Provider Constraints**: ${usesAi ? NOT_DETERMINED : notRelevant('AI tidak digunakan pada produk ini.')}

**35.9 Budget Constraints**: ${NOT_DETERMINED}

---

## 36. Assumptions

- Pengguna memiliki koneksi internet yang stabil${offlineCapable ? ', kecuali pada mode offline/lokal yang didukung' : ''}.
- Estimasi jumlah pengguna sesuai proyeksi: ${interview.q12_userEstimate || 'belum ditentukan'}.
- Tim pengembang memiliki kapasitas untuk menyelesaikan V1 dalam ${interview.q16_timeline || 'target waktu yang ditentukan'}.
- ${interview.q16_timelineNotes || NOT_DETERMINED}

---

## 37. Dependencies

**37.1 Product Dependencies**: ${interview.q3_coreFeature}

**37.2 Technical Dependencies**: ${frontend}, ${backend}, ${database}.

**37.3 External Service Dependencies**: ${integrations.length > 0 ? integrations.join(', ') : 'Tidak ada'}

**37.4 Team Dependencies**: ${NOT_DETERMINED}

**37.5 Data Dependencies**: ${interview.q8_entities.map(e => e.name).join(', ')}

**37.6 Release Dependencies**: ${NOT_DETERMINED}

**37.7 Dependency Risk**: Lihat Bab 38.

---

## 38. Risks

**38.9 Risk Matrix**
| Risiko | Kategori | Dampak | Kemungkinan | Mitigasi |
| :--- | :--- | :--- | :--- | :--- |
${risks.map(r => `| ${r.risk} | ${r.category} | ${r.severity} | ${r.likelihood} | ${r.mitigation} |`).join('\n')}

**38.10 Mitigation Plan**: Lihat kolom Mitigasi di atas. **38.11 Contingency Plan**: ${NOT_DETERMINED}

---

## 39. Quality Requirements

**39.1 Quality Standards** & **39.2 Code Quality**: ${interview.q22_codeStandards.join(', ') || 'Belum ditentukan'}

**39.3 UX Quality**, **39.4 AI Output Quality**, **39.5 Data Quality**, **39.6 Documentation Quality**: ${NOT_DETERMINED}

**39.7 Definition of Done**: Lihat Bab 09.9. **39.8 Release Quality Gate**: Semua task P0 pada Bab 48/49 selesai.

---

## 40. QA & Testing Strategy

**40.1 Testing Strategy**: ${interview.q22_codeStandards.includes('Vitest / Jest') ? 'Unit & integration testing dengan Vitest/Jest.' : NOT_DETERMINED}

**40.2 Unit Testing**, **40.3 Integration Testing**: ${interview.q22_codeStandards.includes('Vitest / Jest') ? 'Vitest / Jest' : NOT_DETERMINED}

**40.4 API Testing**, **40.5 Database Testing**: ${NOT_DETERMINED}

**40.6 AI Evaluation Testing**: ${usesAi ? NOT_DETERMINED : notRelevant('AI tidak digunakan pada produk ini.')}

**40.7 UI Testing**, **40.8 Accessibility Testing**: ${NOT_DETERMINED}

**40.9 Security Testing**: Lihat Bab 24.

**40.10 Performance Testing**, **40.11 End-to-End Testing**, **40.12 Regression Testing**, **40.13 Cross-Browser Testing**: ${NOT_DETERMINED}

**40.14 Offline Testing**: ${offlineCapable ? NOT_DETERMINED : notRelevant('produk ini tidak memerlukan mode offline.')}

**40.15 Failure Scenario Testing**: Lihat Exception Flow tiap fitur di Bab 08.

**40.16 Test Data Strategy**, **40.17 Acceptance Testing**: ${NOT_DETERMINED}

---

## 41. Acceptance Criteria

**41.1 Global Acceptance Criteria**: Seluruh fitur pada Bab 08 memenuhi acceptance criteria masing-masing.

**41.2 Feature Acceptance Criteria**: Lihat Bab 08.5 per fitur.

**41.3 API Acceptance Criteria**, **41.4 Database Acceptance Criteria**, **41.5 AI Acceptance Criteria**, **41.6 UX Acceptance Criteria**: ${NOT_DETERMINED}

**41.7 Security Acceptance Criteria**: Lihat Bab 24.

**41.8 Performance Acceptance Criteria**: Lihat Bab 26.1.

**41.9 Release Acceptance Criteria**: Semua task P0 (Bab 48/49) selesai sebelum rilis ${interview.q16_timeline || 'V1'}.

---

## 42. Requirements Traceability

**42.1 Requirement IDs**: \`FR-08.x\` per fitur pada Bab 08.

**42.2 Requirement → Feature Mapping**: 1:1 — setiap requirement Bab 08 adalah satu node pada tab "Roadmap Fitur".

**42.3 Requirement → User Story Mapping**: Lihat Bab 09.4.

**42.4 Requirement → API Mapping**: Lihat Bab 22.

**42.5 Requirement → Database Mapping**: Lihat Bab 20.

**42.6 Requirement → Test Case Mapping**: Lihat Bab 40.

**42.7 Requirement → Sprint Mapping**: Lihat Bab 48.

---

## 43. Development Architecture

**43.1 Repository Structure**, **43.2 Application Folder Structure**, **43.3 Module Boundaries**, **43.4 Component Boundaries**, **43.5 Domain Boundaries**: ${NOT_DETERMINED}

**43.6 Coding Standards**: ${interview.q22_codeStandards.join(', ') || 'Belum ditentukan'}

**43.7 Naming Conventions**: Entitas & field mengikuti \`snake_case\`; relasi FK memakai akhiran \`_id\`.

**43.8 Error Handling Standard**: Kegagalan API mengembalikan pesan error yang jelas tanpa mengubah data.

**43.9 Logging Standard**: ${interview.q21_observability.join(', ') || NOT_DETERMINED}

**43.10 Environment Variables**: Kredensial & konfigurasi provider disimpan sebagai environment variable.

**43.11 Configuration Management**, **43.12 Dependency Management**, **43.13 Git Strategy**, **43.14 Branching Strategy**, **43.15 Pull Request Rules**, **43.16 Code Review Rules**: ${NOT_DETERMINED}

---

## 44. CI/CD & DevOps

**44.1 Development Environment**: Lokal, dev server ${frontend}.

**44.2 Staging Environment**: ${NOT_DETERMINED}

**44.3 Production Environment**: ${deployment}.

**44.4 CI Pipeline**: ${interview.q22_codeStandards.length > 0 ? `Menjalankan ${interview.q22_codeStandards.join(', ')} otomatis sebelum deploy.` : NOT_DETERMINED}

**44.5 CD Pipeline**: Deploy otomatis ke ${deployment}.

**44.6 Automated Checks**: ${interview.q22_codeStandards.join(', ') || NOT_DETERMINED}

**44.7 Build Strategy**, **44.8 Migration Strategy**: ${NOT_DETERMINED}

**44.9 Deployment Strategy**: ${deployment}.

**44.10 Rollback Strategy**, **44.11 Feature Flag Deployment**, **44.12 Release Management**: ${NOT_DETERMINED}

---

## 45. Infrastructure

**45.1 Infrastructure Overview**: ${deployment}, database ${database}, storage ${storageLabel}.

**45.2 Compute**: ${deployment}.

**45.3 Database**: ${database}.

**45.4 Storage**: ${storageLabel}.

**45.5 Cache**, **45.6 Queue**: ${NOT_DETERMINED}

**45.7 CDN**, **45.8 DNS**, **45.9 SSL / TLS**: Ditangani otomatis oleh platform deployment (${deployment}).

**45.10 Monitoring**: ${interview.q21_observability.join(', ') || NOT_DETERMINED}

**45.11 Backup**, **45.12 Disaster Recovery**, **45.13 Capacity Planning**: ${NOT_DETERMINED}

---

## 46. Release Plan

**46.1 Release Strategy**: Rilis V1 dalam ${interview.q16_timeline || 'target waktu yang ditentukan'}.

**46.2 MVP Release**: ${interview.q3_coreFeature}

**46.3 Beta**: ${NOT_DETERMINED}

**46.4 Production**: ${deployment}.

**46.5 Rollout Strategy**, **46.6 Migration**: ${NOT_DETERMINED}

**46.7 Launch Checklist**: Semua task P0 pada Bab 48/49 selesai.

**46.8 Post-Launch Monitoring**: ${interview.q21_observability.join(', ') || NOT_DETERMINED}

**46.9 Rollback Criteria**: ${NOT_DETERMINED}

---

## 47. Roadmap

**47.1 Product Roadmap**: MVP → V1 → V1.1 → V2 (lihat Bab 06).

**47.2 MVP**: ${interview.q3_coreFeature}

**47.3 V1**: ${[...phase1Names, ...phase2Names].join(', ') || NOT_DETERMINED}

**47.4 V1.1**: ${phase3Names.join(', ') || NOT_DETERMINED}

**47.5 V2**: ${interview.q30_postMvpPlan || NOT_DETERMINED}

**47.6 Long-Term Vision**: ${interview.q30_postMvpPlan || NOT_DETERMINED}

**47.7 Technical Roadmap**, **47.8 AI Roadmap**, **47.9 Infrastructure Roadmap**: ${NOT_DETERMINED}

---

## 48. Sprint Planning

**48.1 Sprint Strategy**: 3 sprint — lihat tab "Task & Sprint".

**48.2–48.6 Sprint Breakdown**:
${tasks.map(t => `- [${t.priority}] **${t.sprintName}** — ${t.title} (${t.category})`).join('\n')}

**48.7 Sprint Backlog**: Lihat tab "Task & Sprint" pada hasil PRD.

**48.8 Task Priority**: P0=${tasks.filter(t => t.priority === 'P0').length}, P1=${tasks.filter(t => t.priority === 'P1').length}, P2=${tasks.filter(t => t.priority === 'P2').length}.

**48.9 Task Dependencies**: Lihat Bab 08. **48.10 Task Estimation**: ${NOT_DETERMINED}

**48.11 Sprint Acceptance**, **48.12 Sprint Exit Criteria**: Seluruh task P0 pada sprint terkait selesai.

---

## 49. Engineering Task Breakdown

${['Setup', 'Database', 'Auth', 'Frontend', 'Core', 'Backend', 'API', 'UX', 'Integration', 'DevOps', 'QA', 'Release']
  .map(cat => ({ cat, items: tasks.filter(t => t.category === cat) }))
  .filter(g => g.items.length > 0)
  .map(g => `**${g.cat}**: ${g.items.map(t => t.title).join('; ')}`)
  .join('\n\n')}

---

## 50. Support & Maintenance

**50.1 Support Model**: ${interview.q29_supportModel}

**50.2 Bug Classification**: Mengikuti prioritas P0/P1/P2 (lihat Bab 48).

**50.3 Incident Severity**, **50.4 SLA**: ${NOT_DETERMINED}

**50.5 Monitoring**: ${interview.q21_observability.join(', ') || NOT_DETERMINED}

**50.6 Maintenance Windows**, **50.7 Dependency Updates**, **50.8 Security Patching**, **50.9 Backup Verification**: ${NOT_DETERMINED}

---

## 51. Documentation

**51.1 Product Documentation**: Dokumen PRD ini.

**51.2 User Documentation**: ${NOT_DETERMINED}

**51.3 Developer Documentation**: Dokumen PRD, ERD, SQL Schema, dan Task List (lihat tab masing-masing).

**51.4 API Documentation**: Lihat Bab 22.

**51.5 Architecture Documentation**: Lihat Bab 21.

**51.6 Deployment Documentation**, **51.7 Security Documentation**, **51.8 AI Documentation**, **51.9 Runbook**, **51.10 Troubleshooting Guide**: ${NOT_DETERMINED}

---

## 52. Metrics & KPIs

**52.1 North Star Metric**: Lihat Bab 01.13.

**52.2 Acquisition Metrics**, **52.3 Activation Metrics**, **52.4 Engagement Metrics**, **52.5 Retention Metrics**, **52.6 Conversion Metrics**: ${NOT_DETERMINED}

**52.7 Revenue Metrics**: ${['Gratis / Open Source', 'Internal / Tidak Dijual'].includes(interview.q24_businessModel) ? notRelevant(`model bisnis produk ini adalah "${interview.q24_businessModel}".`) : NOT_DETERMINED}

**52.8 AI Metrics**: ${usesAi ? NOT_DETERMINED : notRelevant('AI tidak digunakan pada produk ini.')}

**52.9 Product Quality Metrics**, **52.10 Technical Metrics**, **52.11 Support Metrics**: ${NOT_DETERMINED}

---

## 53. Post-Launch
${NOT_DETERMINED}

---

## 54. Appendices

**54.1 Glossary**: ${interview.q8_entities.map(e => e.name).join(', ')}

**54.2 Acronyms**: PRD = Product Requirements Document; ERD = Entity Relationship Diagram; SQL = Structured Query Language; MVP = Minimum Viable Product; NFR = Non-Functional Requirement; FR = Functional Requirement.

**54.3 Terminology**, **54.4 Requirement ID Convention**: Lihat Bab 08.2.

**54.5 Priority Convention**: P0 = wajib rilis, P1 = penting, P2 = nice-to-have.

**54.6 Error Code Convention**: ${NOT_DETERMINED}

**54.7 Naming Convention**: Lihat Bab 43.7.

**54.8 Mermaid Diagrams**: Lihat Bab 21.3 (Arsitektur) dan tab ERD (Entity Relationship).

**54.9 ERD**: Lihat tab ERD pada hasil PRD.

**54.10 API Examples**, **54.11 JSON Schemas**, **54.13 Prompt Schemas**: ${NOT_DETERMINED}

**54.12 SQL Schema**: Lihat tab SQL Schema pada hasil PRD.

**54.14 Sample Generated PRD**: Dokumen ini sendiri.

**54.15 Sample Sprint Plan**: Lihat tab Task & Sprint pada hasil PRD.

---
*Dokumen ini dibuat otomatis oleh RotaLogic PRD Generator, mengikuti Master PRD Structure RotaLogic — siap untuk Sprint Planning.*
`;

  return {
    productName,
    productType: prodType,
    frontend,
    database,
    backend,
    deployment,
    targetUser: interview.q2_targetUser,
    userEstimate: interview.q12_userEstimate,
    targetRelease: interview.q16_timeline,
    description: prodType + ' untuk ' + interview.q2_targetUser.toLowerCase(),
    mainGoal: interview.q1_problem,
    prdMarkdown,
    sqlSchema,
    mermaidErd,
    mermaidArchitecture,
    entities: interview.q8_entities,
    tasks,
    featureTree,
    architectureSummary: {
      overview: `${prodType} menggunakan ${frontend} dengan backend ${backend} dan database ${database}.`,
      frontendLayer: `${frontend} dengan Tailwind CSS untuk responsive rendering & modular UI.`,
      backendLayer: `${backend} dengan gaya arsitektur ${apiArchLabel}.`,
      databaseLayer: `${database} dengan skema ternormalisasi dan relasi foreign-key${inferredRelations.length > 0 ? ` (${inferredRelations.length} relasi terdeteksi dari model data)` : ''}.`,
      deploymentLayer: `Dihosting di ${deployment} dengan integrasi CI/CD otomatis.`,
      securityLayer: `Autentikasi via ${authLabel}. Semua akses data melalui ${backend} — client tidak pernah terhubung langsung ke ${database}. ${interview.q15_specialRequirements.join(', ') || 'Enkripsi in-transit (TLS) dan at-rest'}.`,
      dataFlow: `${frontend} → ${apiArchLabel} (${backend}) → ${database}, dengan sesi diverifikasi di setiap request via ${authLabel}${observability.length > 0 ? `. Metrik & error dilacak lewat ${observability.join(', ')}` : ''}.`,
      scalingNotes: `Ditargetkan untuk ${interview.q12_userEstimate || 'skala awal'}. Batasan infrastruktur: ${interview.q11_infraConstraints.join(', ') || 'belum ditentukan'}.`,
      services: [
        ...integrations,
        `Auth: ${authLabel}`,
        `Storage: ${storageLabel}`,
        ...observability
      ]
    },
    risks
  };
}
