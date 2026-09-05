// Entrada de DESARROLLO: `pnpm dev` la ejecuta con `tsx watch`. Nunca pasa por
// esbuild ni llega a `dist/`.
//
// Es la unica que conoce Vite (`setupVite` monta el dev server en middleware con
// HMR) y la unica con escaneo de puertos: en local es comodo que, si el 3000
// esta ocupado, arranque en el siguiente. En produccion eso era un bug (la
// plataforma publica un solo puerto), asi que alli vive `resolvePort` en
// `index.ts` y aqui vive esto. Ver `index.ts` para el porque de la separacion.
//
// `dotenv/config` debe ser el PRIMER import: `env.ts` lee `process.env` al cargar
// y ESM evalua los imports en orden de aparicion.
import "dotenv/config";
import net from "net";
import { createApp } from "./app";
import { setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function main() {
  const { app, server } = createApp();

  // El comodin del SPA va en ultimo lugar: `setupVite` cierra con `app.use("*")`.
  await setupVite(app, server);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

main().catch(error => {
  console.error("[Arranque] El servidor de desarrollo no pudo iniciar:", error);
  process.exit(1);
});
