import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDashboardForRole, assertCompanyScope, assertRole } from "./authorization";
import { getAppProfile, listCompanies, listDepartmentsByCompany, listEmployeesByCompany, listKnowledgeByCompany, listRecruitmentByCompany } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { demoHRAssistant } from "./aiDemo";
import { createHiring, createPosition, createTemplate, generateLink, getDocumentUrl, getHiringDetail, getLinkState, getPortal, listActivities, listCommunications, listHiring, listPositions, listTemplates, listNotifications, removePortalDocument, revokeLink, sendCandidateEmail, sendCandidateReminder, downloadHiringZip, listExpiringLinks, requestCandidateOtp, submitPortal, verifyCandidateOtp, updateRequirement, updateTemplate, uploadPortalDocument } from "./hrDomain";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const roleSchema = z.enum(["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "FINANCE", "MANAGER", "EMPLOYEE"]);

async function resolveAccess(user: { id: number; role: string }) {
  const profile = await getAppProfile(user.id);
  if (profile) return { role: profile.role, companyId: profile.companyId } as const;
  if (user.role === "admin") return { role: "SUPER_ADMIN" as const, companyId: null };
  throw new TRPCError({ code: "FORBIDDEN", message: "Tu cuenta aún no tiene un perfil empresarial activo." });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  access: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const access = await resolveAccess(ctx.user);
      return { ...access, dashboard: getDashboardForRole(access.role), roles: roleSchema.options };
    }),
  }),
  platform: router({
    companies: protectedProcedure.query(async ({ ctx }) => {
      const access = await resolveAccess(ctx.user);
      assertRole(access, ["SUPER_ADMIN"]);
      return listCompanies();
    }),
  }),
  hr: router({
    recruitment: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const access = await resolveAccess(ctx.user);
      assertRole(access, ["SUPER_ADMIN", "HR", "COMPANY_ADMIN"]);
      assertCompanyScope(access, input.companyId);
      return listRecruitmentByCompany(input.companyId);
    }),
    assistantPreview: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const access = await resolveAccess(ctx.user);
      assertRole(access, ["SUPER_ADMIN", "HR", "COMPANY_ADMIN"]);
      assertCompanyScope(access, input.companyId);
      return demoHRAssistant.generateAnswer({ tenant: { companyId: input.companyId, userId: ctx.user.id, role: access.role }, messages: [{ role: "user", content: "¿Cómo solicito un certificado laboral?" }] });
    }),
    knowledge: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const access = await resolveAccess(ctx.user);
      assertRole(access, ["SUPER_ADMIN", "HR", "COMPANY_ADMIN"]);
      assertCompanyScope(access, input.companyId);
      return listKnowledgeByCompany(input.companyId);
    }),
  }),
  positions: router({
    list: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return listPositions(input.companyId); }),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), name: z.string().trim().min(2).max(160), description: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return createPosition(input.companyId, input.name, input.description, ctx.user.id); }),
  }),
  templates: router({
    list: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return listTemplates(input.companyId); }),
    get: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), templateId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return (await import("./hrDomain")).getTemplate(input.companyId, input.templateId); }),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), positionId: z.number().int().positive(), name: z.string().trim().min(2).max(180), items: z.array(z.object({ title: z.string().trim().min(2).max(180), description: z.string().max(500).optional(), required: z.boolean(), sortOrder: z.number().int().nonnegative() })).min(1) })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return createTemplate(input.companyId, input.positionId, input.name, input.items, ctx.user.id); }),
    update: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), templateId: z.number().int().positive(), items: z.array(z.object({ title: z.string().trim().min(2).max(180), description: z.string().max(500).optional(), required: z.boolean(), sortOrder: z.number().int().nonnegative() })) })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return updateTemplate(input.companyId, input.templateId, input.items, ctx.user.id); }),
  }),
  hiring: router({
    list: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return listHiring(input.companyId); }),
    detail: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return getHiringDetail(input.companyId, input.processId); }),
    create: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), fullName: z.string().trim().min(3).max(180), identificationNumber: z.string().trim().min(4).max(80), email: z.string().email(), positionId: z.number().int().positive(), templateId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return createHiring(input.companyId, ctx.user.id, input); }),
    generateLink: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return generateLink(input.companyId, input.processId, ctx.user.id); }),
    notifications: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return listNotifications(input.companyId, ctx.user.id); }),
    documentUrl: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive(), documentId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return getDocumentUrl(input.companyId, input.processId, input.documentId); }),
    updateRequirement: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive(), requirementId: z.number().int().positive(), title: z.string().trim().min(2).max(180).optional(), required: z.boolean().optional(), status: z.enum(["pending", "uploaded", "replaced", "removed", "verified"]).optional() })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return updateRequirement(input.companyId, input.processId, input.requirementId, input, ctx.user.id); }),
    communications: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return listCommunications(input.companyId, input.processId); }),
    activities: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return listActivities(input.companyId, input.processId); }),
    linkState: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return getLinkState(input.companyId, input.processId); }),
    expiringLinks: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), withinHours: z.number().int().positive().max(168).default(24) })).query(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return listExpiringLinks(input.companyId, input.withinHours); }),
    sendEmail: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return sendCandidateEmail(input.companyId, input.processId, ctx.user.id); }),
    sendReminder: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return sendCandidateReminder(input.companyId, input.processId, ctx.user.id); }),
    revokeLink: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return revokeLink(input.companyId, input.processId, ctx.user.id); }),
    downloadZip: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), processId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const access = await resolveAccess(ctx.user); assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]); assertCompanyScope(access, input.companyId); return downloadHiringZip(input.companyId, input.processId, ctx.user.id); }),
  }),
  candidatePortal: router({
    get: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).query(({ input }) => getPortal(input.token)),
    upload: publicProcedure.input(z.object({ token: z.string().min(20).max(200), requirementId: z.number().int().positive(), originalName: z.string().min(1).max(255), mimeType: z.string(), base64: z.string().min(1) })).mutation(({ input }) => uploadPortalDocument(input.token, input.requirementId, input.originalName, input.mimeType, Buffer.from(input.base64, "base64"))),
    submit: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).mutation(({ input }) => submitPortal(input.token)),
    remove: publicProcedure.input(z.object({ token: z.string().min(20).max(200), requirementId: z.number().int().positive() })).mutation(({ input }) => removePortalDocument(input.token, input.requirementId)),
    otpRequest: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).mutation(({ input }) => requestCandidateOtp(input.token)),
    otpVerify: publicProcedure.input(z.object({ token: z.string().min(20).max(200), code: z.string().regex(/^\\d{6}$/) })).mutation(({ input }) => verifyCandidateOtp(input.token, input.code)),
  }),
  company: router({
    departments: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const access = await resolveAccess(ctx.user);
      assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"]);
      assertCompanyScope(access, input.companyId);
      return listDepartmentsByCompany(input.companyId);
    }),
    employees: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const access = await resolveAccess(ctx.user);
      assertRole(access, ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER"]);
      assertCompanyScope(access, input.companyId);
      return listEmployeesByCompany(input.companyId);
    }),
  }),
});

export type AppRouter = typeof appRouter;
