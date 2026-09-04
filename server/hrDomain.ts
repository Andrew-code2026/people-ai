import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { aiConversationMessages, auditLogs, candidateAccessLinks, candidateDocuments, candidateProfiles, candidateOtpChallenges, companies, communicationLogs, companyCommunicationSettings, documentTemplateItems, documentTemplates, hiringProcesses, hiringRequirements, internalNotifications, jobPositions, processActivities } from "../drizzle/schema";
import { getDb } from "./db";
import { hashOpaqueToken, isTokenUsable } from "./tokens";
import { storageGetSignedUrl, storagePut } from "./storage";
import { prepareMailtoEmail } from "./emailService";
import JSZip from "jszip";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MIME_EXTENSIONS: Record<string, string[]> = { "application/pdf": ["pdf"], "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"] };
/** Reexportado desde `./tokens`, compartido con las invitaciones de empresa. */
export const hashToken = hashOpaqueToken;
export const hashOtp = (code: string) => createHash("sha256").update(code).digest("hex");
export const isOtpUsable = (challenge: { invalidatedAt: Date | null; verifiedAt: Date | null; expiresAt: Date; attempts: number; maxAttempts: number }, now = Date.now()) => !challenge.invalidatedAt && !challenge.verifiedAt && challenge.expiresAt.getTime() >= now && challenge.attempts < challenge.maxAttempts;
export const isReminderAllowed = (lastSentAt: Date | null | undefined, cooldownHours: number, now = Date.now()) => !lastSentAt || lastSentAt.getTime() + Math.max(1, cooldownHours) * 3600000 <= now;
export const isExpiringWithin = (expiresAt: Date, withinHours: number, now = Date.now()) => expiresAt.getTime() >= now && expiresAt.getTime() <= now + Math.max(1, withinHours) * 3600000;
export const communicationAuditAction = (type: "initial" | "reminder", outcome: "sent" | "error" | "not_configured") => `candidate_${type}_${outcome}`;
export const isLinkUsable = isTokenUsable;
export const getMissingRequirements = (requirements: Array<{ required: boolean; status: string }>) => requirements.filter(req => req.required && !["uploaded", "replaced", "verified"].includes(req.status));
export const normalize = (title: string, original: string) => `${title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").trim()}.${original.split(".").pop()?.toLowerCase() || "bin"}`;
export const hasMagicSignature = (bytes: Uint8Array, mimeType: string) => { if (mimeType === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-"; if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff; if (mimeType === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]); return false; };
export const isValidUpload = (originalName: string, mimeType: string, sizeBytes: number, bytes?: Uint8Array) => { const extension = originalName.split(".").pop()?.toLowerCase() || ""; return ALLOWED_MIME_TYPES.has(mimeType) && Boolean(MIME_EXTENSIONS[mimeType]?.includes(extension)) && sizeBytes <= MAX_FILE_BYTES && (!bytes || hasMagicSignature(bytes, mimeType)); };
async function audit(companyId: number, action: string, metadata: Record<string, unknown>, userId?: number) { const db = await getDb(); if (db) await db.insert(auditLogs).values({ companyId, userId, action, module: "hiring", result: "success", metadata: JSON.stringify(metadata) }); }
async function activity(companyId: number, processId: number, type: string, actorType: "analyst" | "candidate" | "system", actorUserId?: number, metadata: Record<string, unknown> = {}) { const db = await getDb(); if (db) await db.insert(processActivities).values({ companyId, processId, actorType, actorUserId, type, metadata: JSON.stringify(metadata) }); }
const escapeHtml = (value: string) => value.replace(/[&<>\"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[char] || char);
const emailSubject = "Documentación requerida para tu proceso de contratación";
export const buildCandidateEmail = (detail: NonNullable<Awaited<ReturnType<typeof getHiringDetail>>>, portalUrl: string, reminder = false) => { const candidate = escapeHtml(detail.candidate?.fullName || "candidato"); const position = escapeHtml(detail.position?.name || "tu cargo"); const company = escapeHtml(detail.company?.name || "la empresa"); const intro = reminder ? "Te recordamos que todavía tienes documentos pendientes de cargar para completar tu proceso de contratación." : `Nos encontramos adelantando tu proceso de contratación para el cargo de ${position}.`; const text = `Hola ${candidate},\\n\\n${intro}\\n\\nCompleta tu documentación aquí: ${portalUrl}\\n\\nGracias,\\nEquipo de Talento Humano.`; return { subject: reminder ? "Recordatorio: documentación pendiente" : emailSubject, text, html: `<p>Hola ${candidate},</p><p>${intro}</p><p>Empresa: ${company}</p><p><a href=\"${escapeHtml(portalUrl)}\">Completar documentación</a></p><p>Gracias,<br>Equipo de Talento Humano.</p>` }; };

export const DEFAULT_TEMPLATE_NAME = "Expediente de Ingreso Estándar";

export const DEFAULT_STANDARD_DOCUMENTS = [
  { title: "Cédula de Ciudadanía (150%)", description: "Copia legible por ambas caras en PDF", required: true, sortOrder: 1 },
  { title: "Hoja de Vida Actualizada", description: "Formato PDF con datos de contacto", required: true, sortOrder: 2 },
  { title: "Certificado de Afiliación EPS", description: "No mayor a 30 días de expedición", required: true, sortOrder: 3 },
  { title: "Certificado de Fondo de Pensiones", description: "No mayor a 30 días de expedición", required: true, sortOrder: 4 },
  { title: "Certificaciones Académicas", description: "Títulos profesionales, actas de grado y certificaciones", required: false, sortOrder: 5 },
  { title: "Examen Médico de Ingreso", description: "Concepto de aptitud laboral emitido por IPS autorizada", required: true, sortOrder: 6 },
];

export async function listPositions(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  const positions = await db.select().from(jobPositions).where(and(eq(jobPositions.companyId, companyId), eq(jobPositions.status, "active"))).orderBy(asc(jobPositions.name));
  
  const allTemplates = await db.select().from(documentTemplates).where(and(eq(documentTemplates.companyId, companyId), eq(documentTemplates.status, "active")));
  const standardTemplate = allTemplates.find(t => t.name === DEFAULT_TEMPLATE_NAME);

  return positions.map(pos => {
    let resolvedTemplateId = pos.templateId;
    if (!resolvedTemplateId || !allTemplates.some(t => t.id === resolvedTemplateId)) {
      const matchByPosition = allTemplates.find(t => t.positionId === pos.id);
      if (matchByPosition) {
        resolvedTemplateId = matchByPosition.id;
      } else if (standardTemplate) {
        resolvedTemplateId = standardTemplate.id;
      }
    }
    return {
      ...pos,
      templateId: resolvedTemplateId ?? null,
    };
  });
}

export async function createPosition(companyId: number, name: string, description?: string, templateId?: number, userId?: number) {
  const db = await getDb();
  if (!db) return 999;
  
  let initialTemplateId = templateId;
  if (!initialTemplateId) {
    const standard = (await db.select().from(documentTemplates).where(and(
      eq(documentTemplates.companyId, companyId),
      eq(documentTemplates.name, DEFAULT_TEMPLATE_NAME),
      eq(documentTemplates.status, "active")
    )).limit(1))[0];
    if (standard) {
      initialTemplateId = standard.id;
    }
  }

  const result = await db.insert(jobPositions).values({
    companyId,
    name,
    description: description || null,
    templateId: initialTemplateId || null,
  });
  const id = Number(result[0].insertId);
  await audit(companyId, "job_position_created", { id, name, templateId: initialTemplateId }, userId);
  return id;
}

export async function assignTemplateToPosition(companyId: number, positionId: number, templateId: number, userId?: number) {
  const db = await getDb();
  if (!db) return { success: true, positionId, templateId };
  const position = (await db.select().from(jobPositions).where(and(eq(jobPositions.id, positionId), eq(jobPositions.companyId, companyId))).limit(1))[0];
  if (!position) throw new Error("Cargo no encontrado");
  
  const template = (await db.select().from(documentTemplates).where(and(eq(documentTemplates.id, templateId), eq(documentTemplates.companyId, companyId), eq(documentTemplates.status, "active"))).limit(1))[0];
  if (!template) throw new Error("Plantilla no encontrada");

  await db.update(jobPositions).set({ templateId, updatedAt: new Date() }).where(and(eq(jobPositions.companyId, companyId), eq(jobPositions.id, positionId)));
  await audit(companyId, "position_template_assigned", { positionId, templateId, templateName: template.name }, userId);
  return { success: true, positionId, templateId };
}

export async function deletePosition(companyId: number, positionId: number, userId?: number) {
  const db = await getDb();
  if (!db) return { success: true, id: positionId };
  const position = (await db.select().from(jobPositions).where(and(eq(jobPositions.id, positionId), eq(jobPositions.companyId, companyId))).limit(1))[0];
  if (!position) throw new Error("Cargo no encontrado");
  await db.update(jobPositions).set({ status: "archived", updatedAt: new Date() }).where(and(eq(jobPositions.companyId, companyId), eq(jobPositions.id, positionId)));
  await audit(companyId, "job_position_deleted", { positionId, name: position.name }, userId);
  return { success: true, id: positionId };
}
export async function listTemplates(companyId: number) { const db = await getDb(); if (!db) return []; return db.select().from(documentTemplates).where(and(eq(documentTemplates.companyId, companyId), eq(documentTemplates.status, "active"))).orderBy(desc(documentTemplates.updatedAt)); }
export async function getTemplate(companyId: number, templateId: number) { const db = await getDb(); if (!db) return null; const template = (await db.select().from(documentTemplates).where(and(eq(documentTemplates.companyId, companyId), eq(documentTemplates.id, templateId))).limit(1))[0]; if (!template) return null; const items = await db.select().from(documentTemplateItems).where(and(eq(documentTemplateItems.companyId, companyId), eq(documentTemplateItems.templateId, templateId))).orderBy(asc(documentTemplateItems.sortOrder)); return { ...template, items }; }
export async function createTemplate(companyId: number, name: string, items: Array<{ title: string; description?: string; required: boolean; sortOrder: number }>, positionId?: number, userId?: number) {
  const db = await getDb();
  if (!db) {
    return {
      id: 999,
      companyId,
      positionId: positionId || null,
      name,
      status: "active" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: items.map((it, idx) => ({
        id: idx + 1,
        companyId,
        templateId: 999,
        title: it.title,
        description: it.description || null,
        required: it.required,
        sortOrder: it.sortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
  }
  const result = await db.insert(documentTemplates).values({ companyId, positionId: positionId || null, name });
  const templateId = Number(result[0].insertId);
  if (items.length) {
    await db.insert(documentTemplateItems).values(items.map(item => ({ ...item, companyId, templateId })));
  }
  if (positionId) {
    await db.update(jobPositions).set({ templateId, updatedAt: new Date() }).where(and(eq(jobPositions.companyId, companyId), eq(jobPositions.id, positionId)));
  }
  await audit(companyId, "document_template_created", { templateId, positionId, name }, userId);
  return getTemplate(companyId, templateId);
}
export async function updateTemplate(companyId: number, templateId: number, items: Array<{ title: string; description?: string; required: boolean; sortOrder: number }>, userId?: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const template = await getTemplate(companyId, templateId); if (!template) throw new Error("Template not found"); await db.delete(documentTemplateItems).where(and(eq(documentTemplateItems.companyId, companyId), eq(documentTemplateItems.templateId, templateId))); if (items.length) await db.insert(documentTemplateItems).values(items.map(item => ({ ...item, companyId, templateId }))); await audit(companyId, "document_template_updated", { templateId }, userId); return getTemplate(companyId, templateId); }
export async function getMasterStandardTemplate(companyId: number) {
  const db = await getDb();
  if (!db) return { items: DEFAULT_STANDARD_DOCUMENTS };
  
  const standardTemplate = (await db.select().from(documentTemplates).where(and(
    eq(documentTemplates.companyId, companyId),
    eq(documentTemplates.name, DEFAULT_TEMPLATE_NAME),
    eq(documentTemplates.status, "active")
  )).orderBy(desc(documentTemplates.updatedAt)).limit(1))[0];

  if (!standardTemplate) {
    return { items: DEFAULT_STANDARD_DOCUMENTS };
  }

  const items = await db.select().from(documentTemplateItems).where(and(
    eq(documentTemplateItems.companyId, companyId),
    eq(documentTemplateItems.templateId, standardTemplate.id)
  )).orderBy(asc(documentTemplateItems.sortOrder));

  return {
    items: items.length > 0 ? items.map((i) => ({
      title: i.title,
      description: i.description || undefined,
      required: i.required,
      sortOrder: i.sortOrder,
    })) : DEFAULT_STANDARD_DOCUMENTS
  };
}

export async function updateMasterStandardTemplate(
  companyId: number,
  items: Array<{ title: string; description?: string; required: boolean; sortOrder: number }>,
  applyToAllPositions = true,
  userId?: number
) {
  const db = await getDb();
  if (!db) {
    return {
      items: items.map((item, idx) => ({
        ...item,
        sortOrder: idx + 1,
      })),
    };
  }

  const standardTemplates = await db.select().from(documentTemplates).where(and(
    eq(documentTemplates.companyId, companyId),
    eq(documentTemplates.name, DEFAULT_TEMPLATE_NAME),
    eq(documentTemplates.status, "active")
  ));

  if (standardTemplates.length > 0) {
    const targetTemplates = applyToAllPositions ? standardTemplates : [standardTemplates[0]];
    for (const t of targetTemplates) {
      await db.delete(documentTemplateItems).where(and(
        eq(documentTemplateItems.companyId, companyId),
        eq(documentTemplateItems.templateId, t.id)
      ));
      if (items.length) {
        await db.insert(documentTemplateItems).values(
          items.map((item, idx) => ({ ...item, sortOrder: idx + 1, companyId, templateId: t.id }))
        );
      }
      await db.update(documentTemplates).set({ updatedAt: new Date() }).where(eq(documentTemplates.id, t.id));
    }
  } else {
    const res = await db.insert(documentTemplates).values({
      companyId,
      positionId: null,
      name: DEFAULT_TEMPLATE_NAME,
      status: "active"
    });
    const tId = Number(res[0].insertId);
    if (items.length) {
      await db.insert(documentTemplateItems).values(
        items.map((item, idx) => ({ ...item, sortOrder: idx + 1, companyId, templateId: tId }))
      );
    }
  }

  await audit(companyId, "master_standard_template_updated", { count: items.length, applyToAllPositions }, userId);
  return getMasterStandardTemplate(companyId);
}

export async function assignDefaultTemplate(companyId: number, positionId: number, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const position = (await db.select().from(jobPositions).where(and(eq(jobPositions.id, positionId), eq(jobPositions.companyId, companyId))).limit(1))[0];
  if (!position) throw new Error("Cargo no encontrado");

  const master = await getMasterStandardTemplate(companyId);
  const itemsToAssign = master.items.length > 0 ? master.items : DEFAULT_STANDARD_DOCUMENTS;

  let template = (await db.select().from(documentTemplates).where(and(
    eq(documentTemplates.companyId, companyId),
    eq(documentTemplates.name, DEFAULT_TEMPLATE_NAME),
    eq(documentTemplates.status, "active")
  )).limit(1))[0];

  if (!template) {
    const result = await db.insert(documentTemplates).values({
      companyId,
      positionId: null,
      name: DEFAULT_TEMPLATE_NAME,
      status: "active"
    });
    const templateId = Number(result[0].insertId);
    await db.insert(documentTemplateItems).values(
      itemsToAssign.map((item, idx) => ({ ...item, sortOrder: idx + 1, companyId, templateId }))
    );
    template = (await db.select().from(documentTemplates).where(eq(documentTemplates.id, templateId)).limit(1))[0];
  }

  await db.update(jobPositions).set({ templateId: template.id, updatedAt: new Date() }).where(and(eq(jobPositions.companyId, companyId), eq(jobPositions.id, positionId)));
  await audit(companyId, "document_template_default_assigned", { templateId: template.id, positionId }, userId);
  return getTemplate(companyId, template.id);
}
export async function updateTemplateName(companyId: number, templateId: number, name: string, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(documentTemplates).set({ name, updatedAt: new Date() }).where(and(eq(documentTemplates.companyId, companyId), eq(documentTemplates.id, templateId)));
  await audit(companyId, "document_template_name_updated", { templateId, name }, userId);
  return getTemplate(companyId, templateId);
}
export async function deleteTemplate(companyId: number, templateId: number, userId?: number) {
  const db = await getDb();
  if (!db) return { success: true, id: templateId };
  const template = await getTemplate(companyId, templateId);
  if (!template) throw new Error("Plantilla no encontrada");
  if (template.name === DEFAULT_TEMPLATE_NAME) {
    throw new Error("No se puede eliminar la plantilla estándar principal de la empresa");
  }
  await db.update(documentTemplates).set({ status: "archived", updatedAt: new Date() }).where(and(eq(documentTemplates.companyId, companyId), eq(documentTemplates.id, templateId)));
  
  const standardTemplate = (await db.select().from(documentTemplates).where(and(
    eq(documentTemplates.companyId, companyId),
    eq(documentTemplates.name, DEFAULT_TEMPLATE_NAME),
    eq(documentTemplates.status, "active")
  )).limit(1))[0];

  if (standardTemplate) {
    await db.update(jobPositions).set({ templateId: standardTemplate.id, updatedAt: new Date() }).where(and(
      eq(jobPositions.companyId, companyId),
      eq(jobPositions.templateId, templateId)
    ));
  }

  await audit(companyId, "document_template_deleted", { templateId, name: template.name }, userId);
  return { success: true, id: templateId };
}
export async function listHiring(companyId: number) { const db = await getDb(); if (!db) return []; const processes = await db.select().from(hiringProcesses).where(eq(hiringProcesses.companyId, companyId)).orderBy(desc(hiringProcesses.createdAt)); return Promise.all(processes.map(async process => { const detail = await getHiringDetail(companyId, process.id); return { ...process, candidateName: detail?.candidate?.fullName || "Candidato", positionName: detail?.position?.name || "Cargo", requiredCount: detail?.requirements.filter(r => r.required).length || 0, receivedCount: detail?.requirements.filter(r => ["uploaded", "replaced", "verified"].includes(r.status)).length || 0 }; })); }
export async function createHiring(companyId: number, userId: number, input: { fullName: string; identificationNumber: string; email: string; positionId: number; templateId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const template = await getTemplate(companyId, input.templateId);
  if (!template || template.companyId !== companyId) throw new Error("Plantilla no encontrada");
  const position = (await db.select().from(jobPositions).where(and(eq(jobPositions.id, input.positionId), eq(jobPositions.companyId, companyId))).limit(1))[0];
  if (!position) throw new Error("Cargo no encontrado");
  const candidateResult = await db.insert(candidateProfiles).values({ companyId, fullName: input.fullName, identificationNumber: input.identificationNumber, email: input.email });
  const candidateId = Number(candidateResult[0].insertId);
  const processResult = await db.insert(hiringProcesses).values({ companyId, candidateId, positionId: input.positionId, templateId: input.templateId, createdByUserId: userId, status: "pending" });
  const processId = Number(processResult[0].insertId);
  await db.insert(hiringRequirements).values(template.items.map(item => ({ companyId, processId, sourceTemplateItemId: item.id, title: item.title, description: item.description, required: item.required, sortOrder: item.sortOrder })));
  await audit(companyId, "hiring_process_created", { processId, candidateId }, userId);
  return getHiringDetail(companyId, processId);
}
export async function getHiringDetail(companyId: number, processId: number) { const db = await getDb(); if (!db) return null; const process = (await db.select().from(hiringProcesses).where(and(eq(hiringProcesses.companyId, companyId), eq(hiringProcesses.id, processId))).limit(1))[0]; if (!process) return null; const candidate = (await db.select().from(candidateProfiles).where(and(eq(candidateProfiles.companyId, companyId), eq(candidateProfiles.id, process.candidateId))).limit(1))[0]; const position = (await db.select().from(jobPositions).where(and(eq(jobPositions.companyId, companyId), eq(jobPositions.id, process.positionId))).limit(1))[0]; const company = (await db.select().from(companies).where(eq(companies.id, companyId)).limit(1))[0]; const requirements = await db.select().from(hiringRequirements).where(and(eq(hiringRequirements.companyId, companyId), eq(hiringRequirements.processId, processId))).orderBy(asc(hiringRequirements.sortOrder)); const documents = await db.select().from(candidateDocuments).where(and(eq(candidateDocuments.companyId, companyId), eq(candidateDocuments.processId, processId), eq(candidateDocuments.status, "active"))); return { process, candidate, position, company, requirements, documents }; }
export async function updateRequirement(companyId: number, processId: number, requirementId: number, patch: { title?: string; required?: boolean; status?: "pending" | "uploaded" | "replaced" | "removed" | "verified" }, userId?: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(hiringRequirements).set(patch).where(and(eq(hiringRequirements.companyId, companyId), eq(hiringRequirements.processId, processId), eq(hiringRequirements.id, requirementId))); await audit(companyId, "hiring_requirement_updated", { processId, requirementId }, userId); return getHiringDetail(companyId, processId); }
export async function generateLink(companyId: number, processId: number, userId?: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const detail = await getHiringDetail(companyId, processId); if (!detail) throw new Error("Hiring process not found"); await db.update(candidateAccessLinks).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(candidateAccessLinks.companyId, companyId), eq(candidateAccessLinks.processId, processId), eq(candidateAccessLinks.status, "active"))); const token = randomBytes(32).toString("base64url"); await db.insert(candidateAccessLinks).values({ companyId, processId, candidateId: detail.process.candidateId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 7 * 86400000) }); await audit(companyId, "candidate_link_generated", { processId }, userId); await activity(companyId, processId, "link_generated", "analyst", userId); return { token, expiresAt: new Date(Date.now() + 7 * 86400000) }; }
export async function getPortal(token: string, recordActivity = true) { const db = await getDb(); if (!db) return null; const link = (await db.select().from(candidateAccessLinks).where(eq(candidateAccessLinks.tokenHash, hashToken(token))).limit(1))[0]; if (!link) return null; if (!isLinkUsable(link.status, link.expiresAt)) { if (link.status === "active" && link.expiresAt.getTime() < Date.now()) { await audit(link.companyId, "candidate_link_expired", { processId: link.processId, linkId: link.id }); await activity(link.companyId, link.processId, "link_expired", "system", undefined, { linkId: link.id }); } return null; } await db.update(candidateAccessLinks).set({ lastUsedAt: new Date() }).where(eq(candidateAccessLinks.id, link.id)); const detail = await getHiringDetail(link.companyId, link.processId); if (detail && recordActivity) { await activity(link.companyId, link.processId, "link_opened", "candidate"); await audit(link.companyId, "candidate_link_opened", { processId: link.processId, linkId: link.id }); } return detail ? { ...detail, linkId: link.id, expiresAt: link.expiresAt } : null; }
export async function uploadPortalDocument(token: string, requirementId: number, originalName: string, mimeType: string, bytes: Uint8Array) { if (!isValidUpload(originalName, mimeType, bytes.byteLength, bytes)) throw new Error("Archivo inválido: formato, contenido o tamaño no permitido"); const portal = await getPortal(token, false); if (!portal) throw new Error("Enlace no disponible"); const requirement = portal.requirements.find(item => item.id === requirementId); if (!requirement) throw new Error("Requisito no encontrado"); const normalizedName = normalize(requirement.title, originalName); const key = `candidate-documents/${portal.process.companyId}/${portal.process.id}/${requirement.id}-${randomBytes(12).toString("hex")}-${normalizedName}`; const stored = await storagePut(key, Buffer.from(bytes), mimeType); const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(candidateDocuments).set({ status: "removed" }).where(and(eq(candidateDocuments.companyId, portal.process.companyId), eq(candidateDocuments.requirementId, requirementId), eq(candidateDocuments.processId, portal.process.id), eq(candidateDocuments.status, "active"))); await db.insert(candidateDocuments).values({ companyId: portal.process.companyId, processId: portal.process.id, requirementId, originalName, normalizedName, fileKey: stored.key, mimeType, sizeBytes: bytes.byteLength }); await db.update(hiringRequirements).set({ status: "uploaded" }).where(and(eq(hiringRequirements.companyId, portal.process.companyId), eq(hiringRequirements.id, requirementId))); await audit(portal.process.companyId, "candidate_document_uploaded", { processId: portal.process.id, requirementId, normalizedName }); await activity(portal.process.companyId, portal.process.id, "document_uploaded", "candidate", undefined, { requirementId }); return getPortal(token); }
export async function removePortalDocument(token: string, requirementId: number) { const portal = await getPortal(token, false); if (!portal) throw new Error("Enlace no disponible"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(candidateDocuments).set({ status: "removed" }).where(and(eq(candidateDocuments.companyId, portal.process.companyId), eq(candidateDocuments.processId, portal.process.id), eq(candidateDocuments.requirementId, requirementId), eq(candidateDocuments.status, "active"))); await db.update(hiringRequirements).set({ status: "removed" }).where(and(eq(hiringRequirements.companyId, portal.process.companyId), eq(hiringRequirements.processId, portal.process.id), eq(hiringRequirements.id, requirementId))); await audit(portal.process.companyId, "candidate_document_removed", { processId: portal.process.id, requirementId }); await activity(portal.process.companyId, portal.process.id, "document_removed", "candidate", undefined, { requirementId }); return getPortal(token); }
export async function listNotifications(companyId: number, recipientUserId: number) { const db = await getDb(); if (!db) return []; return db.select().from(internalNotifications).where(and(eq(internalNotifications.companyId, companyId), eq(internalNotifications.recipientUserId, recipientUserId))).orderBy(desc(internalNotifications.createdAt)); }
export async function getDocumentUrl(companyId: number, processId: number, documentId: number) { const db = await getDb(); if (!db) return null; const document = (await db.select().from(candidateDocuments).where(and(eq(candidateDocuments.companyId, companyId), eq(candidateDocuments.processId, processId), eq(candidateDocuments.id, documentId), eq(candidateDocuments.status, "active"))).limit(1))[0]; return document ? storageGetSignedUrl(document.fileKey) : null; }
export async function submitPortal(token: string) { const portal = await getPortal(token, false); if (!portal) throw new Error("Enlace no disponible"); const missing = getMissingRequirements(portal.requirements); if (missing.length) throw new Error(`Faltan ${missing.length} documentos obligatorios`); const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(hiringProcesses).set({ status: "in_review" }).where(and(eq(hiringProcesses.companyId, portal.process.companyId), eq(hiringProcesses.id, portal.process.id))); await activity(portal.process.companyId, portal.process.id, "documentation_complete", "candidate"); await db.update(candidateAccessLinks).set({ status: "completed" }).where(eq(candidateAccessLinks.id, portal.linkId)); await db.insert(internalNotifications).values({ companyId: portal.process.companyId, recipientUserId: portal.process.createdByUserId, processId: portal.process.id, type: "candidate_submission_sent", title: `${portal.candidate?.fullName || "El candidato"} completó su documentación.` }); await audit(portal.process.companyId, "candidate_submission_sent", { processId: portal.process.id }); await activity(portal.process.companyId, portal.process.id, "documentation_submitted", "candidate"); return getPortal(token); }

export async function requestCandidateOtp(token: string) { const portal = await getPortal(token); if (!portal) throw new Error("Enlace no disponible"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(candidateOtpChallenges).set({ invalidatedAt: new Date() }).where(and(eq(candidateOtpChallenges.companyId, portal.process.companyId), eq(candidateOtpChallenges.processId, portal.process.id))); const expiresAt = new Date(Date.now() + 10 * 60 * 1000); const code = String((randomBytes(4).readUInt32BE(0) % 900000) + 100000); await db.insert(candidateOtpChallenges).values({ companyId: portal.process.companyId, processId: portal.process.id, codeHash: hashOtp(code), expiresAt, maxAttempts: 5 }); await audit(portal.process.companyId, "candidate_otp_requested", { processId: portal.process.id, delivery: "provider_pending" }); return { status: "not_configured" as const, expiresAt, message: "OTP preparado, pero requiere un proveedor de correo o SMS configurado." }; }
export async function verifyCandidateOtp(token: string, code: string) { const portal = await getPortal(token); if (!portal) return { verified: false, reason: "link_unavailable" as const }; const db = await getDb(); if (!db) throw new Error("Database unavailable"); const challenge = (await db.select().from(candidateOtpChallenges).where(and(eq(candidateOtpChallenges.companyId, portal.process.companyId), eq(candidateOtpChallenges.processId, portal.process.id))).orderBy(desc(candidateOtpChallenges.createdAt)).limit(1))[0]; if (!challenge || !isOtpUsable(challenge)) return { verified: false, reason: "expired_or_invalid" as const }; if (challenge.codeHash !== hashOtp(code)) { await db.update(candidateOtpChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(candidateOtpChallenges.id, challenge.id)); return { verified: false, reason: "incorrect" as const }; } await db.update(candidateOtpChallenges).set({ verifiedAt: new Date() }).where(eq(candidateOtpChallenges.id, challenge.id)); await audit(portal.process.companyId, "candidate_otp_verified", { processId: portal.process.id }); return { verified: true as const }; }

export async function listCommunications(companyId: number, processId: number) { const db = await getDb(); if (!db) return []; return db.select().from(communicationLogs).where(and(eq(communicationLogs.companyId, companyId), eq(communicationLogs.processId, processId))).orderBy(desc(communicationLogs.createdAt)); }
export async function listActivities(companyId: number, processId: number) { const db = await getDb(); if (!db) return []; return db.select().from(processActivities).where(and(eq(processActivities.companyId, companyId), eq(processActivities.processId, processId))).orderBy(desc(processActivities.createdAt)); }
export async function getLinkState(companyId: number, processId: number) { const db = await getDb(); if (!db) return null; const link = (await db.select().from(candidateAccessLinks).where(and(eq(candidateAccessLinks.companyId, companyId), eq(candidateAccessLinks.processId, processId))).orderBy(desc(candidateAccessLinks.createdAt)).limit(1))[0]; if (!link) return null; const status = link.status === "active" && link.expiresAt.getTime() < Date.now() ? "expired" : link.status; return { id: link.id, status, createdAt: link.createdAt, expiresAt: link.expiresAt, lastUsedAt: link.lastUsedAt }; }
export async function listExpiringLinks(companyId: number, withinHours = 24) { const db = await getDb(); if (!db) return []; const now = new Date(); const links = await db.select().from(candidateAccessLinks).where(and(eq(candidateAccessLinks.companyId, companyId), eq(candidateAccessLinks.status, "active"))); const expiring = links.filter(link => isExpiringWithin(link.expiresAt, withinHours, now.getTime())); return Promise.all(expiring.map(async link => { const detail = await getHiringDetail(companyId, link.processId); return { id: link.id, companyId: link.companyId, processId: link.processId, status: link.status, createdAt: link.createdAt, expiresAt: link.expiresAt, lastUsedAt: link.lastUsedAt, candidateName: detail?.candidate?.fullName || "Candidato", processStatus: detail?.process.status || "pending" }; })); }
export async function revokeLink(companyId: number, processId: number, userId: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(candidateAccessLinks).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(candidateAccessLinks.companyId, companyId), eq(candidateAccessLinks.processId, processId), eq(candidateAccessLinks.status, "active"))); await audit(companyId, "candidate_link_revoked", { processId }, userId); await activity(companyId, processId, "link_revoked", "analyst", userId); return getLinkState(companyId, processId); }
async function assertActivePortalUrl(db: Awaited<ReturnType<typeof getDb>>, companyId: number, processId: number, portalUrl: string) { const parsed = new URL(portalUrl); const parts = parsed.pathname.split("/").filter(Boolean); const token = parts[parts.length - 1]; if (parts.length !== 3 || parts[0] !== "candidate" || parts[1] !== "documents" || !token) throw new Error("Enlace de portal inválido"); const link = (await db!.select().from(candidateAccessLinks).where(and(eq(candidateAccessLinks.companyId, companyId), eq(candidateAccessLinks.processId, processId), eq(candidateAccessLinks.status, "active"))).limit(1))[0]; if (!link || link.tokenHash !== hashToken(decodeURIComponent(token)) || !isLinkUsable(link.status, link.expiresAt)) throw new Error("El enlace de portal ya no está activo"); return link; }
async function prepareProcessCommunication(companyId: number, processId: number, userId: number, type: "initial" | "reminder", portalUrl: string) { const detail = await getHiringDetail(companyId, processId); if (!detail?.candidate?.email) throw new Error("El candidato no tiene correo"); const parsed = new URL(portalUrl); if (!parsed.pathname.startsWith("/candidate/documents/")) throw new Error("Enlace de portal inválido"); const cooldownHours = Math.max(1, Number(process.env.REMINDER_COOLDOWN_HOURS || 4)); const db = await getDb(); if (!db) throw new Error("Database unavailable"); await assertActivePortalUrl(db, companyId, processId, portalUrl); const recent = (await db.select().from(communicationLogs).where(and(eq(communicationLogs.companyId, companyId), eq(communicationLogs.processId, processId), eq(communicationLogs.type, type), eq(communicationLogs.status, "sent"))).orderBy(desc(communicationLogs.createdAt)).limit(1))[0]; if (type === "reminder" && !isReminderAllowed(recent?.sentAt, cooldownHours)) throw new Error("No puedes enviar otro recordatorio todavía"); const message = buildCandidateEmail(detail, portalUrl, type === "reminder"); const draft = prepareMailtoEmail({ to: detail.candidate.email, subject: message.subject, html: message.html, text: message.text }); return { ...draft, type, portalUrl, candidateName: detail.candidate.fullName, positionName: detail.position?.name, companyName: detail.company?.name }; }
export const buildManualCommunicationRecord = (type: "initial" | "reminder", recipient: string, subject: string, now: Date, cooldownHours: number) => ({ type, recipient, subject, status: "sent" as const, sentAt: now, cooldownUntil: type === "reminder" ? new Date(now.getTime() + Math.max(1, cooldownHours) * 3600000) : null });
export const manualCommunicationEvents = (type: "initial" | "reminder") => ({ activity: type === "reminder" ? "communication_reminder_sent" : "link_sent", audit: communicationAuditAction(type, "sent") });
export async function markCommunicationSent(companyId: number, processId: number, userId: number, type: "initial" | "reminder", portalUrl: string) { const detail = await getHiringDetail(companyId, processId); if (!detail?.candidate?.email) throw new Error("El candidato no tiene correo"); const parsed = new URL(portalUrl); if (!parsed.pathname.startsWith("/candidate/documents/")) throw new Error("Enlace de portal inválido"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); await assertActivePortalUrl(db, companyId, processId, portalUrl); const now = new Date(); const cooldownHours = Math.max(1, Number(process.env.REMINDER_COOLDOWN_HOURS || 4)); const subject = type === "reminder" ? "Recordatorio: documentación pendiente" : "Documentación requerida para tu proceso de contratación"; const record = buildManualCommunicationRecord(type, detail.candidate.email, subject, now, cooldownHours); const events = manualCommunicationEvents(type); await db.insert(communicationLogs).values({ companyId, processId, userId, ...record }); await activity(companyId, processId, events.activity, "analyst", userId, { portalUrl }); await audit(companyId, events.audit, { processId, recipient: detail.candidate.email, portalUrl }, userId); return { status: "sent" as const, recordedAt: now }; }
export const prepareCandidateEmail = (companyId: number, processId: number, userId: number, portalUrl: string) => prepareProcessCommunication(companyId, processId, userId, "initial", portalUrl);
export const prepareCandidateReminder = (companyId: number, processId: number, userId: number, portalUrl: string) => prepareProcessCommunication(companyId, processId, userId, "reminder", portalUrl);

export async function createZipArchive(files: Array<{ name: string; bytes: Uint8Array }>) { const zip = new JSZip(); for (const file of files) zip.file(file.name, file.bytes); return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }); }
export async function downloadHiringZip(companyId: number, processId: number, userId: number) { const detail = await getHiringDetail(companyId, processId); if (!detail) throw new Error("Hiring process not found"); const files: Array<{ name: string; bytes: Uint8Array }> = []; for (const document of detail.documents) { const signedUrl = await storageGetSignedUrl(document.fileKey); const response = await fetch(signedUrl); if (!response.ok) throw new Error(`No se pudo descargar ${document.normalizedName}`); files.push({ name: document.normalizedName, bytes: new Uint8Array(await response.arrayBuffer()) }); } const archive = await createZipArchive(files); await audit(companyId, "hiring_archive_downloaded", { processId, documentCount: detail.documents.length }, userId); await activity(companyId, processId, "archive_downloaded", "analyst", userId, { documentCount: detail.documents.length }); return { filename: `${(detail.candidate?.fullName || "candidato").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, "_")}_expediente.zip`, base64: archive.toString("base64"), documentCount: detail.documents.length }; }

export async function getDashboardStats(companyId: number) {
  const db = await getDb();
  if (!db) return { totalProcesses: 0, pendingDocuments: 0, completeProcesses: 0, assistantQueries: 0 };
  const processes = await listHiring(companyId);
  const totalProcesses = processes.length;
  const pendingDocuments = processes.reduce((sum, p) => sum + Math.max(0, p.requiredCount - p.receivedCount), 0);
  const completeProcesses = processes.filter(p => p.status === "complete" || (p.requiredCount > 0 && p.receivedCount >= p.requiredCount)).length;

  let assistantQueries = 0;
  try {
    const messages = await db.select().from(aiConversationMessages).where(and(eq(aiConversationMessages.companyId, companyId), eq(aiConversationMessages.role, "user")));
    assistantQueries = messages.length;
  } catch {
    assistantQueries = 0;
  }

  return {
    totalProcesses,
    pendingDocuments,
    completeProcesses,
    assistantQueries,
  };
}
