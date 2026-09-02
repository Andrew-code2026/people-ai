import { and, asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { appProfiles, companies, departments, employees, knowledgeBaseDocuments, recruitmentCandidates, type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _migrated = false;

async function ensureSchema(db: ReturnType<typeof drizzle>) {
  if (_migrated) return;
  _migrated = true;
  try {
    try {
      await db.execute(sql`ALTER TABLE \`job_positions\` ADD COLUMN \`templateId\` INT NULL;`);
    } catch {
      // Column might already exist
    }

    try {
      await db.execute(sql`ALTER TABLE \`document_templates\` MODIFY COLUMN \`positionId\` INT NULL;`);
    } catch {
      // positionId modify
    }

    try {
      await db.execute(sql`
        UPDATE \`job_positions\` jp
        JOIN \`document_templates\` dt ON dt.positionId = jp.id AND dt.companyId = jp.companyId AND dt.status = 'active'
        SET jp.templateId = dt.id
        WHERE jp.templateId IS NULL;
      `);
    } catch {
      // ignore
    }

    try {
      // Consolidate duplicate active standard templates per company
      await db.execute(sql`
        UPDATE \`document_templates\` d1
        JOIN \`document_templates\` d2 ON d1.companyId = d2.companyId
          AND d1.name = d2.name
          AND d1.name = 'Expediente de Ingreso Estándar'
          AND d1.status = 'active'
          AND d2.status = 'active'
          AND d1.id > d2.id
        SET d1.status = 'archived';
      `);
    } catch {
      // ignore
    }
  } catch (error) {
    console.warn("[Database] Schema sync notice:", error);
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle({
        connection: {
          uri: process.env.DATABASE_URL,
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
          },
        },
      });
      await ensureSchema(_db);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAppProfile(userId: number, companyId?: number | null) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = companyId == null
    ? eq(appProfiles.userId, userId)
    : and(eq(appProfiles.userId, userId), eq(appProfiles.companyId, companyId));
  const result = await db.select().from(appProfiles).where(conditions).limit(1);
  return result[0];
}

export async function listCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).orderBy(asc(companies.name));
}

export async function listDepartmentsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departments).where(eq(departments.companyId, companyId)).orderBy(asc(departments.name));
}

export async function listRecruitmentByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recruitmentCandidates).where(eq(recruitmentCandidates.companyId, companyId)).orderBy(asc(recruitmentCandidates.updatedAt));
}

export async function listKnowledgeByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeBaseDocuments).where(eq(knowledgeBaseDocuments.companyId, companyId)).orderBy(asc(knowledgeBaseDocuments.title));
}

export async function listEmployeesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(eq(employees.companyId, companyId)).orderBy(asc(employees.lastName));
}
