import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  legalName: varchar("legalName", { length: 220 }).notNull(),
  logo: varchar("logo", { length: 500 }),
  industry: varchar("industry", { length: 120 }),
  country: varchar("country", { length: 80 }).default("Colombia").notNull(),
  city: varchar("city", { length: 100 }),
  timezone: varchar("timezone", { length: 80 }).default("America/Bogota").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ nameIdx: uniqueIndex("companies_name_idx").on(table.name) }));

export const appProfiles = mysqlTable("app_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId"),
  role: mysqlEnum("role", ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "FINANCE", "MANAGER", "EMPLOYEE"]).notNull(),
  status: mysqlEnum("status", ["active", "invited", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userCompanyIdx: uniqueIndex("profiles_user_company_idx").on(table.userId, table.companyId), companyIdx: index("profiles_company_idx").on(table.companyId) }));

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  managerEmployeeId: int("managerEmployeeId"),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ companyIdx: index("departments_company_idx").on(table.companyId) }));

export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId"),
  departmentId: int("departmentId"),
  managerId: int("managerId"),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  employeeCode: varchar("employeeCode", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  position: varchar("position", { length: 140 }),
  hireDate: timestamp("hireDate"),
  employmentStatus: mysqlEnum("employmentStatus", ["active", "leave", "terminated"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ companyIdx: index("employees_company_idx").on(table.companyId), codeIdx: uniqueIndex("employees_company_code_idx").on(table.companyId, table.employeeCode) }));

export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
  key: varchar("key", { length: 80 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  isSystem: boolean("isSystem").default(false).notNull(),
}, (table) => ({ roleScopeIdx: uniqueIndex("roles_scope_key_idx").on(table.companyId, table.key) }));

export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 120 }).notNull().unique(),
  description: text("description"),
});

export const rolePermissions = mysqlTable("role_permissions", {
  roleId: int("roleId").notNull(),
  permissionId: int("permissionId").notNull(),
}, (table) => ({ pairIdx: uniqueIndex("role_permission_pair_idx").on(table.roleId, table.permissionId) }));

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
  userId: int("userId"),
  action: varchar("action", { length: 120 }).notNull(),
  module: varchar("module", { length: 80 }).notNull(),
  result: mysqlEnum("result", ["success", "denied", "error"]).notNull(),
  metadata: text("metadata"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ auditCompanyIdx: index("audit_company_idx").on(table.companyId), auditUserIdx: index("audit_user_idx").on(table.userId) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type AppProfile = typeof appProfiles.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Department = typeof departments.$inferSelect;
export const recruitmentCandidates = mysqlTable("recruitment_candidates", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  candidateName: varchar("candidateName", { length: 160 }).notNull(),
  position: varchar("position", { length: 140 }).notNull(),
  documentsReceived: int("documentsReceived").default(0).notNull(),
  documentsRequired: int("documentsRequired").default(9).notNull(),
  status: mysqlEnum("status", ["pending", "complete", "review"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ companyIdx: index("recruitment_company_idx").on(table.companyId) }));

export const knowledgeBaseDocuments = mysqlTable("knowledge_base_documents", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["demo", "draft", "published"]).default("demo").notNull(),
  sourceRef: varchar("sourceRef", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ companyIdx: index("knowledge_company_idx").on(table.companyId) }));

export type RecruitmentCandidate = typeof recruitmentCandidates.$inferSelect;
export type KnowledgeBaseDocument = typeof knowledgeBaseDocuments.$inferSelect;
export const jobPositions = mysqlTable("job_positions", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), name: varchar("name", { length: 160 }).notNull(), description: text("description"), status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ companyIdx: index("positions_company_idx").on(table.companyId) }));

export const documentTemplates = mysqlTable("document_templates", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), positionId: int("positionId").notNull(), name: varchar("name", { length: 180 }).notNull(), version: int("version").default(1).notNull(), status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ companyIdx: index("templates_company_idx").on(table.companyId), positionIdx: index("templates_position_idx").on(table.positionId) }));

export const documentTemplateItems = mysqlTable("document_template_items", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), templateId: int("templateId").notNull(), title: varchar("title", { length: 180 }).notNull(), description: text("description"), required: boolean("required").default(true).notNull(), sortOrder: int("sortOrder").default(0).notNull(), allowedMimeTypes: varchar("allowedMimeTypes", { length: 300 }).default("application/pdf,image/jpeg,image/png").notNull(),
}, (table) => ({ companyIdx: index("template_items_company_idx").on(table.companyId), templateIdx: index("template_items_template_idx").on(table.templateId) }));

