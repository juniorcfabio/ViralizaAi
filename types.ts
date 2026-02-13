import type { ElementType } from 'react';

export interface Plan {
  id?: string;
  name: string;
  price: number | string;
  period?: string;
  features: string[] | string;
  highlight?: boolean;
  includedTools?: FeatureKey[]; // Ferramentas incluídas no plano
  description?: string; // Descrição do plano
}

export interface Testimonial {
  id?: number | string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  text: string;
  rating: number;
  approved?: boolean;
}

export type UserType = 'client' | 'admin';
export type UserStatus = 'Ativo' | 'Inativo' | 'Pendente';

export interface SocialAccount {
  id: number;
  platform: string;
  username: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  default: boolean;
}

export interface BillingRecord {
  id: string;
  date: string;
  amount: string;
  status: 'Pago' | 'Pendente';
  description: string;
}

export interface User {
  id: string;
  name: string; // Can be full name or company name
  email: string;
  type: UserType;
  password?: string; // Stored temporarily during session
  cnpj?: string; // For business accounts
  cpf?: string; // For individual accounts
  plan?: string; // Plan name
  status: UserStatus;
  joinedDate: string; // YYYY-MM-DD format
  trialStartDate?: string; // ISO string for trial start time
  subscriptionEndDate?: string; // ISO string for subscription end date
  socialAccounts?: SocialAccount[];
  paymentMethods?: PaymentMethod[];
  billingHistory?: BillingRecord[];
  churnRisk?: 'Baixo' | 'Médio' | 'Alto';
  businessInfo?: string; // Persists business description for AI
  trialFollowers?: number;
  trialSales?: number;
  affiliateInfo?: {
    isActive?: boolean;
    referralCode: string;
    affiliateCode?: string;
    commissionRate?: number;
    earnings: number;
    referredUserIds: string[];
    joinDate?: string;
  };
  referredBy?: string; // The referral code of the affiliate who referred this user
  avatar?: string;
  lastReviewPromptDate?: string;
  hasReviewed?: boolean;
  addOns?: FeatureKey[]; // List of features purchased separately or granted by admin
}

// Updated feature keys to include the new niche dominance tools and viral prediction
export type FeatureKey =
  | 'analytics'
  | 'affiliate'
  | 'autopilot'
  | 'advancedGrowth'
  | 'conversionRadar'
  | 'audioDetector'
  | 'competitorSpy'
  | 'trendPredictor'
  | 'viralPrediction'
  | 'growthEngine'; // Novo add-on: Motor de Crescimento

export interface StatCardData {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: ElementType;
}

export interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
}

export interface PostIdea {
  id: number;
  title: string;
  content: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'X';
  mediaUrl?: string | string[]; // Can be a single string or array for presentations
  mediaType?: 'image' | 'video' | 'carousel' | 'presentation';
  mediaStatus?: 'ready' | 'generating' | 'uninitialized' | 'error';
  videoPrompt?: string;
  hashtags?: string[];
  optimalTime: string; // New field for strategic scheduling
  comments?: Comment[];
}

export interface GrowthCampaign {
  targetPersona: string;
  strategy: string;
  posts: PostIdea[];
}

export interface EbookChapter {
  title: string;
  content: string;
  image?: string; // Optional image for each chapter
}

export interface SalesFunnel {
  leadMagnet: {
    title: string;
    description: string;
    coverImage?: string; // URL for the generated cover
    chapters?: EbookChapter[]; // Full content
  };
  landingPageCopy: {
    headline: string;
    body: string;
    cta: string;
  };
  emailSequence: {
    subject: string;
    body: string;
  }[];
}

export interface ViralityAnalysis {
  score: number;
  titleStrength: { score: number; feedback: string };
  emotionalAppeal: { score: number; feedback: string };
  ctaClarity: { score: number; feedback: string };
  hashtagOptimization: {
    score: number;
    feedback: string;
    suggestions?: string[];
  };
  imageAnalysis: { score: number; feedback: string };
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export type CampaignStatus = 'Ativa' | 'Concluída' | 'Pausada' | 'Planejada';
export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  budget: number;
  clicks: number;
  conversions: number;
  startDate?: string;
  endDate?: string;
}

