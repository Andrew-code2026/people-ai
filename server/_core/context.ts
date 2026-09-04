import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authenticateRequest } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // `authenticateRequest` devuelve null cuando no hay sesion valida; la autenticacion
  // es opcional porque las procedures publicas tambien pasan por aqui.
  //
  // Limitacion conocida, heredada de `getUserByOpenId`: si la base de datos no
  // responde, la busqueda devuelve undefined y el usuario queda como no autenticado
  // en vez de propagarse como error de infraestructura. Se conserva ese
  // comportamiento a proposito -- propagarlo haria que toda peticion, incluida la
  // pantalla de login, respondiera 500 durante una caida.
  const user = await authenticateRequest(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
