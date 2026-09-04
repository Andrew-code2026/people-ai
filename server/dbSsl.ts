const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Opciones TLS de la conexion a la base de datos.
 *
 *  TLS estricto contra cualquier host remoto (TiDB Cloud lo exige y ademas es lo
 *  correcto: la cadena de conexion lleva credenciales). Se desactiva unicamente
 *  cuando el host es local, donde un MySQL de desarrollo trae certificados
 *  autofirmados que `rejectUnauthorized: true` rechazaria y el trafico no sale de
 *  la maquina.
 *
 *  Antes estaba fijo en estricto, de modo que la aplicacion no podia ejecutarse
 *  contra ninguna base local. */
export function getDbSsl(connectionString: string) {
  let hostname: string;
  try {
    hostname = new URL(connectionString).hostname;
  } catch {
    // Cadena ilegible: no relajamos la seguridad ante la duda.
    return { minVersion: "TLSv1.2" as const, rejectUnauthorized: true };
  }
  if (LOCAL_HOSTS.has(hostname)) return undefined;
  return { minVersion: "TLSv1.2" as const, rejectUnauthorized: true };
}
