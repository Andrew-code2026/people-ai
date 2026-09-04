import { describe, expect, it, vi } from "vitest";

const { TEST_SECRET } = vi.hoisted(() => ({
  TEST_SECRET: "secreto-de-pruebas-suficientemente-largo-32+",
}));

vi.mock("./_core/env", () => ({
  ENV: { cookieSecret: TEST_SECRET, forgeApiUrl: "", forgeApiKey: "" },
}));

import { assertCanGrantRole, canGrantRole, INVITABLE_ROLES } from "./authorization";
import { hashInviteToken, isInviteUsable } from "./orgDomain";

// Nota sobre el alcance de estas pruebas: `inviteUser` y `acceptInvite` son
// transacciones de varias tablas con condiciones WHERE que deciden el resultado
// (revocar solo las pendientes de ESE correo y empresa, cerrar la invitacion solo
// si sigue activa). Un doble de drizzle que ignorase esas condiciones probaria el
// doble, no el codigo, y daria confianza falsa. Esos flujos se verifican de punta a
// punta contra una base real; aqui se prueba lo que es genuinamente unitario.

describe("techo de rol al invitar", () => {
  it("HR no puede conceder COMPANY_ADMIN", () => {
    expect(canGrantRole("HR", "COMPANY_ADMIN")).toBe(false);
    expect(() => assertCanGrantRole({ role: "HR", companyId: 1 }, "COMPANY_ADMIN")).toThrow();
  });

  it("HR si puede conceder EMPLOYEE y MANAGER", () => {
    expect(canGrantRole("HR", "EMPLOYEE")).toBe(true);
    expect(canGrantRole("HR", "MANAGER")).toBe(true);
    expect(() => assertCanGrantRole({ role: "HR", companyId: 1 }, "EMPLOYEE")).not.toThrow();
  });

  it("COMPANY_ADMIN puede conceder todo menos SUPER_ADMIN", () => {
    expect(canGrantRole("COMPANY_ADMIN", "COMPANY_ADMIN")).toBe(true);
    expect(canGrantRole("COMPANY_ADMIN", "FINANCE")).toBe(true);
    expect(canGrantRole("COMPANY_ADMIN", "SUPER_ADMIN")).toBe(false);
  });

  it("nadie concede SUPER_ADMIN, ni siquiera un SUPER_ADMIN", () => {
    for (const rol of Object.keys(INVITABLE_ROLES) as (keyof typeof INVITABLE_ROLES)[]) {
      expect(canGrantRole(rol, "SUPER_ADMIN")).toBe(false);
    }
  });

  it("los roles sin gente a cargo no pueden invitar a nadie", () => {
    for (const rol of ["FINANCE", "MANAGER", "EMPLOYEE"] as const) {
      expect(INVITABLE_ROLES[rol]).toHaveLength(0);
      expect(() => assertCanGrantRole({ role: rol, companyId: 1 }, "EMPLOYEE")).toThrow();
    }
  });
});

describe("token de invitacion", () => {
  it("hashea de forma determinista y no reversible", () => {
    const token = "un-token-de-invitacion-de-prueba";
    expect(hashInviteToken(token)).toHaveLength(64);
    expect(hashInviteToken(token)).not.toBe(token);
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
  });

  it("tokens distintos dan hashes distintos", () => {
    expect(hashInviteToken("token-a")).not.toBe(hashInviteToken("token-b"));
  });
});

describe("vigencia de la invitacion", () => {
  const futuro = new Date(Date.now() + 86400000);
  const pasado = new Date(Date.now() - 1000);

  it("solo es usable si esta activa y no ha caducado", () => {
    expect(isInviteUsable("active", futuro)).toBe(true);
    expect(isInviteUsable("active", pasado)).toBe(false);
    expect(isInviteUsable("revoked", futuro)).toBe(false);
    expect(isInviteUsable("accepted", futuro)).toBe(false);
  });

  it("acepta un instante inyectado, para no depender del reloj", () => {
    const corte = new Date(1000);
    expect(isInviteUsable("active", corte, 999)).toBe(true);
    expect(isInviteUsable("active", corte, 1001)).toBe(false);
  });
});
