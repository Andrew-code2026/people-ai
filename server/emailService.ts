export type EmailPayload = { to: string; subject: string; html: string; text: string };
export type MailtoDraft = EmailPayload & { status: "prepared"; mailtoUrl: string };

/** Contrato local: prepara un correo para que la analista lo revise y lo envíe desde su cliente. */
export interface EmailComposer { compose(payload: EmailPayload): MailtoDraft; }

function encode(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

export function buildMailtoUrl(payload: Pick<EmailPayload, "to" | "subject" | "text">) {
  return `mailto:${encode(payload.to)}?subject=${encode(payload.subject)}&body=${encode(payload.text)}`;
}

export class MailtoEmailComposer implements EmailComposer {
  compose(payload: EmailPayload): MailtoDraft {
    return { ...payload, status: "prepared", mailtoUrl: buildMailtoUrl(payload) };
  }
}

export function prepareMailtoEmail(payload: EmailPayload): MailtoDraft {
  return new MailtoEmailComposer().compose(payload);
}

/** Compatibilidad de dominio: ya no realiza envíos y no consulta ningún proveedor externo. */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<MailtoDraft> {
  return prepareMailtoEmail(payload);
}
