import { afterEach, describe, expect, it, vi } from "vitest";
import { communicationAuditAction, createZipArchive, buildCandidateEmail, hashOtp, isExpiringWithin, isLinkUsable, isOtpUsable, isReminderAllowed } from "./hrDomain";
import { isEmailProviderConfigured, sendTransactionalEmail } from "./emailService";

afterEach(() => { delete process.env.RESEND_API_KEY; delete process.env.RESEND_FROM_EMAIL; delete process.env.PUBLIC_APP_URL; vi.restoreAllMocks(); });

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

  it("sends through the configured provider contract with a mocked transport", async () => {
    process.env.RESEND_API_KEY = "test-key"; process.env.RESEND_FROM_EMAIL = "hr@example.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email-demo-1" }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const result = await sendTransactionalEmail({ to: "candidate@example.test", subject: "Demo", text: "Demo", html: "<p>Demo</p>" });
    expect(result).toEqual({ status: "sent", providerMessageId: "email-demo-1" });
    expect(fetch).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST" }));
  });

  it("reports no configurado and never pretends to send without provider credentials", async () => {
    expect(isEmailProviderConfigured()).toBe(false);
    const result = await sendTransactionalEmail({ to: "candidate@example.test", subject: "Demo", text: "Demo", html: "<p>Demo</p>" });
    expect(result).toEqual({ status: "not_configured", errorMessage: "RESEND_API_KEY y RESEND_FROM_EMAIL no están configuradas." });
  });
});
