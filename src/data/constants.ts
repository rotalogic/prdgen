import { StackOption, InterviewData, EntitySchema } from '../types';

export const PRODUCT_TYPES: StackOption[] = [
  {
    id: 'web',
    title: 'Website / Web App',
    desc: 'Aplikasi web modern untuk berbagai kebutuhan.',
    iconName: 'globe'
  },
  {
    id: 'mobile',
    title: 'Mobile App',
    desc: 'Aplikasi mobile untuk iOS dan Android.',
    iconName: 'smartphone'
  },
  {
    id: 'desktop',
    title: 'Desktop App',
    desc: 'Aplikasi desktop untuk Windows, macOS, atau Linux.',
    iconName: 'monitor'
  },
  {
    id: 'ai',
    title: 'AI / Chatbot App',
    desc: 'Aplikasi berbasis AI dan conversational.',
    iconName: 'bot'
  },
  {
    id: 'saas',
    title: 'SaaS Platform',
    desc: 'Platform multi-tenant dengan model berlangganan.',
    iconName: 'box'
  },
  {
    id: 'landing',
    title: 'Landing Page saja',
    desc: 'Halaman promosi sederhana tanpa fitur kompleks.',
    iconName: 'file-text'
  },
  {
    id: 'custom',
    title: 'Custom / Lainnya',
    desc: 'Jenis lainnya sesuai kebutuhan spesifik kamu.',
    iconName: 'wrench'
  }
];

// Recommended frontend + database per product type — applied when the user
// picks a product type in Step 1, so Steps 2/3 aren't stuck on one static
// default (Next.js + PostgreSQL) regardless of what was actually chosen.
export const PRODUCT_TYPE_RECOMMENDATIONS: Record<string, { frontendId: string; databaseId: string }> = {
  web: { frontendId: 'nextjs', databaseId: 'postgresql' },
  mobile: { frontendId: 'react_native', databaseId: 'firestore' },
  desktop: { frontendId: 'electron', databaseId: 'sqlite' },
  ai: { frontendId: 'nextjs', databaseId: 'supabase' },
  saas: { frontendId: 'nextjs', databaseId: 'postgresql' },
  landing: { frontendId: 'html_tailwind', databaseId: 'sqlite' },
  custom: { frontendId: 'nextjs', databaseId: 'postgresql' },
};

export const FRONTEND_OPTIONS: StackOption[] = [
  {
    id: 'nextjs',
    title: 'Next.js (React)',
    badge: 'Rekomendasi',
    desc: 'Framework modern, full-stack, performa tinggi, dan paling fleksibel untuk berbagai jenis produk.',
    iconName: 'nextjs'
  },
  {
    id: 'react_vite',
    title: 'React (Vite)',
    desc: 'Ringan, cepat, dan fleksibel untuk single-page application.',
    iconName: 'react'
  },
  {
    id: 'vue_nuxt',
    title: 'Vue / Nuxt',
    desc: 'Alternatif modern dengan ekosistem yang kuat dan mudah dikembangkan.',
    iconName: 'vue'
  },
  {
    id: 'html_tailwind',
    title: 'HTML + Tailwind (statis)',
    desc: 'Cocok untuk website sederhana dengan performa maksimal.',
    iconName: 'tailwind'
  },
  {
    id: 'react_native',
    title: 'React Native (mobile)',
    desc: 'Satu basis kode untuk iOS dan Android dengan performa native.',
    iconName: 'mobile'
  },
  {
    id: 'electron',
    title: 'Electron (desktop)',
    desc: 'Bangun aplikasi desktop untuk Windows, macOS, dan Linux dengan teknologi web.',
    iconName: 'electron'
  }
];

