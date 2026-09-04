import { auditLogs } from "../drizzle/schema";
import { getDb } from "./db";

/** Registro de auditoria para cualquier modulo.
 *
 *  `hrDomain.ts` tiene su propio `audit` privado que fija `module: "hiring"`; este
 *  existe para el resto de modulos. No se unifican para no remover codigo que
 *  funciona sin necesidad.
 *
 *  No lanza si la base no responde: perder una linea de auditoria no debe tumbar la
 *  operacion que la genero. */
export async function writeAudit(entry: {
  companyId: number | null;
  userId?: number | null;
  action: string;
  module: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    companyId: entry.companyId,
    userId: entry.userId ?? null,
    action: entry.action,
    module: entry.module,
    result: "success",
    metadata: JSON.stringify(entry.metadata ?? {}),
  });
}
