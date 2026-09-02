import { describe, expect, it } from "vitest";
import {
  getHiringStatusInfo,
  getLinkStatusInfo,
  getCommunicationStatusInfo,
  getInsightStatusInfo,
} from "../client/src/lib/statusFormatters";

describe("statusFormatters - Spanish status translations and badge styling", () => {
  describe("getHiringStatusInfo", () => {
    it("formats pending status in Spanish", () => {
      const result = getHiringStatusInfo("pending");
      expect(result.label).toBe("Pendiente");
      expect(result.className).toContain("amber");
    });

    it("formats in_review status in Spanish", () => {
      const result = getHiringStatusInfo("in_review");
      expect(result.label).toBe("En revisión");
      expect(result.className).toContain("blue");
    });

    it("formats in_progress status in Spanish", () => {
      const result = getHiringStatusInfo("in_progress");
      expect(result.label).toBe("En progreso");
      expect(result.className).toContain("sky");
    });

    it("formats complete status in Spanish", () => {
      const result = getHiringStatusInfo("complete");
      expect(result.label).toBe("Completo");
      expect(result.className).toContain("teal");
    });

    it("formats finalized status in Spanish", () => {
      const result = getHiringStatusInfo("finalized");
      expect(result.label).toBe("Finalizado");
      expect(result.className).toContain("emerald");
    });

    it("formats draft status in Spanish", () => {
      const result = getHiringStatusInfo("draft");
      expect(result.label).toBe("Borrador");
      expect(result.className).toContain("slate");
    });

    it("infers complete when all required documents are received", () => {
      const result = getHiringStatusInfo("pending", 3, 3);
      expect(result.label).toBe("Completo");
      expect(result.className).toContain("teal");
    });

    it("remains pending if not all required documents are received", () => {
      const result = getHiringStatusInfo("pending", 3, 1);
      expect(result.label).toBe("Pendiente");
    });

    it("handles undefined, null and empty inputs safely", () => {
      expect(getHiringStatusInfo(undefined).label).toBe("Pendiente");
      expect(getHiringStatusInfo(null).label).toBe("Pendiente");
      expect(getHiringStatusInfo("").label).toBe("Pendiente");
    });
  });

  describe("getLinkStatusInfo", () => {
    it("returns Activo when isActive is true", () => {
      const result = getLinkStatusInfo("expired", true);
      expect(result.label).toBe("Activo");
    });

    it("formats link statuses in Spanish", () => {
      expect(getLinkStatusInfo("active").label).toBe("Activo");
      expect(getLinkStatusInfo("expired").label).toBe("Expirado");
      expect(getLinkStatusInfo("revoked").label).toBe("Revocado");
      expect(getLinkStatusInfo("completed").label).toBe("Completado");
      expect(getLinkStatusInfo(null).label).toBe("No generado");
    });
  });

  describe("getCommunicationStatusInfo", () => {
    it("formats communication statuses in Spanish", () => {
      expect(getCommunicationStatusInfo("sent").label).toBe("Enviado");
      expect(getCommunicationStatusInfo("delivered").label).toBe("Entregado");
      expect(getCommunicationStatusInfo("opened").label).toBe("Abierto");
      expect(getCommunicationStatusInfo("not_sent").label).toBe("No enviado");
      expect(getCommunicationStatusInfo("error").label).toBe("Error");
    });
  });

  describe("getInsightStatusInfo", () => {
    it("formats AI insight statuses in Spanish", () => {
      expect(getInsightStatusInfo("unread").label).toBe("Sin leer");
      expect(getInsightStatusInfo("read").label).toBe("Leída");
      expect(getInsightStatusInfo("reviewed").label).toBe("Revisada");
      expect(getInsightStatusInfo("resolved").label).toBe("Resuelta");
    });
  });
});
