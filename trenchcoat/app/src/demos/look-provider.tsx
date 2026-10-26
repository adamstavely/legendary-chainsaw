import { useState } from "react";
import type * as UI from "../../../src/elements/react";

// The provider sets the look for everything inside; the last button keeps its own
export default function Demo({ ui }: { ui: typeof UI }) {
  const { LookProvider, Button, SegmentedControl } = ui;
  const [look, setLook] = useState<"standard" | "clean">("clean");
  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
      <SegmentedControl
        aria-label="Look for the group below"
        options={[
          { value: "standard", label: "Standard" },
          { value: "clean", label: "Clean" },
        ]}
        value={look}
        onChange={(v) => setLook(v as "standard" | "clean")}
      />
      <LookProvider look={look}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button>Save</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="secondary" look="standard">
            Always Standard
          </Button>
        </div>
      </LookProvider>
    </div>
  );
}
