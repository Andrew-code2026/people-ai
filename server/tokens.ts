import { createHash } from "node:crypto";

/** Enlaces opacos con token: portal de candidato e invitaciones de empresa.
 *
 *  Vive aparte de ambos dominios a proposito. `orgDomain` no deberia depender de
 *  `hrDomain`, pero copiar estas dos funciones tampoco valia: son identicas y
 *  cualquier cambio futuro -pasar a HMAC con secreto de servidor, o dar margen de
 *  gracia a la caducidad- tiene que aplicarse a los dos usos a la vez. */

/** Solo se persiste el hash; el token en crudo existe una unica vez, al generarlo. */
export const hashOpaqueToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** `now` es inyectable para poder probar la caducidad sin depender del reloj. */
export const isTokenUsable = (status: string, expiresAt: Date, now = Date.now()) =>
  status === "active" && expiresAt.getTime() >= now;
