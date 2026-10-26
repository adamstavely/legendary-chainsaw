// The package build (remediation plan 2.4, started with the pilot): ES modules, one per element, into dist/elements.
// Lit stays external – apps get one copy – and so does React, which only the react entry uses.
import { defineConfig } from "vite";
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
      entry: {
        index: here("src/elements/index.ts"),
        button: here("src/elements/button.ts"),
        combobox: here("src/elements/combobox.ts"),
        "data-table": here("src/elements/data-table.ts"),
        "look-provider": here("src/elements/internal/look.ts"),
        react: here("src/elements/react.ts"),
      },
    },
    rollupOptions: {
      external: [/^lit($|\/)/, /^@lit\//, "react", "react-dom", "react/jsx-runtime"],
      output: { preserveModules: true, preserveModulesRoot: here("src"), entryFileNames: "[name].js" },
    },
  },
});
