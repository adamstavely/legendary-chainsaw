// Dev-only page for scripts/capture-thumbs.mjs (app/thumb.html): one gallery demo on a plain, undotted stage, so the
// overview tiles' thumbnails are framed the same way every time.
//   thumb.html                       window.__entries – every registry entry the script can capture
//   thumb.html?id=<id>&look=<look>   that entry's demo; body[data-ready] once it has mounted
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { LookProvider } from "../../src/elements/react";
import { ENTRIES, type Variant } from "./registry";
import "../../tokens/tokens.css";
import "./styles.css";

declare global {
  interface Window {
    __entries: { id: string; library: string; slug: string; name: string; layout: string; looks: string[] }[];
  }
}

window.__entries = ENTRIES.map((e) => ({ id: e.id, library: e.library, slug: e.slug, name: e.name, layout: e.layout, looks: Object.keys(e.load) }));

const params = new URLSearchParams(location.search);
const entry = ENTRIES.find((e) => e.id === params.get("id"));
const look = (params.get("look") ?? "standard") as Variant;

document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
    html, body { margin: 0; background: light-dark(#fafaf9, #0e0e10); color-scheme: light; }
    html.dark, html.dark body { color-scheme: dark; }
    #root { padding: 240px; width: max-content; }
    .thumb-stage { background: none !important; max-height: none; overflow: visible; padding: 24px; }
    .thumb-stage.stage-card { width: 600px; min-height: 375px; }
    .thumb-stage.stage-wide { width: 1280px; min-height: 800px; }
    /* A block takes the stage's full width, as .stage-wide > * means it to – the look provider in between has no box */
    .thumb-stage.stage-wide > tc-look-provider > * { width: 100%; }
    .thumb-stage.stage-screen { width: 1280px; height: 800px; overflow: hidden; padding: 0; }
  </style>`,
);

/** Marks the page ready once React has committed the demo (no timers: the script runs a fake clock) */
function Ready() {
  useEffect(() => {
    document.body.dataset.ready = "";
  }, []);
  return null;
}

if (entry?.Demo) {
  const Demo = entry.Demo;
  const variant: Variant = entry.load[look] ? look : (Object.keys(entry.load)[0] as Variant);
  entry.load[variant]!().then((mod) => {
    createRoot(document.getElementById("root")!).render(
      <div className={`stage stage-${entry.layout} thumb-stage`} data-tc-theme="light">
        <LookProvider look={variant}>
          <Demo ui={mod} />
        </LookProvider>
        <Ready />
      </div>,
    );
  });
} else {
  document.body.dataset.ready = "";
}
