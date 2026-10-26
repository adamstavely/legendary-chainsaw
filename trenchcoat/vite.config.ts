/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The five libraries, each a folder of self-contained files
export const LIBS = {
  "@components": here("components"),
  "@blocks": here("blocks"),
  "@screens": here("screens"),
  "@illustrations": here("illustrations"),
  "@motion": here("motion"),
};

// Library files import each other as "@/components/ui/<name>" – find <name>.tsx in whichever library has it
function uiAlias(): Plugin {
  return {
    name: "trenchcoat-ui-alias",
    enforce: "pre",
    resolveId(id) {
      const m = id.match(/^@\/components\/ui\/(.+)$/);
      if (!m) return;
      for (const dir of Object.values(LIBS)) {
        const file = join(dir, `${m[1]}.tsx`);
        if (existsSync(file)) return file;
      }
    },
  };
}

export default defineConfig({
  root: here("app"),
  plugins: [uiAlias(), react()],
  resolve: { alias: LIBS },
  server: { port: 5199, fs: { allow: [here(".")] } },
  build: { outDir: here("dist"), emptyOutDir: true },
  test: {
    root: here("."),
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 30_000,
    // Tests that reproduce a missing .catch() raise an unhandled rejection on purpose; they tag it "[expected]"
    onUnhandledError: (error) => (String((error as Error)?.message).includes("[expected]") ? false : undefined),
  },
});
