import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function unauthenticatedContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("Fase 3.1 tRPC guards", () => {
  it("blocks protected communication, alert and ZIP procedures without a session", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.hiring.prepareEmail({ companyId: 1, processId: 1, portalUrl: "https://people.example/candidate/documents/token-demo" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.hiring.expiringLinks({ companyId: 1, withinHours: 24 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.hiring.downloadZip({ companyId: 1, processId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.hiring.markCommunicationSent({ companyId: 1, processId: 1, type: "initial", portalUrl: "https://people.example/candidate/documents/token-demo" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects malformed public tokens before accessing candidate data", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.candidatePortal.get({ token: "too-short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
