// Servido de la SPA ya construida. Vive aparte de `vite.ts` a proposito.
//
// Antes `serveStatic` y `setupVite` compartian archivo, y como `vite.ts` importa
// `vite` y `../../vite.config` en el nivel superior, el bundle de produccion
// arrastraba vite, @vitejs/plugin-react, @tailwindcss/vite, jsx-loc y el runtime
// de Manus: todas devDependencies. Con un `pnpm install --prod` el arranque moria
// en ERR_MODULE_NOT_FOUND. Este archivo solo usa express/fs/path y es el unico
// de los dos que entra en el bundle de produccion.
//
// OJO con `import.meta.dirname`: resuelve rutas relativas a ESTE archivo. En el
// bundle (`dist/index.js`) apunta a `dist/`, y bajo tsx apunta a `server/_core/`;
// las dos ramas de `distPath` dependen de esa profundidad. No mover este archivo
// a otro nivel del arbol sin ajustar los `..`.
import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Vite nombra todo lo que deja en `assets/` con un hash de contenido
  // (`index-BZZtyvdB.js`): si el contenido cambia, cambia el nombre. Por eso es
  // correcto decirle al navegador que lo guarde un ano y no vuelva a preguntar.
  // Antes se servia con `max-age=0` y cada visita volvia a bajar ~2 MB, lo que
  // con el arranque en frio del plan gratuito convertia "lento una vez" en
  // "lento siempre".
  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    })
  );
  // `index: false`: que `express.static` no sirva `index.html` en `/`, para que
  // caiga al comodin de abajo y salga sin cache. El HTML no lleva hash y es lo
  // unico que debe refrescarse en cada despliegue.
  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
