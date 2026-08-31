import { describe, expect, it, vi } from "vitest";

vi.mock("./db", async () => { const actual = await vi.importActual<typeof import("./db")>("./db"); return { ...actual, getAppProfile: vi.fn(async (userId: number) => userId === 2 ? { role: "EMPLOYEE", companyId: 4 } : { role: "HR", companyId: 4 }) }; });
import { appRouter } from "./routers";
import { getMissingRequirements, isLinkUsable } from "./hrDomain";
import { assertCompanyScope, assertRole } from "./authorization";
import type { TrpcContext } from "./_core/context";

const context = (role: "HR" | "EMPLOYEE" = "HR"): TrpcContext => ({
  user: { id: role === "EMPLOYEE" ? 2 : 1, openId: "phase23-test", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} as TrpcContext);

describe("Fases 2 y 3 — contratos de flujo", () => {
  it("no expone un portal para un token inexistente", async () => {
    const result = await appRouter.createCaller(context()).candidatePortal.get({ token: "a".repeat(32) });
    expect(result).toBeNull();
  });

  it("rechaza enlaces expirados y revocados antes de resolver el portal", () => {
    expect(isLinkUsable("active", new Date(Date.now() - 1))).toBe(false);
    expect(isLinkUsable("revoked", new Date(Date.now() + 86400000))).toBe(false);
    expect(isLinkUsable("active", new Date(Date.now() + 86400000))).toBe(true);
  });

  it("bloquea rol insuficiente y alcance cross-tenant en procedimientos tRPC protegidos", async () => {
    await expect(appRouter.createCaller(context("EMPLOYEE")).hiring.list({ companyId: 4 })).rejects.toThrow();
    await expect(appRouter.createCaller(context("HR")).hiring.detail({ companyId: 5, processId: 1 })).rejects.toThrow();
    expect(() => assertRole({ role: "EMPLOYEE", companyId: 4 }, ["HR"])).toThrow();
    expect(() => assertCompanyScope({ role: "HR", companyId: 4 }, 5)).toThrow();
  });

  it("detecta documentos obligatorios faltantes antes del envío", () => {
    expect(getMissingRequirements([{ required: true, status: "pending" }, { required: true, status: "uploaded" }, { required: false, status: "pending" }])).toHaveLength(1);
  });

  it("rechaza datos de portal con tokens demasiado cortos en el contrato tRPC", async () => {
    await expect(appRouter.createCaller(context()).candidatePortal.get({ token: "short" })).rejects.toThrow();
  });
});
