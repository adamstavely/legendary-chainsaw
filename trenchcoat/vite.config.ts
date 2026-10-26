/// <reference types="vitest/config" />
import { defineConfig, transformWithEsbuild, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The five libraries. Components have one source in src/components (both looks, `look` picks one)
export const LIBS = {
  "@components": here("src/components"),
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

/*
 * Clean twins, only while the React components are being ported to Lit (remediation plan, Part 2). Tests and the
 * gallery's Clean stage load "@components/<slug>-clean": the same source with Clean as its default look, made here
 * in memory – nothing is published or written to disk. "virtual:tc-clean" maps every slug to its loader.
 */
const CLEAN = "\0tc-clean:";
const SRC = here("src/components");
function cleanTwins(): Plugin {
  const slugs = () => readdirSync(SRC).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4));
  return {
    name: "trenchcoat-clean-twins",
    enforce: "pre",
    resolveId(id) {
      if (id === "virtual:tc-clean") return "\0virtual:tc-clean";
      // "@components/<slug>-clean", before or after the @components alias has made it a path into src/components
      const m = id.match(/^@components\/(.+)-clean$/) ?? (id.startsWith(`${SRC}/`) ? id.slice(SRC.length + 1).match(/^(.+)-clean$/) : null);
      if (m && existsSync(join(SRC, `${m[1]}.tsx`))) return `${CLEAN}${m[1]}`;
    },
    async load(id) {
      if (id === "\0virtual:tc-clean")
        return `export default {\n${slugs()
          .map((s) => `  ${JSON.stringify(s)}: () => import(${JSON.stringify(`@components/${s}-clean`)}),`)
          .join("\n")}\n};`;
      if (!id.startsWith(CLEAN)) return;
      const slug = id.slice(CLEAN.length);
      const source = readFileSync(join(SRC, `${slug}.tsx`), "utf8")
        .replace(/const DEFAULT_LOOK: Look = "standard";/, 'const DEFAULT_LOOK: Look = "clean";')
        .replace(/from "\.\.\/internal\//g, `from "${here("src/internal")}/`);
      const { code } = await transformWithEsbuild(source, `${slug}-clean.tsx`, { loader: "tsx", jsx: "automatic", sourcemap: "inline" });
      return code;
    },
  };
}

export default defineConfig({
  root: here("app"),
  plugins: [cleanTwins(), uiAlias(), react()],
  resolve: { alias: LIBS },
  server: { port: 5199, fs: { allow: [here(".")] } },
  build: { outDir: here("dist"), emptyOutDir: true },
  test: {
    root: here("."),
    testTimeout: 30_000,
    // Tests that reproduce a missing .catch() raise an unhandled rejection on purpose; they tag it "[expected]"
    onUnhandledError: (error) => (String((error as Error)?.message).includes("[expected]") ? false : undefined),
    projects: [
      // The React components, in jsdom
      {
        extends: true,
        test: { name: "react", environment: "jsdom", include: ["tests/**/*.test.{ts,tsx}"], exclude: ["tests/elements/**"], setupFiles: ["tests/setup.ts"] },
      },
      // The Lit elements, in real browsers (decision L12): Chromium, Firefox and WebKit through Playwright
      {
        extends: true,
        test: {
          name: "elements",
          include: ["tests/elements/**/*.test.ts"],
          setupFiles: ["tests/elements/setup.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
          },
        },
      },
    ],
  },
});
