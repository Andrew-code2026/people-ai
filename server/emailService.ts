export type EmailPayload = { to: string; subject: string; html: string; text: string };
export type EmailResult = { status: "sent" | "error" | "not_configured"; providerMessageId?: string; errorMessage?: string };

export interface TransactionalEmailProvider { send(payload: EmailPayload): Promise<EmailResult>; }

export class ResendEmailProvider implements TransactionalEmailProvider {
  constructor(private readonly apiKey: string, private readonly from: string) {}
  async send(payload: EmailPayload): Promise<EmailResult> {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: this.from, to: [payload.to], subject: payload.subject, html: payload.html, text: payload.text }) });
    const data = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok) return { status: "error", errorMessage: data.message || `Email provider returned ${response.status}` };
    return { status: "sent", providerMessageId: data.id };
  }
}

export function isEmailProviderConfigured() { return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL); }

export function getEmailProvider(): TransactionalEmailProvider | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  return apiKey && from ? new ResendEmailProvider(apiKey, from) : null;
}

export async function sendTransactionalEmail(payload: EmailPayload): Promise<EmailResult> {
  const provider = getEmailProvider();
  if (!provider) return { status: "not_configured", errorMessage: "RESEND_API_KEY y RESEND_FROM_EMAIL no están configuradas." };
  try { return await provider.send(payload); } catch (error) { return { status: "error", errorMessage: error instanceof Error ? error.message : "Error desconocido del proveedor" }; }
}
