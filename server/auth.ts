// Autenticacion local con correo y contrasena.
//
// Toda la identidad de la aplicacion pasa por este modulo y por una unica clave,
// `users.openId`. Nada aguas abajo (app_profiles, resolveAccess, assertRole, las
// procedures) sabe como se autentico el usuario, asi que cambiar el proveedor de
// identidad mas adelante se reduce a reescribir `authenticateRequest` y a poblar
// `openId` con el id del nuevo proveedor.

import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { eq, sql } from "drizzle-orm";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { appProfiles, companies, users, type User } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getUserByEmail, getUserById, getUserByOpenId, requireDb } from "./db";

/** Duracion de la sesion. Corta a proposito: el JWT no tiene estado y solo se
 *  revoca por `sessionVersion`, asi que un token robado no debe vivir un ano. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const MIN_PASSWORD_LENGTH = 8;
const MIN_SECRET_LENGTH = 32;

/** Mensaje unico para correo inexistente y contrasena incorrecta: distinguirlos
 *  permitiria enumerar que correos estan registrados. */
const CREDENTIALS_MSG = "Correo o contrasena incorrectos.";

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_TAKEN"
  | "COMPANY_TAKEN"
  | "RATE_LIMITED"
  | "WEAK_PASSWORD";

/** Error de dominio. `routers.ts` lo traduce a TRPCError; este modulo no conoce tRPC. */
export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Proyeccion segura para enviar al navegador.
 *
 *  `ctx.user` es la fila completa de `users` porque el servidor necesita `id`,
 *  `role`, `sessionVersion` y `activeCompanyId`. Nada de eso debe cruzar la red:
 *  `passwordHash` es un secreto, y `sessionVersion` y `activeCompanyId` son
 *  maquinaria interna. La empresa del usuario viaja por `access.me`. */
export type PublicUser = Omit<User, "passwordHash" | "sessionVersion" | "activeCompanyId">;

export function toPublicUser(user: User): PublicUser {
  const {
    passwordHash: _passwordHash,
    sessionVersion: _sessionVersion,
    activeCompanyId: _activeCompanyId,
    ...safe
  } = user;
  return safe;
}

// ---------------------------------------------------------------- entorno

/** Falla al arrancar si el secreto de firma no sirve. Sin esto, `JWT_SECRET`
 *  ausente deja ENV.cookieSecret en "" y cualquiera puede forjar una sesion
 *  para cualquier openId. */
/** Valores de marcador que llegaron a estar en el repositorio. Cumplen la longitud
 *  minima pero son publicos, asi que permitirlos deja firmar sesiones a cualquiera
 *  que haya visto el codigo. */
const SECRETOS_PROHIBIDOS = new Set(["super_secret_local_jwt_key_123456"]);

