import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Collapse } = ui;
  const [open, setOpen] = useState(true);
  return (
    <div style={{ width: "100%", maxWidth: 360, fontSize: 13, color: "var(--tc-text-primary)" }}>
      <button type="button" style={textButton} aria-expanded={open} aria-controls="collapse-demo" onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} the method</button>
      <Collapse id="collapse-demo" open={open}>
        <div><p style={{ paddingTop: 8, margin: 0 }}>Samples were drawn at random from each site, then read twice by people who didn't see each other's scores.</p></div>
      </Collapse>
    </div>
  );
}
