import { defineConfig } from "vite";

// The tree-shaking build: shake.js imports trenchcoat/button only; scripts/examples.mjs reads the output
export default defineConfig({
  build: { outDir: "dist-shake", minify: false, rollupOptions: { input: "shake.js", output: { entryFileNames: "shake.js" } } },
});
