// `custom-elements.json` – the element metadata that drives framework types, editor completion and the wrappers
export default {
  globs: ["src/elements/**/*.ts"],
  exclude: ["src/elements/react.ts", "src/elements/index.ts"],
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
  ],
};
