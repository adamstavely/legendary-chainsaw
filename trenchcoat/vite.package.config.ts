// The package build (remediation plan 2.4, started with the pilot): ES modules, one per element, into dist/elements.
// Lit stays external – apps get one copy – and so does React, which only the react entry uses.
import { defineConfig } from "vite";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  publicDir: false,
  // Standard decorators are lowered here: rollup can't parse them, and no browser ships them yet
  esbuild: { target: "es2022" },
  build: {
    outDir: here("dist"),
    emptyOutDir: true,
    target: "es2022",
    minify: false,
    sourcemap: true,
    lib: {
      formats: ["es"],
      // Every element module (src/elements/<slug>.ts) is an entry, with the index, the React wrappers, the provider and
      // trenchcoat/generative
      entry: {
        // iCloud's "<name> 2.ts" copies (the repo lives under ~/Documents) aren't elements
        ...Object.fromEntries(
          readdirSync(here("src/elements"))
            .filter((f) => f.endsWith(".ts") && !/ \d+\.ts$/.test(f))
            .map((f) => [f.slice(0, -3), here(`src/elements/${f}`)]),
        ),
        "look-provider": here("src/elements/internal/look.ts"),
        // What an app needs to let a model place components: the catalogue, schemas, tools and checks
        generative: here("src/generative/index.ts"),
      },
    },
    rollupOptions: {
      external: [/^lit($|\/)/, /^@lit\//, "react", "react-dom", "react/jsx-runtime"],
      output: { preserveModules: true, preserveModulesRoot: here("src"), entryFileNames: "[name].js" },
    },
  },
});
