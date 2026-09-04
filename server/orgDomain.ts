// Invitaciones para unirse a una empresa.
//
// Sin proveedor de correo, la invitacion se entrega como enlace copiable que el
// administrador comparte por su cuenta. Es el mismo mecanismo que ya usan los
// enlaces de candidato (`hrDomain.generateLink`): token aleatorio del que solo se
// guarda el hash, caducidad, y revocacion de los anteriores.

import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { appProfiles, companies, invitations, users, type RoleKey, type User } from "../drizzle/schema";
import { AuthError, MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "./auth";
import { writeAudit } from "./auditLog";
import { getUserByEmail, requireDb } from "./db";

/** Misma duracion que los enlaces de candidato. */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const AUDIT_MODULE = "org";

export const hashInviteToken = (token: string) => createHash("sha256").update(token).digest("hex");

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Vigencia de una invitacion. Se escribe aqui en vez de importar `isLinkUsable` de
 *  `hrDomain`: es una expresion de una linea y este modulo no deberia depender del
 *  de contratacion. */
export const isInviteUsable = (status: string, expiresAt: Date, now = Date.now()) =>
  status === "active" && expiresAt.getTime() >= now;

// ------------------------------------------------------------------- invitar

export type InviteInput = {
  companyId: number;
  email: string;
  role: RoleKey;
  invitedByUserId: number;
};

/** Crea la invitacion y devuelve el token EN CRUDO. Es el unico momento en que
 *  existe: en base de datos solo queda su hash. */
export async function inviteUser(input: InviteInput): Promise<{ token: string; expiresAt: Date }> {
  const email = normalizeEmail(input.email);
  const db = await requireDb();

  // Si ya tiene perfil en esta empresa, invitar no aporta nada y confunde.
  const existing = await getUserByEmail(email);
  if (existing) {
    const profile = (
      await db
        .select()
        .from(appProfiles)
        .where(and(eq(appProfiles.userId, existing.id), eq(appProfiles.companyId, input.companyId)))
        .limit(1)
    )[0];
    if (profile) {
      throw new AuthError("EMAIL_TAKEN", "Esa persona ya pertenece a esta empresa.");
    }
  }

  // Revoca las pendientes previas para este correo y empresa, igual que hace
  // `generateLink`. Es lo que permite recuperarse de "perdi el enlace": basta con
  // volver a invitar.
  await db
    .update(invitations)
    .set({ status: "revoked", revokedAt: new Date() })
    .where(
      and(
        eq(invitations.companyId, input.companyId),
        eq(invitations.email, email),
        eq(invitations.status, "active")
      )
    );

  const token = randomBytes(32).toString("base64url");
  // Una sola vez: `generateLink` lo calcula dos veces y las fechas difieren en ms.
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await db.insert(invitations).values({
    companyId: input.companyId,
    email,
    role: input.role,
    tokenHash: hashInviteToken(token),
    invitedByUserId: input.invitedByUserId,
    expiresAt,
  });

  await writeAudit({
    companyId: input.companyId,
    userId: input.invitedByUserId,
    action: "invitation_created",
    module: AUDIT_MODULE,
    metadata: { email, role: input.role },
  });

  return { token, expiresAt };
}

// ------------------------------------------------------------------ consultar

export type InvitePreview = {
  email: string;
  companyName: string;
  role: RoleKey;
  /** Si ya existe cuenta, al aceptar se pide la contrasena actual en vez de una nueva. */
  userExists: boolean;
};

/** Devuelve `null` indistintamente para inexistente, caducada o revocada, para no
 *  revelar cual es el caso. */
export async function getInvitePreview(token: string): Promise<InvitePreview | null> {
  const db = await requireDb();
  const invite = (
    await db.select().from(invitations).where(eq(invitations.tokenHash, hashInviteToken(token))).limit(1)
  )[0];
  if (!invite || !isInviteUsable(invite.status, invite.expiresAt)) return null;

  const company = (await db.select().from(companies).where(eq(companies.id, invite.companyId)).limit(1))[0];
  if (!company) return null;

  const user = await getUserByEmail(invite.email);
  return {
    email: invite.email,
    companyName: company.name,
    role: invite.role,
    userExists: Boolean(user),
  };
}

// -------------------------------------------------------------------- aceptar

/** Acepta la invitacion y devuelve el usuario resultante, ya con perfil en la
 *  empresa y con esa empresa marcada como activa.
 *
 *  Dos ramas: si no hay cuenta, se crea con la contrasena elegida; si la hay, se
 *  verifica su contrasena actual y solo se adjunta el perfil nuevo. */
export async function acceptInvite(input: { token: string; password: string }): Promise<User> {
  const db = await requireDb();

  const invite = (
    await db.select().from(invitations).where(eq(invitations.tokenHash, hashInviteToken(input.token))).limit(1)
  )[0];
  if (!invite || !isInviteUsable(invite.status, invite.expiresAt)) {
    throw new AuthError("INVALID_CREDENTIALS", "Esta invitacion ya no esta disponible.");
  }

  const existing = await getUserByEmail(invite.email);

  if (!existing && input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      "WEAK_PASSWORD",
      `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    );
  }

  // Cuenta existente: la contrasena actual es la prueba de identidad. El limite de
  // intentos lo aplica la capa de procedures, para que este endpoint no sirva de
  // oraculo de contrasenas.
  if (existing) {
    if (!existing.passwordHash || !(await verifyPassword(existing.passwordHash, input.password))) {
      throw new AuthError("INVALID_CREDENTIALS", "La contrasena no es correcta.");
    }
  }

  const passwordHash = existing ? null : await hashPassword(input.password);

  const user = await db.transaction(async tx => {
    // Cierre condicional: si dos pestanas aceptan a la vez, solo una avanza.
    const closed = await tx
      .update(invitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(and(eq(invitations.id, invite.id), eq(invitations.status, "active")));
    if (Number((closed as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0) === 0) {
      throw new AuthError("INVALID_CREDENTIALS", "Esta invitacion ya no esta disponible.");
    }

    let userId: number;
    if (existing) {
      userId = existing.id;
    } else {
      const created = await tx.insert(users).values({
        openId: `local_${nanoid(21)}`,
        name: invite.email.split("@")[0],
        email: invite.email,
        passwordHash,
        loginMethod: "password",
        role: "user",
      });
      userId = Number(created[0].insertId);
    }

    await tx.insert(appProfiles).values({
      userId,
      companyId: invite.companyId,
      role: invite.role,
      status: "active",
    });

    // La empresa recien aceptada pasa a ser la activa; sin esto, quien ya tenia
    // cuenta seguiria entrando a su empresa anterior y la invitacion no haria nada.
    await tx.update(users).set({ activeCompanyId: invite.companyId }).where(eq(users.id, userId));

    const row = (await tx.select().from(users).where(eq(users.id, userId)).limit(1))[0];
    if (!row) throw new Error("No se pudo leer el usuario tras aceptar la invitacion");
    return row;
  });

  await writeAudit({
    companyId: invite.companyId,
    userId: user.id,
    action: "invitation_accepted",
    module: AUDIT_MODULE,
    metadata: { email: invite.email, role: invite.role, newAccount: !existing },
  });

  return user;
}

// --------------------------------------------------------------- empresa activa

/** Cambia la empresa activa. Valida la pertenencia ANTES de escribir: sin esa
 *  comprobacion cualquiera se asignaria una empresa ajena y `assertCompanyScope` la
 *  daria por buena. */
export async function switchActiveCompany(userId: number, companyId: number): Promise<void> {
  const db = await requireDb();
  const profile = (
    await db
      .select()
      .from(appProfiles)
      .where(and(eq(appProfiles.userId, userId), eq(appProfiles.companyId, companyId)))
      .limit(1)
  )[0];
  if (!profile) {
    throw new AuthError("INVALID_CREDENTIALS", "No perteneces a esa empresa.");
  }
  await db.update(users).set({ activeCompanyId: companyId }).where(eq(users.id, userId));
}
