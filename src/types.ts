export type AiProviderType = 'gemini' | 'openai' | 'claude' | 'custom';

export interface AiConfig {
  provider: AiProviderType;
  apiKey: string;
  model?: string;
  customBaseUrl?: string;
  customModel?: string;
}

export interface SavedDraftInfo {
  userEmail: string;
  savedAt: string;
  lastStep: WizardStep;
  interviewGroup: InterviewGroupIndex;
  productTypeId: string;
  frontendId: string;
  databaseId: string;
  interviewData: InterviewData;
  projectName: string;
}

export type WizardStep =
  | 'hero'
  | 'dashboard'
  | 'pricing'
  | 'product_type'
  | 'frontend'
  | 'database'
  | 'summary'
  | 'interview'
  | 'result';

export type PlanId = 'free' | 'starter' | 'pro' | 'pro_tahunan';

export interface BillingStatus {
  plan: PlanId;
  prdCount: number;
  freeLimit: number;
  freeLimitReached: boolean;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  applies_to_plan: PlanId | null;
  max_redemptions: number | null;
  redeemed_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  planBreakdown: Record<string, number>;
  totalPrd: number;
  totalRevenue: number;
  revenueByDay: Array<{ day: string; total: number }>;
  recentInterest: Array<{
    email: string;
    plan: string;
    billing_cycle: string;
    promo_code: string | null;
    created_at: string;
  }>;
  recentPayments: Array<{
    email: string;
    plan: string;
    billing_cycle: string;
    amount: number;
    status: string;
    promo_code: string | null;
    created_at: string;
    paid_at: string | null;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  plan: PlanId;
}

export interface AnalyticsData {
  prdByDay: Array<{ day: string; count: number }>;
  signupsByDay: Array<{ day: string; count: number }>;
}

export interface AuditLogEntry {
  id: number;
  actor_email: string;
  action: string;
  resource: string;
  created_at: string;
}

export interface AppSettings {
  id: number;
  platform_name: string;
  support_email: string;
  updated_at: string;
}

export interface IntegrationStatus {
  name: string;
  status: 'online' | 'configured' | 'not_configured';
  detail: string;
}

export interface ReconcileResult {
  orderId: string;
  recordedAmount: number;
  pakasirAmount: number | null;
  pakasirStatus: string;
  match: boolean;
}

export interface ContentItem {
  id: number;
  title: string;
  type: string;
  status: 'draft' | 'published';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAccount {
  id: number;
  email: string;
  added_by: string | null;
  created_at: string;
}

export type InterviewGroupIndex = 1 | 2 | 3 | 4 | 5 | 6;

export type ResultTab = 
  | 'ringkasan'
  | 'prd'
  | 'erd'
  | 'sql'
  | 'tasks'
  | 'architecture'
  | 'risks';

export interface StackOption {
  id: string;
  title: string;
  desc: string;
  badge?: string;
  category?: string;
  tags?: string[];
  iconName: string;
}

export interface EntityField {
  id: string;
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
}

export interface EntitySchema {
  id: string;
  name: string;
  description?: string;
  fields: EntityField[];
}

export interface InterviewData {
  // Kelompok 1/5: Produk & Pengguna
  q1_problem: string;
  q2_targetUser: string;
  q3_coreFeature: string;

  // Kelompok 2/5: Alur & Lingkup
  q4_userFlow: string;
  q5_ahaMoment: string;
  q6_outOfScope: string;

  // Kelompok 3/5: Model Data
  q7_mainEntities: string;
  q8_entities: EntitySchema[];
  q9_relations: string;
  q10_dataRules: string;

  // Kelompok 4/5: Batasan & Skala
  q11_infraConstraints: string[];
  q11_infraDetails: string;
  q12_userEstimate: string;
  q13_targetPlatform: string;
  q14_integrations: string[];
  q14_integrationDetails: string;
  q15_specialRequirements: string[];
  q15_specialDetails: string;
  q16_timeline: string;
  q16_timelineNotes: string;

  // Kelompok 5/6: Teknis & Preferensi
  q17_deployment: string;
  q18_auth: string;
  q19_apiArch: string;
  q20_storage: string;
  q21_observability: string[];
  q22_codeStandards: string[];
  q23_technicalNotes: string;

  // Kelompok 6/6: Bisnis, Tim & Operasional
  q24_businessModel: string;
  q25_pricingNotes: string;
  q26_teamRoles: string[];
  q27_notificationChannels: string[];
  q28_complianceNeeds: string[];
  q29_supportModel: string;
  q30_postMvpPlan: string;
}

export interface TaskItem {
  id: string;
  sprint: number;
  sprintName: string;
  title: string;
  category: string;
  priority: 'P0' | 'P1' | 'P2';
  completed: boolean;
}

export interface RiskItem {
  id: string;
  risk: string;
  category: string;
  severity: 'Tinggi' | 'Sedang' | 'Rendah';
  likelihood: 'Tinggi' | 'Sedang' | 'Rendah';
  mitigation: string;
}

// One branch of the feature roadmap tree (Fitur -> Sub Fitur -> Tasks),
// derived from the same interview answers as the rest of the PRD — never
// hardcoded example features.
export interface FeatureTreeNode {
  id: string;
  name: string;
  phase: number;
  status: string;
  subFeatures: string[];
  tasks: string[];
}

// Summary row for a PRD previously saved to the user's account (list view —
// the full artifact set only loads when the user opens one).
export interface SavedPrdSummary {
  id: number;
  title: string;
  productType: string;
  createdAt: string;
}

export interface GeneratedPRDResult {
  productName: string;
  productType: string;
  frontend: string;
  database: string;
  backend: string;
  deployment: string;
  targetUser: string;
  userEstimate: string;
  targetRelease: string;
  description: string;
  mainGoal: string;
  
  // Artifacts
  prdMarkdown: string;
  sqlSchema: string;
  mermaidErd: string;
  mermaidArchitecture: string;
  entities: EntitySchema[];
  tasks: TaskItem[];
  featureTree: FeatureTreeNode[];
  architectureSummary: {
    overview: string;
    frontendLayer: string;
    backendLayer: string;
    databaseLayer: string;
    deploymentLayer: string;
    securityLayer: string;
    dataFlow: string;
    scalingNotes: string;
    services: string[];
  };
  risks: RiskItem[];
}