export const candidateProfiles = mysqlTable("candidate_profiles", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), fullName: varchar("fullName", { length: 180 }).notNull(), identificationNumber: varchar("identificationNumber", { length: 80 }).notNull(), email: varchar("email", { length: 320 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ companyIdx: index("candidates_company_idx").on(table.companyId) }));

export const hiringProcesses = mysqlTable("hiring_processes", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), candidateId: int("candidateId").notNull(), positionId: int("positionId").notNull(), templateId: int("templateId").notNull(), createdByUserId: int("createdByUserId").notNull(), status: mysqlEnum("status", ["draft", "pending", "in_progress", "complete", "in_review", "finalized"]).default("pending").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ companyIdx: index("hiring_company_idx").on(table.companyId), candidateIdx: index("hiring_candidate_idx").on(table.candidateId) }));

export const hiringRequirements = mysqlTable("hiring_requirements", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), processId: int("processId").notNull(), sourceTemplateItemId: int("sourceTemplateItemId"), title: varchar("title", { length: 180 }).notNull(), description: text("description"), required: boolean("required").default(true).notNull(), sortOrder: int("sortOrder").default(0).notNull(), status: mysqlEnum("status", ["pending", "uploaded", "replaced", "removed", "verified"]).default("pending").notNull(),
}, (table) => ({ companyIdx: index("requirements_company_idx").on(table.companyId), processIdx: index("requirements_process_idx").on(table.processId) }));

export const candidateAccessLinks = mysqlTable("candidate_access_links", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), processId: int("processId").notNull(), candidateId: int("candidateId").notNull(), tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(), createdAt: timestamp("createdAt").defaultNow().notNull(), expiresAt: timestamp("expiresAt").notNull(), revokedAt: timestamp("revokedAt"), lastUsedAt: timestamp("lastUsedAt"), status: mysqlEnum("status", ["active", "expired", "revoked", "completed"]).default("active").notNull(),
}, (table) => ({ companyIdx: index("links_company_idx").on(table.companyId), processIdx: index("links_process_idx").on(table.processId) }));

export const candidateDocuments = mysqlTable("candidate_documents", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), processId: int("processId").notNull(), requirementId: int("requirementId").notNull(), originalName: varchar("originalName", { length: 255 }).notNull(), normalizedName: varchar("normalizedName", { length: 255 }).notNull(), fileKey: varchar("fileKey", { length: 500 }).notNull(), mimeType: varchar("mimeType", { length: 120 }).notNull(), sizeBytes: int("sizeBytes").notNull(), checksum: varchar("checksum", { length: 128 }), status: mysqlEnum("status", ["active", "removed", "verified"]).default("active").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ companyIdx: index("documents_company_idx").on(table.companyId), processIdx: index("documents_process_idx").on(table.processId), requirementIdx: index("documents_requirement_idx").on(table.requirementId) }));

export const internalNotifications = mysqlTable("internal_notifications", {
  id: int("id").autoincrement().primaryKey(), companyId: int("companyId").notNull(), recipientUserId: int("recipientUserId").notNull(), processId: int("processId"), type: varchar("type", { length: 80 }).notNull(), title: varchar("title", { length: 180 }).notNull(), readAt: timestamp("readAt"), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ companyIdx: index("notifications_company_idx").on(table.companyId), recipientIdx: index("notifications_recipient_idx").on(table.recipientUserId) }));

export type JobPosition = typeof jobPositions.$inferSelect;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type DocumentTemplateItem = typeof documentTemplateItems.$inferSelect;
export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type HiringProcess = typeof hiringProcesses.$inferSelect;
export type HiringRequirement = typeof hiringRequirements.$inferSelect;
export type CandidateAccessLink = typeof candidateAccessLinks.$inferSelect;
export type CandidateDocument = typeof candidateDocuments.$inferSelect;
export type InternalNotification = typeof internalNotifications.$inferSelect;
export type RoleKey = "SUPER_ADMIN" | "COMPANY_ADMIN" | "HR" | "FINANCE" | "MANAGER" | "EMPLOYEE";
