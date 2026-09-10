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
  | 'product_type'
  | 'frontend'
  | 'database'
  | 'summary'
  | 'interview'
  | 'result';

export type InterviewGroupIndex = 1 | 2 | 3 | 4 | 5;

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

  // Kelompok 5/5: Teknis & Preferensi
  q17_deployment: string;
  q18_auth: string;
  q19_apiArch: string;
  q20_storage: string;
  q21_observability: string[];
  q22_codeStandards: string[];
  q23_technicalNotes: string;
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
