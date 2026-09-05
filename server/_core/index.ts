// Entrada de PRODUCCION. `pnpm build` empaqueta este archivo con esbuild y
// `pnpm start` lo ejecuta desde `dist/index.js`.
//
// Lo que este archivo NO importa es tan importante como lo que importa: aqui no
// hay rastro de `./vite`. Antes una sola entrada servia para desarrollo y
// produccion, y el bundle arrastraba vite y sus plugins (devDependencies) aunque
// en produccion nunca se ejecutaran, porque los imports ESM estaticos se evaluan
// al cargar. Ahora la entrada de desarrollo es `dev.ts` y esta no puede llegar
// a Vite por construccion: lo garantiza el grafo de modulos, no un `if`.
//
// `dotenv/config` debe ser el PRIMER import: `env.ts` lee `process.env` al cargar
// y ESM evalua los imports en orden de aparicion.
import "dotenv/config";
import { createApp } from "./app";
import { serveStatic } from "./static";

/** Puerto de escucha en produccion: `PORT` al pie de la letra.
 *
 *  La plataforma publica un unico puerto. Antes el arranque escaneaba 3000-3019 y
 *  si el pedido estaba ocupado se movia al siguiente, con lo que el proceso
 *  quedaba "vivo" y a la vez inalcanzable. Y `parseInt` de un valor no numerico
 *  daba NaN, que `listen` interpretaba como "cualquier puerto libre". Aqui un
 *  `PORT` invalido es un error de arranque, que es lo que debe ser. Sin `PORT`
 *  se usa 3000 para poder probar el bundle en local sin mas ceremonia. */
function resolvePort(): number {
  const raw = process.env.PORT;
  if (raw === undefined || raw === "") return 3000;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `PORT invalido: ${JSON.stringify(raw)}. Debe ser un entero entre 1 y 65535.`
    );
  }
  return port;
}

async function main() {
  const { app, server } = createApp();

  // El comodin del SPA va en ultimo lugar: cierra con `app.use("*")`.
  serveStatic(app);

  const port = resolvePort();
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Cierre ordenado. La plataforma manda SIGTERM en cada despliegue y antes de
  // dormir el servicio; sin esto Node terminaba en el acto y una mutacion en
  // vuelo se cortaba a medias, dejando al cliente sin saber si se escribio.
  // `server.close()` deja de aceptar conexiones y espera a las que hay; el
  // temporizador con `unref()` evita quedarse colgado si alguna no termina, y
  // al estar desreferenciado no mantiene vivo el proceso por si solo.
  const cerrar = (senal: NodeJS.Signals) => {
    console.log(`[Apagado] ${senal} recibido, cerrando el servidor.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on("SIGTERM", cerrar);
  process.on("SIGINT", cerrar);
}

main().catch(error => {
  // Salir con codigo distinto de 0. Antes era `.catch(console.error)`: si
  // `assertAuthEnvReady()` lanzaba por falta de JWT_SECRET no quedaba nada en el
  // bucle de eventos y Node terminaba con codigo 0, que la plataforma leia como
  // una parada limpia en vez de como un despliegue fallido.
  console.error("[Arranque] El servidor no pudo iniciar:", error);
  process.exit(1);
});
