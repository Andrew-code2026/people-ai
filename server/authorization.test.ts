import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertCompanyScope, assertRole, getDashboardForRole, hasPermission } from "./authorization";

describe("PEOPLE AI authorization", () => {
  it("maps each role to its intended dashboard", () => {
    expect(getDashboardForRole("SUPER_ADMIN")).toBe("/platform");
    expect(getDashboardForRole("COMPANY_ADMIN")).toBe("/company");
    expect(getDashboardForRole("HR")).toBe("/hr");
    expect(getDashboardForRole("FINANCE")).toBe("/finance");
    expect(getDashboardForRole("MANAGER")).toBe("/manager");
    expect(getDashboardForRole("EMPLOYEE")).toBe("/employee");
  });

  it("allows only roles explicitly assigned to an operation", () => {
    expect(() => assertRole({ role: "HR", companyId: 1 }, ["HR", "COMPANY_ADMIN"])).not.toThrow();
    expect(() => assertRole({ role: "EMPLOYEE", companyId: 1 }, ["HR"])).toThrowError(TRPCError);
  });

  it("blocks cross-company access for non-platform users", () => {
    expect(() => assertCompanyScope({ role: "HR", companyId: 1 }, 1)).not.toThrow();
    expect(() => assertCompanyScope({ role: "HR", companyId: 1 }, 2)).toThrowError(TRPCError);
    expect(() => assertCompanyScope({ role: "SUPER_ADMIN", companyId: null }, 2)).not.toThrow();
  });

  it("keeps the permission catalog extensible", () => {
    expect(hasPermission("COMPANY_ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("EMPLOYEE", "users:manage")).toBe(false);
  });
});
