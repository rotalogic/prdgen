import { GeneratedPRDResult, InterviewData, TaskItem, RiskItem } from '../types';
import { PRODUCT_TYPES, FRONTEND_OPTIONS, DATABASE_OPTIONS } from './constants';

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
  // Default relationship lines
  mermaidLines.push(`    users ||--o{ projects : "creates"`);
  mermaidLines.push(`    projects ||--o{ tasks : "contains"`);
  const mermaidErd = mermaidLines.join('\n');

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

  // Full PRD Markdown
  const prdMarkdown = `# Product Requirements Document (PRD)
**Proyek**: ${prodType}
**Versi**: 1.0.0 (MVP)
**Status**: Ready for Implementation
**Target Rilis**: ${interview.q16_timeline || '3 bulan'}
**Disusun oleh**: RotaLogic PRD Generator

---

## 1. Pendahuluan & Latar Belakang
### 1.1 Masalah (Problem Statement)
${interview.q1_problem}

### 1.2 Visi & Tujuan Produk (Product Vision)
Membangun solusi perangkat lunak berbasis **${prodType}** yang menyelesaikan kendala di atas dengan memberikan antarmuka yang cepat, terstruktur, dan siap dikembangkan.

### 1.3 Momen "Aha" (Core Value Metric)
> "${interview.q5_ahaMoment}"

---

## 2. Target Pengguna & Karakteristik
- **Segmen Utama**: ${interview.q2_targetUser}
- **Estimasi Volume Pengguna (Tahun 1)**: ${interview.q12_userEstimate}
- **Platform Sasaran**: ${interview.q13_targetPlatform}
- **Karakteristik Kebutuhan**:
  - Membutuhkan kemudahan akses tanpa konfigurasi manual yang rumit.
  - Mengharapkan data tersimpan aman dan terintegrasi secara reliabel.

---

## 3. Fitur Utama & Ruang Lingkup
### 3.1 Fitur Wajib (In-Scope V1)
1. **Fungsi Inti**: ${interview.q3_coreFeature}
2. **Alur Pengguna**:
   ${interview.q4_userFlow}
3. **Manajemen Data**:
   - Struktur entitas terstandar: ${interview.q8_entities.map(e => e.name).join(', ')}.
   - Validasi data: ${interview.q10_dataRules}

### 3.2 Di Luar Ruang Lingkup (Out-of-Scope V1)
Fitur berikut sengaja ditunda agar target rilis pertama tercapai:
- ${interview.q6_outOfScope}

---

## 4. Spesifikasi Teknis & Arsitektur
| Komponen | Pilihan Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Jenis Produk** | ${prodType} | Model aplikasi utama |
| **Frontend** | ${frontend} | User Interface & Komponen Reaktif |
| **Backend Engine** | ${backend} | API & Business Logic Layer |
| **Database** | ${database} | Penyimpanan Data Utama |
| **Autentikasi** | ${interview.q18_auth || 'NextAuth / Auth.js'} | Manajemen Identitas & Sesi |
| **API Architecture** | ${interview.q19_apiArch || 'Next.js Server Actions'} | Komunikasi Data Client-Server |
| **File Storage** | ${interview.q20_storage || 'S3 / Cloudflare R2'} | Penyimpanan Media & Aset |
| **Deployment Target** | ${deployment} | Hosting & Cloud Runtime |
| **Observability** | ${interview.q21_observability.join(', ') || 'Sentry, PostHog'} | Log & Error Analytics |
| **Quality Standards** | ${interview.q22_codeStandards.join(', ') || 'TypeScript Strict'} | Standar Koding Developer |

---

## 5. Model Data & Relasi
Entitas yang dibutuhkan:
${interview.q8_entities.map(e => `- **${e.name}**: ${e.fields.map(f => f.name + (f.isPrimaryKey ? ' [PK]' : '')).join(', ')}`).join('\n')}

**Aturan Integritas Data**:
${interview.q10_dataRules}

---

## 6. Kebutuhan Non-Fungsional (NFR)
- **Performa & Keamanan**: ${interview.q15_specialRequirements.join(', ') || 'Keamanan data tinggi'}
- **Detail Kebutuhan**: ${interview.q15_specialDetails || 'Responsif di bawah 1 detik, enkripsi data in-transit dan at-rest.'}
- **Infrastruktur**: ${interview.q11_infraConstraints.join(', ')} (${interview.q11_infraDetails})

---

## 7. Catatan Developer & Instruksi Khusus
${interview.q23_technicalNotes || 'Gunakan standard modular TypeScript dengan pemisahan concern yang jelas antara UI, Server Actions, dan Database layer.'}

---
*Dokumen ini dibuat otomatis oleh RotaLogic PRD Generator — Siap untuk Sprint Planning.*
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
    tasks,
    architectureSummary: {
      overview: `${prodType} menggunakan ${frontend} dengan backend ${backend} dan database ${database}.`,
      frontendLayer: `${frontend} dengan Tailwind CSS untuk responsive rendering & modular UI.`,
      backendLayer: `${backend} dengan gaya arsitektur ${interview.q19_apiArch || 'Server Actions'}.`,
      databaseLayer: `${database} dengan skema ternormalisasi dan relasi foreign-key.`,
      deploymentLayer: `Dihosting di ${deployment} dengan integrasi CI/CD otomatis.`,
      services: [
        ...(interview.q14_integrations || []),
        interview.q18_auth ? `Auth: ${interview.q18_auth}` : 'Auth: NextAuth',
        interview.q20_storage ? `Storage: ${interview.q20_storage}` : 'Storage: Cloud R2',
        ...(interview.q21_observability || [])
      ]
    },
    risks
  };
}