export type CouponStatus = 'Ativo' | 'Expirado' | 'Agendado';
export interface Coupon {
  id: string;
  code: string;
  discount: string;
  status: CouponStatus;
  uses: number;
  startDate?: string;
  endDate?: string;
}

export type PostStatus = 'Agendado' | 'Publicado' | 'Falha';
export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduledAt: string;
  status: PostStatus;
}

export type TransactionStatus = 'completed' | 'failed' | 'refunded' | 'pending';
export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  amount: number;
  date: string; // ISO String
  status: TransactionStatus;
  paymentMethod?: string;
  description?: string;
}

export type BusinessReach = 'Local' | 'National' | 'Global';

export interface LocationConfig {
  reach: BusinessReach;
  city?: string;
  neighborhood?: string;
}

export interface AdminPayoutConfig {
  bankName: string;
  accountType: 'Corrente' | 'Poupança';
  agency: string;
  accountNumber: string;
  pixKey: string;
  holderName: string;
  document: string; // CPF or CNPJ
}

export interface ViralTrend {
  title: string;
  description: string;
  type: 'Áudio' | 'Hashtag' | 'Desafio';
}

export interface HashtagSuggestion {
  local: string[];
  national: string[];
  global: string[];
}

export interface SystemIssue {
  id: string;
  description: string;
  status: 'Detectado' | 'Corrigido';
  severity: 'Baixa' | 'Média' | 'Alta';
  solution: string | null;
  isFixing: boolean;
}

export interface InnovationIdea {
  id: string;
  title: string;
  description: string;
  category: 'Admin Tool' | 'User Feature' | 'Platform Upgrade';
  impactScore: number;
}

export interface QuantumLead {
  id: string;
  name: string;
  profileUrl: string;
  reason: string;
  affinityScore: number;
}

export interface EngagementOpportunity {
  id: string;
  platform: string;
  community: string; // e.g., #hashtag, group name, subreddit
  topic: string;
  suggestedAction: string; // e.g., 'Comment', 'Post'
  contentSuggestion: string;
}

export interface AutopilotActionLog {
  id: string;
  timestamp: string;
  platform: string;
  action: string;
  content: string;
  status: 'Executado' | 'Falhou';
  link?: string;
}

export interface AdPartner {
  id: string;
  companyName: string;
  role?: string; // Added: Job title or Slogan
  logo: string; // Base64 or URL
  websiteUrl: string;
  phone?: string;
  instagram?: string;
  status: 'Active' | 'Inactive';
  planType: '1_week' | '15_days' | '30_days' | 'Monthly'; // Duration plan
  planStartDate?: string;
  planEndDate?: string;
  paymentMethod?: string;
  paymentStatus?: 'Paid' | 'Pending';
  joinedDate: string;
  isMock?: boolean; // To differentiate real paid ads from simulation
  userId?: string; // To link with the user who created it
}

export interface AdPricingConfig {
  oneWeek: number;
  fifteenDays: number;
  thirtyDays: number;
}

export interface SystemVersion {
  version: string;
  description: string;
  releaseDate: string;
  isMandatory: boolean;
}

// Theme Interfaces
export interface ThemeColors {
  primary: string;
  secondary: string;
  light: string;
  grayDark: string;
  accent: string;
}

export interface AppTheme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export interface BioOptimization {
  headline: string;
  body: string;
  cta: string;
  linkText: string;
}

export interface EditorialDay {
  day: string;
  theme: string;
  postIdea: string;
  format: string;
}

export interface TrustedCompany {
  id: string;
  name: string;
  url: string;
  status: 'Active' | 'Inactive';
  logo?: string;
}

export interface ViralPredictionResult {
  score: number;
  viralProbability: 'Baixa' | 'Média' | 'Alta' | 'Muito Alta';
  analysis: {
    copy: string;
    visuals: string;
    cta: string;
  };
  suggestions: string[];
  // Versão reescrita ideal (10/10) da ideia/rascunho
  idealContent: string;
}