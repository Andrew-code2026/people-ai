import type { RoleKey } from "../drizzle/schema";

export type TenantContext = { companyId: number; userId: number; role: RoleKey };

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };
export type LlmAnswer = { content: string; model: string; usage?: { inputTokens?: number; outputTokens?: number } };

export type AiDocumentFindingInput = {
  documentId?: number;
  requirementId?: number;
  sourcePageStart?: number;
  sourcePageEnd?: number;
  detectedType: string;
  suggestedName?: string;
  confidence: number;
  status: "identified" | "review_required" | "confirmed" | "corrected" | "rejected";
  issueType?: string;
  issueMessage?: string;
  extractedData?: Record<string, unknown>;
};

export type AiDocumentAnalysisInput = {
  candidateName: string;
  positionName: string;
  requirements: Array<{ id: number; title: string; required: boolean }>;
  documents: Array<{ id: number; originalName: string; normalizedName: string; mimeType: string; url?: string }>;
};

export type AiDocumentAnalysisOutput = {
  findings: AiDocumentFindingInput[];
  summary: string;
};

export interface AIProvider {
  readonly name: string;
  readonly mode: "demo" | "real";
  analyzeDocuments(input: { tenant: TenantContext; data: AiDocumentAnalysisInput }): Promise<AiDocumentAnalysisOutput>;
  answerAssistant(input: { tenant: TenantContext; question: string; context: string }): Promise<{ content: string; model: string }>;
}

export interface LlmProvider {
  readonly name: string;
  generateAnswer(input: { messages: LlmMessage[]; tenant: TenantContext; temperature?: number }): Promise<LlmAnswer>;
  embed?(input: { text: string; tenant: TenantContext }): Promise<number[]>;
}

export interface KnowledgeBasePort {
  search(input: { tenant: TenantContext; query: string; limit?: number }): Promise<Array<{ id: string; title: string; excerpt: string; score: number }>>;
  upsert(input: { tenant: TenantContext; title: string; content: string; sourceRef?: string }): Promise<{ id: string }>;
}

export type IntegrationName = "whatsapp" | "teams" | "email" | "payroll" | "erp" | "csv";
export interface IntegrationAdapter {
  readonly name: IntegrationName;
  connect(tenant: TenantContext, config: Record<string, string>): Promise<{ connected: boolean }>;
  disconnect(tenant: TenantContext): Promise<void>;
  health(tenant: TenantContext): Promise<{ status: "connected" | "disconnected" | "error"; checkedAt: number }>;
}

export type DocumentMetadata = {
  companyId: number;
  ownerUserId?: number;
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string;
};

export interface DocumentStoragePort {
  put(metadata: Omit<DocumentMetadata, "fileKey">, bytes: Uint8Array): Promise<DocumentMetadata>;
  getUrl(tenant: TenantContext, fileKey: string): Promise<string>;
  remove(tenant: TenantContext, fileKey: string): Promise<void>;
}

export type AiCapability = "hr-assistant" | "onboarding" | "payroll-intelligence" | "people-analytics" | "talent-intelligence";
export type FutureModuleStatus = "planned" | "available";
export const FUTURE_MODULES: Record<AiCapability | IntegrationName | "documents", FutureModuleStatus> = {
  "hr-assistant": "planned",
  onboarding: "planned",
  "payroll-intelligence": "planned",
  "people-analytics": "planned",
  "talent-intelligence": "planned",
  whatsapp: "planned",
  teams: "planned",
  email: "planned",
  payroll: "planned",
  erp: "planned",
  csv: "planned",
  documents: "planned",
};
