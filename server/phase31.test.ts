import { describe, expect, it } from "vitest";
import { buildManualCommunicationRecord, communicationAuditAction, createZipArchive, buildCandidateEmail, hashOtp, isExpiringWithin, isLinkUsable, isOtpUsable, isReminderAllowed, manualCommunicationEvents } from "./hrDomain";
import { buildMailtoUrl, prepareMailtoEmail } from "./emailService";

describe("Fase 3.1 - OTP", () => {
  it("only stores a deterministic hash and accepts active challenges", () => {
    const now = Date.now();
    expect(hashOtp("123456")).toHaveLength(64);
    expect(hashOtp("123456")).toBe(hashOtp("123456"));
    expect(isOtpUsable({ invalidatedAt: null, verifiedAt: null, expiresAt: new Date(now + 1000), attempts: 0, maxAttempts: 5 }, now)).toBe(true);
    expect(isOtpUsable({ invalidatedAt: new Date(), verifiedAt: null, expiresAt: new Date(now + 1000), attempts: 0, maxAttempts: 5 }, now)).toBe(false);
    expect(isOtpUsable({ invalidatedAt: null, verifiedAt: null, expiresAt: new Date(now - 1), attempts: 0, maxAttempts: 5 }, now)).toBe(false);
    expect(isOtpUsable({ invalidatedAt: null, verifiedAt: null, expiresAt: new Date(now + 1000), attempts: 5, maxAttempts: 5 }, now)).toBe(false);
  });
});

describe("Fase 3.1 - expediente y enlaces", () => {
  it("detects expiring links and blocks reminder cooldown", () => {
    const now = Date.now();
    expect(isExpiringWithin(new Date(now + 23 * 3600000), 24, now)).toBe(true);
    expect(isExpiringWithin(new Date(now + 25 * 3600000), 24, now)).toBe(false);
    expect(isReminderAllowed(new Date(now - 5 * 3600000), 4, now)).toBe(true);
    expect(isReminderAllowed(new Date(now - 2 * 3600000), 4, now)).toBe(false);
    expect(communicationAuditAction("reminder", "not_configured")).toBe("candidate_reminder_not_configured");
  });
  it("creates a ZIP with the normalized document entries", async () => {
    const archive = await createZipArchive([{ name: "cedula.pdf", bytes: new TextEncoder().encode("%PDF-demo") }, { name: "foto.png", bytes: new Uint8Array([137, 80, 78, 71]) }]);
    expect(archive.length).toBeGreaterThan(40);
  });
  it("distinguishes active, revoked and expired links", () => {
    const now = Date.now();
    expect(isLinkUsable("active", new Date(now + 1000), now)).toBe(true);
    expect(isLinkUsable("revoked", new Date(now + 1000), now)).toBe(false);
    expect(isLinkUsable("active", new Date(now - 1000), now)).toBe(false);
  });
});

describe("Fase 3.1 - correo transaccional", () => {
  it("renders candidate, position, company and secure portal URL", () => {
    const email = buildCandidateEmail({ candidate: { fullName: "Ada Lovelace" }, position: { name: "Ingeniera" }, company: { name: "Empresa Demo" } } as never, "https://people.example/candidate/documents/token-demo");
    expect(email.text).toContain("Ada Lovelace");
    expect(email.text).toContain("Ingeniera");
    expect(email.html).toContain("Empresa Demo");
    expect(email.html).toContain("https://people.example/candidate/documents/token-demo");
  });

  it("prepares a mailto draft without sending or requiring a provider", () => {
    const draft = prepareMailtoEmail({ to: "candidate@example.test", subject: "Demo", text: "Hola candidata", html: "<p>Hola candidata</p>" });
    expect(draft.status).toBe("prepared");
    expect(draft.mailtoUrl).toBe(buildMailtoUrl({ to: "candidate@example.test", subject: "Demo", text: "Hola candidata" }));
    expect(decodeURIComponent(draft.mailtoUrl)).toContain("candidate@example.test");
    expect(decodeURIComponent(draft.mailtoUrl.replace(/\+/g, " "))).toContain("Hola candidata");
  });

  it("records manual send separately from draft preparation", () => {
    const now = new Date("2026-08-31T00:00:00Z");
    const record = buildManualCommunicationRecord("reminder", "candidate@example.test", "Recordatorio", now, 4);
    expect(record.status).toBe("sent");
    expect(record.sentAt).toBe(now);
    expect(record.cooldownUntil).toEqual(new Date("2026-08-31T04:00:00Z"));
    expect(manualCommunicationEvents("initial")).toEqual({ activity: "link_sent", audit: "candidate_initial_sent" });
    expect(manualCommunicationEvents("reminder")).toEqual({ activity: "communication_reminder_sent", audit: "candidate_reminder_sent" });
  });

  it("encodes recipient, subject and body safely in mailto", () => {
    const url = buildMailtoUrl({ to: "candidate@example.test", subject: "Documentación & proceso", text: "Línea 1\nLínea 2" });
    expect(url.startsWith("mailto:candidate%40example.test?")).toBe(true);
    expect(decodeURIComponent(url.replace(/\+/g, " "))).toContain("Documentación & proceso");
    expect(decodeURIComponent(url.replace(/\+/g, " "))).toContain("Línea 1\nLínea 2");
  });
});
