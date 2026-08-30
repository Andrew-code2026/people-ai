import { TRPCError } from "@trpc/server";
import type { RoleKey } from "../drizzle/schema";

export const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Administrador de plataforma",
  COMPANY_ADMIN: "Administrador de empresa",
  HR: "Talento Humano",
  FINANCE: "Finanzas",
  MANAGER: "Líder de equipo",
  EMPLOYEE: "Colaborador",
};

export const ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  SUPER_ADMIN: ["platform:read", "company:manage", "audit:read"],
  COMPANY_ADMIN: ["company:read", "company:manage", "users:manage", "roles:manage", "departments:manage"],
  HR: ["company:read", "employees:read", "employees:manage", "people:read"],
  FINANCE: ["company:read", "finance:read"],
  MANAGER: ["company:read", "team:read", "requests:read"],
  EMPLOYEE: ["self:read", "self:requests", "self:documents"],
};

export type AccessContext = { role: RoleKey; companyId: number | null };

export function assertRole(context: AccessContext, allowed: RoleKey[]) {
  if (!allowed.includes(context.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permisos para realizar esta acción." });
  }
}

export function assertCompanyScope(context: AccessContext, requestedCompanyId: number) {
  if (context.role !== "SUPER_ADMIN" && context.companyId !== requestedCompanyId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "El recurso no pertenece a tu empresa." });
  }
}

export function hasPermission(role: RoleKey, permission: string) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getDashboardForRole(role: RoleKey) {
  const dashboards: Record<RoleKey, string> = {
    SUPER_ADMIN: "/platform",
    COMPANY_ADMIN: "/company",
    HR: "/hr",
    FINANCE: "/finance",
    MANAGER: "/manager",
    EMPLOYEE: "/employee",
  };
  return dashboards[role];
}
