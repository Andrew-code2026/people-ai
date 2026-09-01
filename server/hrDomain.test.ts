import { describe, expect, it } from "vitest";
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES, hasMagicSignature, hashToken, isValidUpload, normalize } from "./hrDomain";
import { assertCompanyScope, assertRole } from "./authorization";

describe("Fases 2 y 3 — seguridad y documentos", () => {
  it("genera un hash determinista que no expone el token", () => {
    const token = "candidate-demo-token-without-personal-data";
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("normaliza el nombre desde el título del requisito y conserva extensión", () => {
    expect(normalize("Hoja de vida personal", "HV_Carlos_Final.pdf")).toBe("Hoja de vida personal.pdf");
    expect(normalize("Cédula de ciudadanía", "IMG_8272.JPG")).toBe("Cédula de ciudadanía.jpg");
  });

  it("acepta únicamente formatos documentales permitidos y limita tamaño", () => {
    expect(ALLOWED_MIME_TYPES.has("application/pdf")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("image/jpeg")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("application/x-executable")).toBe(false);
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
    expect(hasMagicSignature(new TextEncoder().encode("%PDF-1.7"), "application/pdf")).toBe(true);
    expect(hasMagicSignature(new Uint8Array([0, 1, 2]), "application/pdf")).toBe(false);
    expect(isValidUpload("documento.pdf", "application/pdf", 1200, new TextEncoder().encode("%PDF-1.7"))).toBe(true);
    expect(isValidUpload("documento.exe", "application/pdf", 1200)).toBe(false);
    expect(isValidUpload("documento.pdf", "application/pdf", MAX_FILE_BYTES + 1)).toBe(false);
  });

  it("rechaza alcance cross-tenant y roles insuficientes", () => {
    expect(() => assertCompanyScope({ role: "HR", companyId: 4 }, 5)).toThrow();
    expect(() => assertRole({ role: "EMPLOYEE", companyId: 4 }, ["HR"])).toThrow();
    expect(() => assertRole({ role: "HR", companyId: 4 }, ["HR"])).not.toThrow();
  });

  it("calcula estructura de estadísticas del dashboard", async () => {
    const { getDashboardStats } = await import("./hrDomain");
    const stats = await getDashboardStats(4);
    expect(stats).toHaveProperty("totalProcesses");
    expect(stats).toHaveProperty("pendingDocuments");
    expect(stats).toHaveProperty("completeProcesses");
    expect(stats).toHaveProperty("assistantQueries");
    expect(typeof stats.totalProcesses).toBe("number");
    expect(typeof stats.pendingDocuments).toBe("number");
    expect(typeof stats.completeProcesses).toBe("number");
    expect(typeof stats.assistantQueries).toBe("number");
  });
});

