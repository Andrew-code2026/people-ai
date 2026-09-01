import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readClient = (file: string) => readFileSync(resolve(process.cwd(), "client/src/pages", file), "utf8");

describe("Fase 4A UI contracts", () => {
  it("expone asistente contextual limitado por processId", () => {
    const source = readClient("HiringDetailPage.tsx");
    expect(source).toContain("ContextualAssistant");
    expect(source).toContain("processId, question: content");
    expect(source).toContain("contexto de esta contratación");
  });

  it("expone corrección manual de tipo y requisito", () => {
    const source = readClient("HiringDetailPage.tsx");
    expect(source).toContain("Guardar corrección");
    expect(source).toContain('status: "corrected"');
    expect(source).toContain("editedRequirement");
  });

  it("expone confirmar/cancelar para acciones sensibles sin mutación automática", () => {
    const source = readClient("HRSection.tsx");
    expect(source).toContain("Confirmación requerida");
    expect(source).toContain("Confirmar y revisar");
    expect(source).toContain("Cancelar");
    expect(source).toContain("no ejecutará cambios automáticamente");
  });

  it("garantiza que HRDashboard usa datos y rutas reales de backend sin datos demo hardcodeados", () => {
    const source = readClient("HRDashboard.tsx");
    expect(source).toContain("trpc.hiring.list.useQuery");
    expect(source).toContain("trpc.hr.stats.useQuery");
    expect(source).toContain("/hr/contrataciones");
    expect(source).toContain("/hr/contrataciones/${candidate.id}");
    expect(source).not.toContain('"08"');
    expect(source).not.toContain('"14"');
    expect(source).not.toContain('"05"');
    expect(source).not.toContain('"142"');
    expect(source).not.toContain("Consultas atendidas · demo");
  });
});
