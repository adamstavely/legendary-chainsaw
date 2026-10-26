import { customElementVuejsPlugin } from "custom-element-vuejs-integration";
import { customElementSveltePlugin } from "custom-element-svelte-integration";

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
      packageLinkPhase({ customElementsManifest }) {
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
