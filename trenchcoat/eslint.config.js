import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["node_modules", "dist", "coverage", ".visual"] },
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
    files: ["components/**", "blocks/**", "screens/**", "illustrations/**", "motion/**"],
    rules: { "react-hooks/exhaustive-deps": "warn" },
  },
  {
    // Component sources declare build metadata that only scripts/build-lib.mjs reads
    files: ["src/components/**"],
    rules: { "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^(_|EXTRA_ROOT_CLASSES$)" }] },
  },
  {
    // Demos pass the imported module around as `any` on purpose (`ui: any` in the registry)
    files: ["app/src/registry.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