export const DATABASE_OPTIONS: StackOption[] = [
  {
    id: 'postgresql',
    title: 'PostgreSQL',
    badge: 'Rekomendasi',
    tags: ['UUID', 'JSONB', 'TIMESTAMPTZ'],
    category: 'Relational (SQL)',
    desc: 'Relasional, kuat, dan fleksibel untuk skala besar.',
    iconName: 'database'
  },
  {
    id: 'mongodb',
    title: 'MongoDB',
    tags: ['NOSQL', 'DOCUMENT'],
    category: 'NoSQL / Document',
    desc: 'Fleksibel, cocok untuk data tidak terstruktur.',
    iconName: 'leaf'
  },
  {
    id: 'mysql',
    title: 'MySQL',
    tags: ['INT', 'DATETIME'],
    category: 'Relational (SQL)',
    desc: 'Relasional populer untuk berbagai jenis aplikasi.',
    iconName: 'database'
  },
  {
    id: 'sqlite',
    title: 'SQLite',
    tags: ['INTEGER PK', 'TEXT'],
    category: 'Relational (SQL)',
    desc: 'Ringan, cocok untuk proyek sederhana atau lokal.',
    iconName: 'feather'
  },
  {
    id: 'firestore',
    title: 'Firebase (Firestore)',
    tags: ['NOSQL', 'MOBILE'],
    category: 'NoSQL / Document',
    desc: 'Cocok untuk aplikasi mobile dan real-time.',
    iconName: 'flame'
  },
  {
    id: 'supabase',
    title: 'Supabase',
    tags: ['POSTGRESQL', 'AUTH', 'REALTIME'],
    category: 'Serverless / BaaS',
    desc: 'Backend-as-a-service open source dengan fitur lengkap (auth, storage, realtime).',
    iconName: 'zap'
  },
  {
    id: 'mssql',
    title: 'Microsoft SQL Server',
    tags: ['T-SQL', 'ENTERPRISE'],
    category: 'Relational (SQL)',
    desc: 'Cocok untuk kebutuhan enterprise dan integrasi dengan ekosistem Microsoft.',
    iconName: 'layers'
  },
  {
    id: 'mariadb',
    title: 'MariaDB',
    tags: ['INT', 'DATETIME'],
    category: 'Relational (SQL)',
    desc: 'Alternatif open source untuk MySQL.',
    iconName: 'database'
  },
  {
    id: 'oracle',
    title: 'Oracle Database',
    tags: ['PL/SQL', 'ENTERPRISE'],
    category: 'Relational (SQL)',
    desc: 'Untuk kebutuhan skala besar di lingkungan enterprise.',
    iconName: 'disc'
  },
  {
    id: 'planetscale',
    title: 'PlanetScale',
    tags: ['MYSQL', 'SERVERLESS'],
    category: 'Serverless / BaaS',
    desc: 'Database serverless untuk aplikasi modern dengan branching workflow.',
    iconName: 'circle'
  },
  {
    id: 'neon',
    title: 'Neon (PostgreSQL)',
    tags: ['SERVERLESS', 'CLOUD'],
    category: 'Serverless / BaaS',
    desc: 'PostgreSQL serverless yang modern dan mudah diskalakan.',
    iconName: 'zap'
  },
  {
    id: 'none',
    title: 'Tidak pakai database',
    tags: ['STATIS'],
    category: 'Semua Kategori',
    desc: 'Untuk website statis atau landing page saja.',
    iconName: 'slash'
  }
];

