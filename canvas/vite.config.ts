/// <reference types="vitest/config" />
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";
import { trenchcoat } from "./plugins/trenchcoat";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const TRENCHCOAT = here("../trenchcoat");

export default defineConfig({
  // tc-* are Trenchcoat's custom elements, not Vue components
  plugins: [trenchcoat(TRENCHCOAT), vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("tc-") } } })],
  // Trenchcoat's elements import Lit; dedupe makes them share the app's copy (the same versions Trenchcoat pins)
  resolve: { alias: { "~tc": TRENCHCOAT }, dedupe: ["lit", "lit-html", "lit-element", "@lit/reactive-element", "@lit/context"] },
  // Trenchcoat's elements use standard decorators, which no browser ships yet: esbuild lowers them
  esbuild: { target: "es2022" },
  // Thumbnails stay files (~900 of them, a few KB each), loaded as cards come into view – inlined, they would put
  // megabytes of base64 in the first script
  // The app's own script is ~170 KB gzipped (Vue, Lit, five toolbar elements, the catalogue); pieces load on their own
  build: { target: "es2022", assetsInlineLimit: 0, chunkSizeWarningLimit: 700 },
  server: { fs: { allow: [here("."), TRENCHCOAT] } },
  // Pre-bundle all of Lit up front: otherwise the dev server finds a directive the first time a piece using it opens,
  // and reloads the page to add it
  optimizeDeps: {
    include: [
      "lit",
      "lit/decorators.js",
      "@lit/context",
      ...readdirSync(here("node_modules/lit/directives"))
        .filter((f) => f.endsWith(".js"))
        .map((f) => `lit/directives/${f}`),
    ],
  },
  test: {
    testTimeout: 30_000,
    projects: [
      // Pure logic: layouts, viewport maths, keyboard navigation, the snippet parser
      { extends: true, test: { name: "unit", environment: "node", include: ["tests/unit/**/*.test.ts"] } },
      // The app in a real browser: keyboard use, zoom, live examples and axe
      {
        extends: true,
        test: {
          name: "browser",
          include: ["tests/browser/**/*.test.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            viewport: { width: 1280, height: 800 },
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
