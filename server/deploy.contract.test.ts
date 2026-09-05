// Contrato del build desplegable. No comprueba comportamiento sino la forma del
// codigo, porque lo que protege se puede deshacer sin que nada falle en local:
// el error solo aparece en un contenedor con dependencias de produccion.
// Misma tecnica que `phase4.ui-contract.test.ts`.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), file), "utf8");
const scripts = () =>
  JSON.parse(read("package.json")).scripts as Record<string, string>;

describe("contrato de despliegue", () => {
  it("la entrada de produccion y la fabrica de la app no conocen vite", () => {
    // `index.ts` se empaqueta con esbuild; si alguna de estas dos importara
    // `./vite`, el bundle volveria a arrastrar devDependencies. La entrada de
    // desarrollo es `dev.ts` y es la unica que debe tocar Vite.
    for (const file of ["server/_core/index.ts", "server/_core/app.ts"]) {
      const source = read(file);
      expect(source, file).not.toMatch(/from ["']\.\/vite["']/);
      expect(source, file).not.toMatch(/from ["']vite["']/);
      expect(source, file).not.toMatch(/import\(["']\.\/vite["']\)/);
    }
  });

  it("start no depende de cross-env, que es devDependency", () => {
    expect(scripts().start).toBe("node dist/index.js");
  });

  it("build fija NODE_ENV=production para no empaquetar React de desarrollo", () => {
    expect(scripts().build).toContain("NODE_ENV=production");
  });
});
