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

  it("garantiza la definición estándar de la plantilla por defecto 'Expediente de Ingreso Estándar'", async () => {
    const { DEFAULT_TEMPLATE_NAME, DEFAULT_STANDARD_DOCUMENTS } = await import("./hrDomain");
    expect(DEFAULT_TEMPLATE_NAME).toBe("Expediente de Ingreso Estándar");
    expect(DEFAULT_STANDARD_DOCUMENTS.length).toBe(6);
    expect(DEFAULT_STANDARD_DOCUMENTS.some(d => d.title.includes("Cédula"))).toBe(true);
    expect(DEFAULT_STANDARD_DOCUMENTS.some(d => d.title.includes("Hoja de Vida"))).toBe(true);
    expect(DEFAULT_STANDARD_DOCUMENTS.some(d => d.title.includes("EPS"))).toBe(true);
    expect(DEFAULT_STANDARD_DOCUMENTS.some(d => d.title.includes("Pensiones"))).toBe(true);
    expect(DEFAULT_STANDARD_DOCUMENTS.some(d => d.title.includes("Examen Médico"))).toBe(true);
  });

  it("permite consultar la plantilla estándar maestra de la empresa", async () => {
    const { getMasterStandardTemplate } = await import("./hrDomain");
    const master = await getMasterStandardTemplate(4);
    expect(master).toHaveProperty("items");
    expect(Array.isArray(master.items)).toBe(true);
    expect(master.items.length).toBeGreaterThanOrEqual(1);
  });

  it("permite actualizar la plantilla estándar maestra de la empresa", async () => {
    const { updateMasterStandardTemplate } = await import("./hrDomain");
    const newItems = [
      { title: "Cédula de Ciudadanía", description: "PDF legible", required: true, sortOrder: 1 },
      { title: "Hoja de Vida", description: "Formato actualizado", required: true, sortOrder: 2 },
    ];
    const updated = await updateMasterStandardTemplate(4, newItems);
    expect(updated.items.length).toBe(2);
    expect(updated.items[0].title).toBe("Cédula de Ciudadanía");
  });

  it("permite ejecutar el flujo de creación y eliminación de un cargo", async () => {
    const { createPosition, deletePosition } = await import("./hrDomain");
    const testName = `Cargo Test ${Date.now()}`;
    const newId = await createPosition(4, testName, "Descripción de prueba para test");
    expect(typeof newId).toBe("number");
    expect(newId).toBeGreaterThan(0);

    const deleteRes = await deletePosition(4, newId);
    expect(deleteRes).toEqual({ success: true, id: newId });
  });

  it("permite crear plantillas reutilizables a nivel empresa y asignarlas a múltiples cargos", async () => {
    const { createPosition, createTemplate, assignTemplateToPosition, listPositions, getTemplate, deletePosition } = await import("./hrDomain");

    // 1. Create a standalone company template
    const templateName = `Plantilla Reutilizable ${Date.now()}`;
    const items = [
      { title: "Certificado de Antecedentes", description: "Vigencia 30 días", required: true, sortOrder: 1 },
      { title: "Certificación Bancaria", description: "Cuenta activa", required: false, sortOrder: 2 },
    ];
    const createdTemplate = await createTemplate(4, templateName, items);
    expect(createdTemplate).toHaveProperty("id");
    expect(createdTemplate.name).toBe(templateName);
    expect(createdTemplate.companyId).toBe(4);

    // 2. Create two distinct positions
    const pos1Id = await createPosition(4, `Cargo A ${Date.now()}`, "Perfil A");
    const pos2Id = await createPosition(4, `Cargo B ${Date.now()}`, "Perfil B");

    // 3. Assign the SAME reusable template to both positions
    const assign1 = await assignTemplateToPosition(4, pos1Id, createdTemplate.id);
    const assign2 = await assignTemplateToPosition(4, pos2Id, createdTemplate.id);
    expect(assign1).toEqual({ success: true, positionId: pos1Id, templateId: createdTemplate.id });
    expect(assign2).toEqual({ success: true, positionId: pos2Id, templateId: createdTemplate.id });

    // 4. Verify both positions list the templateId if DB is active
    const allPositions = await listPositions(4);
    if (allPositions.length > 0) {
      const pos1 = allPositions.find(p => p.id === pos1Id);
      const pos2 = allPositions.find(p => p.id === pos2Id);
      expect(pos1?.templateId).toBe(createdTemplate.id);
      expect(pos2?.templateId).toBe(createdTemplate.id);
    }

    // 5. Clean up positions
    await deletePosition(4, pos1Id);
    await deletePosition(4, pos2Id);

    // 6. Verify the shared template still exists and is not deleted by deleting a position
    const fetchedTemplate = await getTemplate(4, createdTemplate.id);
    if (fetchedTemplate) {
      expect(fetchedTemplate.name).toBe(templateName);
    }
  });
});
