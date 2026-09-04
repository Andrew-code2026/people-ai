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

/** Roles que cada rol puede conceder al invitar.
 *
 *  SUPER_ADMIN no aparece como valor concedible en ninguna lista, a proposito:
 *  ese rol se otorga unicamente en base de datos. Sin este techo, quien tuviera HR
 *  podria invitarse a si mismo como COMPANY_ADMIN y escalar privilegios. */
export const INVITABLE_ROLES: Record<RoleKey, RoleKey[]> = {
  SUPER_ADMIN: ["COMPANY_ADMIN", "HR", "FINANCE", "MANAGER", "EMPLOYEE"],
  COMPANY_ADMIN: ["COMPANY_ADMIN", "HR", "FINANCE", "MANAGER", "EMPLOYEE"],
  HR: ["MANAGER", "EMPLOYEE"],
  FINANCE: [],
  MANAGER: [],
  EMPLOYEE: [],
};

export function canGrantRole(role: RoleKey, requested: RoleKey) {
  return INVITABLE_ROLES[role]?.includes(requested) ?? false;
}

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

export function assertCanGrantRole(context: AccessContext, requested: RoleKey) {
  if (!canGrantRole(context.role, requested)) {
    throw new TRPCError({ code: "FORBIDDEN", message: `No puedes asignar el rol ${ROLE_LABELS[requested]}.` });
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
