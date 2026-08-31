import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDashboardForRole, assertCompanyScope, assertRole } from "./authorization";
import { getAppProfile, listCompanies, listDepartmentsByCompany, listEmployeesByCompany, listKnowledgeByCompany, listRecruitmentByCompany } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { demoHRAssistant } from "./aiDemo";
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