export const DEFAULT_ENTITIES: EntitySchema[] = [
  {
    id: 'users',
    name: 'users',
    description: 'Menyimpan profil akun pengguna',
    fields: [
      { id: '1', name: 'id', type: 'UUID', isPrimaryKey: true },
      { id: '2', name: 'name', type: 'VARCHAR', isRequired: true },
      { id: '3', name: 'email', type: 'VARCHAR', isRequired: true, isUnique: true },
      { id: '4', name: 'created_at', type: 'TIMESTAMP', defaultValue: 'now()' }
    ]
  },
  {
    id: 'projects',
    name: 'projects',
    description: 'Menyimpan data proyek/ruang kerja pengguna',
    fields: [
      { id: '1', name: 'id', type: 'UUID', isPrimaryKey: true },
      { id: '2', name: 'user_id', type: 'UUID', isRequired: true },
      { id: '3', name: 'name', type: 'VARCHAR', isRequired: true },
      { id: '4', name: 'description', type: 'TEXT' },
      { id: '5', name: 'created_at', type: 'TIMESTAMP', defaultValue: 'now()' }
    ]
  },
  {
    id: 'tasks',
    name: 'tasks',
    description: 'Menyimpan daftar tugas dalam proyek',
    fields: [
      { id: '1', name: 'id', type: 'UUID', isPrimaryKey: true },
      { id: '2', name: 'project_id', type: 'UUID', isRequired: true },
      { id: '3', name: 'title', type: 'VARCHAR', isRequired: true },
      { id: '4', name: 'status', type: 'VARCHAR', defaultValue: "'todo'" },
      { id: '5', name: 'created_at', type: 'TIMESTAMP', defaultValue: 'now()' }
    ]
  }
];

export const INITIAL_INTERVIEW_DATA: InterviewData = {
  // Kelompok 1/5
  q1_problem: 'Banyak tim dan solo developer kesulitan menyusun spesifikasi kebutuhan produk (PRD) yang rapi, terstandar, dan langsung dapat dieksekusi tim developer.',
  q2_targetUser: 'Pengguna umum / publik',
  q3_coreFeature: 'Interview terstruktur langkah demi langkah, auto-generate PRD lengkap, diagram ERD interaktif, SQL Schema siap migrasi, dan task sprint list.',

  // Kelompok 2/5
  q4_userFlow: 'User memasukkan ide awal → memilih preferensi stack teknologi → menjawab interview terarah → sistem menghasilkan PRD komprehensif, ERD, SQL, dan task list → download & implementasi.',
  q5_ahaMoment: 'Saat pengguna melihat ringkasan ide mereka yang tadinya abstrak berubah dalam sekejap menjadi diagram relasi database, script SQL siap pakai, dan task board sprint yang siap dicoding.',
  q6_outOfScope: 'Payment gateway multi-currency, integrasi cloud VCS otomatis ke GitHub repository, dan mobile native app store publication (ditunda ke versi V2).',

  // Kelompok 3/5
  q7_mainEntities: 'user, project, task, prd_document, export_log',
  q8_entities: DEFAULT_ENTITIES,
  q9_relations: 'user memiliki banyak (1:N) project, project memiliki banyak (1:N) task, project memiliki satu atau lebih prd_document.',
  q10_dataRules: 'Email user unik & terverifikasi. Project hanya dapat diakses oleh pembuat atau kolaborator terdaftar. Soft delete untuk entitas penting.',

  // Kelompok 4/5
  q11_infraConstraints: ['Bisa jalan offline / lokal', 'Open source only'],
  q11_infraDetails: 'Dapat dijalankan secara mandiri dengan dependensi minimal.',
  q12_userEstimate: '1 – 100',
  q13_targetPlatform: 'Web App',
  q14_integrations: ['AI (OpenAI, Claude, Gemini)'],
  q14_integrationDetails: 'Menggunakan API AI untuk penalaran dan enrich dokumen PRD.',
  q15_specialRequirements: ['Keamanan data tinggi'],
  q15_specialDetails: 'Enkripsi data pengguna dan perlindungan token sesi.',
  q16_timeline: '1 – 3 bulan',
  q16_timelineNotes: 'Target MVP siap uji coba internal dalam 6 minggu pertama.',

  // Kelompok 5/5
  q17_deployment: 'vercel',
  q18_auth: 'nextauth',
  q19_apiArch: 'server_actions',
  q20_storage: 's3_r2',
  q21_observability: ['Sentry', 'PostHog'],
  q22_codeStandards: ['TypeScript Strict Mode', 'Vitest / Jest', 'ESLint + Prettier Config'],
  q23_technicalNotes: 'Gunakan Tailwind CSS, Next.js App Router, arsitektur modular tanpa library usang, dan clean component separation.'
};
