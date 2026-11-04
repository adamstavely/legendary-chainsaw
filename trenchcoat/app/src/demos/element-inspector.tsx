import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { InspectorDetails, InspectorNode } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The grant application page of a research institute's staging site, as a DOM tree. The details are made up per
   element; nothing reads a real page. */

const NODES: InspectorNode[] = [
  {
    id: "body",
    tag: "body",
    attrs: { class: "portal" },
    children: [
      { id: "header", tag: "header", attrs: { class: "site-head" }, children: [{ id: "logo", tag: "a", attrs: { href: "/", class: "logo" }, text: "Halden Research Institute" }] },
      {
        id: "main",
        tag: "main",
        attrs: { id: "content" },
        children: [
          { id: "h1", tag: "h1", text: "Apply for a field grant" },
          {
            id: "form",
            tag: "form",
            attrs: { id: "apply", class: "form wide", method: "post" },
            children: [
              { id: "label-title", tag: "label", attrs: { for: "title" }, text: "Project title" },
              { id: "input-title", tag: "input", attrs: { id: "title", name: "title", required: "" } },
              { id: "label-budget", tag: "label", attrs: { for: "budget" }, text: "Budget (EUR)" },
              { id: "input-budget", tag: "input", attrs: { id: "budget", type: "number" } },
              { id: "submit", tag: "button", attrs: { type: "submit", class: "btn primary" }, text: "Submit application" },
            ],
          },
        ],
      },
      { id: "footer", tag: "footer", text: "© Halden Research Institute" },
    ],
  },
];

const DETAILS: Record<string, InspectorDetails> = {
  form: {
    box: { width: 640, height: 412, margin: [0, 0, 32, 0], border: [1, 1, 1, 1], padding: [24, 24, 24, 24] },
    styles: [
      { property: "display", value: "grid", source: "form.css:4" },
      { property: "gap", value: "12px", source: "form.css:5" },
      { property: "max-width", value: "40rem", source: "form.css:6" },
      { property: "border-radius", value: "8px", source: "tokens.css" },
    ],
  },
  submit: {
    box: { width: 182, height: 36, margin: [8, 0, 0, 0], border: [0, 0, 0, 0], padding: [8, 16, 8, 16] },
    styles: [
      { property: "background", value: "var(--brand)", source: "button.css:18" },
      { property: "color", value: "#fff", source: "button.css:19" },
      { property: "font-weight", value: "600", source: "button.css:20" },
    ],
  },
  h1: { box: { width: 640, height: 40, margin: [0, 0, 16, 0], border: [0, 0, 0, 0], padding: [0, 0, 0, 0] }, styles: [{ property: "font-size", value: "2rem", source: "type.css:2" }] },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ElementInspector } = ui;
  const [selected, setSelected] = useState<string | null>("form");
  const [outlined, setOutlined] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <ElementInspector
        description="staging.halden.example/grants/218/apply"
        nodes={NODES}
        selected={selected}
        onSelectedChange={setSelected}
        defaultExpanded={["body", "main", "form"]}
        details={selected ? (DETAILS[selected] ?? { styles: [] }) : null}
        onTcHighlight={(e) => setOutlined(e.detail.node ? e.detail.node.tag + (e.detail.node.attrs?.id ? `#${e.detail.node.attrs.id}` : "") : null)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {outlined ? `Outlining ${outlined} in the preview` : "Hover an element to outline it, or choose one to see its box and styles."}{" "}
        <button type="button" style={textButton} onClick={() => setSelected("submit")}>
          Inspect the submit button
        </button>
      </div>
    </div>
  );
}
