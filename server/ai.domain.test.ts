import { describe, expect, it } from "vitest";
import { demoProvider, isSensitiveAssistantRequest, splitPdfBytes } from "./aiDomain";
import { PDFDocument } from "pdf-lib";

describe("Fase 4A AI domain", () => {
  it("analiza documentos en modo DEMO sin inventar contenido y detecta faltantes", async () => {
    const result = await demoProvider.analyzeDocuments({
      tenant: { companyId: 4, userId: 10, role: "HR" },
      data: {
        candidateName: "Carlos Pérez",
        positionName: "Practicante SENA",
        requirements: [
          { id: 1, title: "Hoja de vida personal", required: true },
          { id: 2, title: "Cédula", required: true },
          { id: 3, title: "EPS", required: true },
        ],
        documents: [
          { id: 20, originalName: "hoja_de_vida.pdf", normalizedName: "IMG.pdf", mimeType: "application/pdf" },
          { id: 21, originalName: "scan_final.pdf", normalizedName: "scan_final.pdf", mimeType: "application/pdf" },
        ],
      },
    });
    expect(result.summary).toContain("Modo DEMO");
    expect(result.findings.some(finding => finding.requirementId === 3 && finding.issueType === "missing")).toBe(true);
    expect(result.findings.some(finding => finding.status === "review_required")).toBe(true);
    expect(result.findings.every(finding => finding.confidence >= 0 && finding.confidence <= 100)).toBe(true);
  });

  it("responde con transparencia y exige revisión para acciones sensibles", async () => {
    const result = await demoProvider.answerAssistant({
      tenant: { companyId: 4, userId: 10, role: "HR" },
      question: "Regenera el enlace de Carlos",
      context: "Carlos Pérez — Practicante SENA: 5/6 documentos; falta Documento adicional; procesoId 12",
    });
    expect(result.model).toBe("PEOPLE AI DEMO");
    expect(result.content).toContain("requiere confirmación explícita");
    expect(result.content).not.toContain("Empresa B");
  });

  it("detecta acciones sensibles y permite cancelar sin ejecutar nada", () => {
    expect(isSensitiveAssistantRequest("revoca el enlace")).toBe(true);
    expect(isSensitiveAssistantRequest("¿cuántos documentos faltan?")).toBe(false);
  });

  it("separa un PDF por páginas conservando un segmento por página", async () => {
    const source = await PDFDocument.create();
    source.addPage([300, 400]);
    source.addPage([300, 400]);
    const segments = await splitPdfBytes(await source.save());
    expect(segments).toHaveLength(2);
    const first = await PDFDocument.load(segments[0]);
    const second = await PDFDocument.load(segments[1]);
    expect(first.getPageCount()).toBe(1);
    expect(second.getPageCount()).toBe(1);
  });

  it("no presenta una respuesta inventada cuando no hay contexto autorizado", async () => {
    const result = await demoProvider.answerAssistant({
      tenant: { companyId: 4, userId: 10, role: "HR" },
      question: "¿Qué documentos le faltan a una persona desconocida?",
      context: "",
    });
    expect(result.content).toBe("No tengo suficiente información para determinarlo.");
  });
});
