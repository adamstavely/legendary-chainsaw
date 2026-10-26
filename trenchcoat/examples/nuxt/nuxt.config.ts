// tc-* are custom elements; they render on the client only (decision L10)
export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  css: ["trenchcoat/tokens.css"],
  vue: { compilerOptions: { isCustomElement: (tag: string) => tag.startsWith("tc-") } },
  telemetry: false,
});
