import { customElementVuejsPlugin } from "custom-element-vuejs-integration";
import { customElementSveltePlugin } from "custom-element-svelte-integration";

const settingsValues = new Map();

// `custom-elements.json` – the element metadata that drives framework types, editor completion and the wrappers
export default {
  globs: ["src/elements/**/*.ts"],
  exclude: ["src/elements/react.ts", "src/elements/react/**", "src/elements/index.ts"],
  outdir: ".",
  litelement: true,
  plugins: [
    {
      // TcElement's emit(name, …) helper reads as an event called "name"; the real events are the @fires tags
      name: "tc-drop-helper-event",
      analyzePhase({ ts, node }) {
        if (!ts.isClassDeclaration(node) || !node.name) return;
        const base = node.heritageClauses?.flatMap((clause) => [...clause.types]).find((type) => type.expression.getText() === "TcSettingsElement");
        if (!base?.typeArguments?.length) return;
        const constructor = node.members.find((member) => ts.isConstructorDeclaration(member));
        const call = constructor?.body?.statements.find((statement) => ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && statement.expression.expression.kind === ts.SyntaxKind.SuperKeyword)?.expression;
        settingsValues.set(node.name.text, { type: base.typeArguments[0].getText(), initial: call?.arguments[0]?.getText() });
      },
      packageLinkPhase({ customElementsManifest }) {
        // The analyzer copies the generic base's T literally. Resolve it before generating metadata for consumers.
        for (const mod of customElementsManifest.modules) for (const declaration of mod.declarations ?? []) {
          const concrete = settingsValues.get(declaration.name);
          const value = declaration.members?.find((member) => member.name === "value" && member.inheritedFrom?.name === "TcSettingsElement");
          if (concrete && value) { value.type = { text: concrete.type }; value.default = concrete.initial; }
        }
        for (const mod of customElementsManifest.modules)
          for (const d of mod.declarations ?? []) if (d.events) d.events = d.events.filter((e) => e.name !== "name");
      },
    },
    // Typed bindings for Vue (GlobalComponents) and Svelte (svelteHTML), from the same metadata – trenchcoat/vue and
    // trenchcoat/svelte in package.json
    customElementVuejsPlugin({ outdir: "dist/types", fileName: "vue.d.ts", globalTypePath: "./elements/index.js" }),
    customElementSveltePlugin({ outdir: "dist/types", fileName: "svelte.d.ts", globalTypePath: "./elements/index.js" }),
  ],
};