export function assertAuthEnvReady(): void {
  const secret = ENV.cookieSecret;
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET debe existir y tener al menos ${MIN_SECRET_LENGTH} caracteres. ` +
        "Genera uno con: openssl rand -hex 32"
    );
  }
  if (SECRETOS_PROHIBIDOS.has(secret)) {
    throw new Error(
      "JWT_SECRET es el valor de ejemplo que esta publicado en el repositorio. " +
        "Cualquiera podria falsificar sesiones con el. Genera uno propio con: openssl rand -hex 32"
    );
  }
}

function getSessionSecret(): Uint8Array {
  assertAuthEnvReady();
  return new TextEncoder().encode(ENV.cookieSecret);
}

// -------------------------------------------------------------- contrasenas

export function hashPassword(plain: string): Promise<string> {
  return argonHash(plain);
}

/** Devuelve false ante un hash corrupto en vez de propagar, para que una fila
 *  danada sea un fallo de login y no un 500. */
export function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  return argonVerify(storedHash, plain).catch(() => false);
}

/** Hash senuelo para gastar el mismo tiempo cuando el correo no existe. Se calcula
 *  una sola vez y de forma perezosa para no penalizar el arranque. */
let dummyHash: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHash) dummyHash = argonHash(nanoid(32));
  return dummyHash;
}

async function burnTimingBudget(candidate: string): Promise<void> {
  await argonVerify(await getDummyHash(), candidate).catch(() => false);
}

// ----------------------------------------------------------------- sesion

export type SessionPayload = { openId: string; sessionVersion: number };

export async function signSession(
  payload: SessionPayload,
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const expiresInMs = options.expiresInMs ?? SESSION_TTL_MS;
  return new SignJWT({ openId: payload.openId, sessionVersion: payload.sessionVersion })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + expiresInMs) / 1000))
    .sign(getSessionSecret());
}

/** Verificacion pura del JWT: no toca la base de datos, de ahi que se pueda probar
 *  aislada. La comparacion de `sessionVersion` vive en `authenticateRequest`, que
 *  ya carga el usuario. */
export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
    const { openId, sessionVersion } = payload as Record<string, unknown>;
    if (typeof openId !== "string" || openId.length === 0) return null;
    if (typeof sessionVersion !== "number") return null;
    return { openId, sessionVersion };
  } catch {
    return null;
  }
}

function readSessionToken(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (header) {
    const fromCookie = parseCookieHeader(header)[COOKIE_NAME];
    if (fromCookie) return fromCookie;
  }
  // Respaldo para navegadores que bloquean cookies de terceros (Safari ITP, WebView).
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return undefined;
}

/** Resuelve el usuario de una peticion, o null si no hay sesion valida. No escribe
 *  en la base de datos: `lastSignedIn` se actualiza en `signIn`, no en cada peticion. */
export async function authenticateRequest(req: Request): Promise<User | null> {
  const session = await verifySession(readSessionToken(req));
  if (!session) return null;

  const user = await getUserByOpenId(session.openId);
  if (!user) return null;

  // Revocacion: cambiar la contrasena incrementa el contador e invalida lo ya emitido.
  if (user.sessionVersion !== session.sessionVersion) return null;

  return user;
}

// ------------------------------------------------------------ limite de intentos

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

/** Purga las entradas vencidas para que el Map no crezca sin limite. */
function purgeExpiredAttempts(now: number): void {
  attempts.forEach((entry, key) => {
    if (entry.resetAt <= now) attempts.delete(key);
  });
}

export function assertNotRateLimited(key: string): void {
  const now = Date.now();
  purgeExpiredAttempts(now);
  const entry = attempts.get(key);
  if (entry && entry.count >= MAX_ATTEMPTS) {
    const minutes = Math.ceil((entry.resetAt - now) / 60000);
    throw new AuthError(
      "RATE_LIMITED",
      `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} minuto(s).`
    );
  }
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

/** Solo para pruebas: reinicia el contador en memoria. */
export function resetRateLimiterForTests(): void {
  attempts.clear();
}

// ------------------------------------------------------------------ flujos

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isDuplicateKeyError(error: unknown, index: string): boolean {
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message ?? "";
  return (code === "ER_DUP_ENTRY" || /duplicate entry/i.test(message)) && message.includes(index);
}

export type SignUpInput = {
  email: string;
  password: string;
  name: string;
  companyName: string;
};

/** Alta del administrador de una empresa: crea usuario, empresa y perfil
 *  COMPANY_ADMIN en una sola transaccion, para que un fallo a medias no deje un
 *  usuario huerfano sin empresa ni perfil. */
export async function signUp(input: SignUpInput): Promise<{ user: User; companyId: number }> {
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      "WEAK_PASSWORD",
      `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    );
  }

  const email = normalizeEmail(input.email);
  const companyName = input.companyName.trim();
  const name = input.name.trim();
  const db = await requireDb();

  if (await getUserByEmail(email)) {
    throw new AuthError("EMAIL_TAKEN", "Ya existe una cuenta con ese correo.");
  }

  const passwordHash = await hashPassword(input.password);
  const openId = `local_${nanoid(21)}`;

  try {
    return await db.transaction(async tx => {
      const userResult = await tx.insert(users).values({
        openId,
        name,
        email,
        passwordHash,
        loginMethod: "password",
        // SUPER_ADMIN nunca se otorga en el alta: los roles viven en app_profiles.
        role: "user",
      });
      const userId = Number(userResult[0].insertId);

      const companyResult = await tx.insert(companies).values({
        name: companyName,
        legalName: companyName,
      });
      const companyId = Number(companyResult[0].insertId);

      await tx.insert(appProfiles).values({
        userId,
        companyId,
        role: "COMPANY_ADMIN",
        status: "active",
      });

      // La empresa recien creada queda como activa, para que `resolveAccess` no
      // tenga que adivinarla cuando el usuario pertenezca a varias.
      await tx.update(users).set({ activeCompanyId: companyId }).where(eq(users.id, userId));

      const created = (await tx.select().from(users).where(eq(users.id, userId)).limit(1))[0];
      if (!created) throw new Error("No se pudo leer el usuario recien creado");
      return { user: created, companyId };
    });
  } catch (error) {
    // La condicion de carrera real la corta el indice unico, no la comprobacion previa.
    if (isDuplicateKeyError(error, "users_email_idx")) {
      throw new AuthError("EMAIL_TAKEN", "Ya existe una cuenta con ese correo.");
    }
    if (isDuplicateKeyError(error, "companies_name_idx")) {
      throw new AuthError("COMPANY_TAKEN", "Ya existe una empresa registrada con ese nombre.");
    }
    throw error;
  }
}

export async function signIn(input: {
  email: string;
  password: string;
  rateLimitKey?: string;
}): Promise<{ user: User; token: string }> {
  const email = normalizeEmail(input.email);
  const key = input.rateLimitKey ?? email;
  assertNotRateLimited(key);

  const user = await getUserByEmail(email);

  // `passwordHash` nulo = cuenta que no entra por contrasena (demo / OAuth heredado).
  if (!user || !user.passwordHash) {
    await burnTimingBudget(input.password);
    recordFailedAttempt(key);
    throw new AuthError("INVALID_CREDENTIALS", CREDENTIALS_MSG);
  }

  if (!(await verifyPassword(user.passwordHash, input.password))) {
    recordFailedAttempt(key);
    throw new AuthError("INVALID_CREDENTIALS", CREDENTIALS_MSG);
  }

  clearAttempts(key);
  await touchLastSignedIn(user.id);

  const token = await signSession({
    openId: user.openId,
    sessionVersion: user.sessionVersion,
  });
  return { user, token };
}

/** Cambiar la contrasena incrementa `sessionVersion`, lo que invalida toda sesion
 *  ya emitida para el usuario. Sustituye al restablecimiento por correo mientras no
 *  haya proveedor de correo configurado. */
export async function changePassword(input: {
  userId: number;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      "WEAK_PASSWORD",
      `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    );
  }

  const user = await getUserById(input.userId);
  if (!user || !user.passwordHash) {
    throw new AuthError("INVALID_CREDENTIALS", CREDENTIALS_MSG);
  }
  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw new AuthError("INVALID_CREDENTIALS", "La contrasena actual no es correcta.");
  }

  const db = await requireDb();
  const passwordHash = await hashPassword(input.newPassword);
  await db
    .update(users)
    .set({ passwordHash, sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, input.userId));
}

async function touchLastSignedIn(userId: number): Promise<void> {
  const db = await requireDb();
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}
