import { afterEach, describe, expect, it, vi } from "vitest";
import { hashToken, markCommunicationSent, prepareCandidateEmail, prepareCandidateReminder } from "./hrDomain";
import { getDb } from "./db";

vi.mock("./db", () => ({ getDb: vi.fn() }));

const dbMock = vi.mocked(getDb);
const token = "token-demo";

function createFakeDb() {
  const selectResults: unknown[][] = [];
  const inserts: Array<{ values: Record<string, unknown> }> = [];
  const enqueue = (...results: unknown[][]) => selectResults.push(...results);
  const db = {
    select: () => {
      const chain: Record<string, (...args: unknown[]) => unknown> = {};
      const resolve = () => Promise.resolve(selectResults.shift() ?? []);
      chain.from = () => chain;
      chain.where = () => chain;
      chain.orderBy = () => chain;
      chain.limit = () => resolve();
      chain.then = (resolveValue: unknown, rejectValue?: unknown) => resolve().then(resolveValue as never, rejectValue as never);
      return chain;
    },
    insert: () => ({ values: async (values: Record<string, unknown>) => { inserts.push({ values }); } }),
  };
  return { db, enqueue, inserts };
}

function queueHiringDetail(fake: ReturnType<typeof createFakeDb>) {
  const process = { id: 1, companyId: 4, candidateId: 8, positionId: 9, status: "pending" };
  const candidate = { id: 8, companyId: 4, fullName: "Ada Lovelace", email: "ada@example.test" };
  const position = { id: 9, companyId: 4, name: "Ingeniera" };
  const company = { id: 4, name: "Empresa Demo" };
  fake.enqueue([process], [candidate], [position], [company], [], []);
  fake.enqueue([{ id: 10, companyId: 4, processId: 1, status: "active", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600000) }]);
  fake.enqueue([]);
}

afterEach(() => vi.clearAllMocks());

describe("Fase 3.1 - dominio mailto", () => {
  it("prepara el correo sin insertar comunicación, actividad ni auditoría", async () => {
    const fake = createFakeDb();
    queueHiringDetail(fake);
    dbMock.mockResolvedValue(fake.db as never);

    const result = await prepareCandidateEmail(4, 1, 77, `https://people.example/candidate/documents/${token}`);

    expect(result.status).toBe("prepared");
    expect(result.mailtoUrl).toContain("mailto:");
    expect(fake.inserts).toHaveLength(0);
  });

  it("prepara un recordatorio sin insertar comunicación, actividad ni auditoría", async () => {
    const fake = createFakeDb();
    queueHiringDetail(fake);
    dbMock.mockResolvedValue(fake.db as never);

    const result = await prepareCandidateReminder(4, 1, 77, `https://people.example/candidate/documents/${token}`);

    expect(result.status).toBe("prepared");
    expect(result.type).toBe("reminder");
    expect(fake.inserts).toHaveLength(0);
  });

  it("registra envío manual con actor en comunicación, actividad y auditoría", async () => {
    const fake = createFakeDb();
    queueHiringDetail(fake);
    dbMock.mockResolvedValue(fake.db as never);

    const { markCommunicationSent } = await import("./hrDomain");
    const result = await markCommunicationSent(4, 1, 77, "initial", `https://people.example/candidate/documents/${token}`);

    expect(result.status).toBe("sent");
    expect(fake.inserts).toHaveLength(3);
    expect(fake.inserts[0]?.values).toMatchObject({ companyId: 4, processId: 1, userId: 77, status: "sent", recipient: "ada@example.test" });
    expect(fake.inserts[1]?.values).toMatchObject({ companyId: 4, processId: 1, actorType: "analyst", actorUserId: 77, type: "link_sent" });
    expect(fake.inserts[2]?.values).toMatchObject({ companyId: 4, userId: 77, action: "candidate_initial_sent", result: "success" });
  });
});
