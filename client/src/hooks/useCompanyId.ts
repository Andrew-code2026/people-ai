import { trpc } from "@/lib/trpc";

/** Empresa activa del usuario, resuelta desde el servidor.
 *
 *  Varias paginas fijaban `const companyId = 4` (la empresa de los datos de
 *  demostracion). Con registro real eso pide siempre datos de una empresa ajena y
 *  el servidor responde FORBIDDEN por `assertCompanyScope`.
 *
 *  `ready` es false mientras se resuelve el perfil: las consultas que reciben
 *  `companyId` deben ir con `enabled: ready`, porque el esquema zod exige un entero
 *  positivo y dispararlas con 0 seria un error de validacion. */
export function useCompanyId() {
  const access = trpc.access.me.useQuery(undefined, { retry: false });
  const companyId = access.data?.companyId ?? 0;
  return {
    companyId,
    ready: companyId > 0,
    isLoading: access.isLoading,
    error: access.error ?? null,
  };
}
