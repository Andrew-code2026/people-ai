export const ENV = {
  /** Secreto HMAC de las sesiones. Obligatorio: `assertAuthEnvReady()` aborta el
   *  arranque si falta o es corto, porque firmar con "" permitiria forjar sesiones. */
  cookieSecret: process.env.JWT_SECRET ?? "",
  /** Almacenamiento de documentos (Forge / S3). */
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
