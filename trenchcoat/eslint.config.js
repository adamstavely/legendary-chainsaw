import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import lit from "eslint-plugin-lit";
import wc from "eslint-plugin-wc";

export default tseslint.config(
  { ignores: ["node_modules", "dist", "coverage", ".visual", ".perf", "scripts/perf"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended],
    plugins: { "react-hooks": hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // The libraries predate the gate: exhaustive-deps stays a warning there until Phase 2 rewrites the effects.
    // New suppressions are policed by scripts/check-ratchet.mjs instead.
    files: ["src/components/**", "blocks/**", "screens/**", "illustrations/**", "motion/**"],
    rules: { "react-hooks/exhaustive-deps": "warn" },
  },
  {
    // The Lit elements (audit/lit-port-plan.md, toolchain): lit-analyzer checks the templates in CI as well
    files: ["src/elements/**/*.ts", "tests/elements/**/*.ts"],
    extends: [lit.configs["flat/recommended"], wc.configs["flat/recommended"]],
  },
  {
    // Demos pass the imported module around as `any` on purpose (`ui: any` in the registry)
    files: ["app/src/registry.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
