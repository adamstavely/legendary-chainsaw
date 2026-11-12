import vue from "eslint-plugin-vue";
import vueA11y from "eslint-plugin-vuejs-accessibility";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules", "dist"] },
  {
    files: ["**/*.{ts,vue}"],
    extends: [tseslint.configs.recommended, ...vue.configs["flat/recommended"], ...vueA11y.configs["flat/recommended"]],
    languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: [".vue"] }, globals: { document: "readonly", window: "readonly" } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // A label names its control by for/id or by wrapping it – either is enough
      "vuejs-accessibility/label-has-for": ["error", { required: { some: ["nesting", "id"] } }],
      // tc-* are Trenchcoat's custom elements, and Lucide icons fill their icon slot
      "vue/no-deprecated-slot-attribute": "off",
      // Formatting is Prettier's
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/multiline-html-element-content-newline": "off",
    },
  },
);
