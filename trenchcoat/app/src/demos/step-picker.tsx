import { useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* What to add after "Match purchase order" in a fictional research institute's invoice workflow: a condition and an
   approval are suggested, and the steps used most recently come next. */

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StepPicker } = ui;
  const [added, setAdded] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 8 }}>
      <StepPicker
        description="After “Match purchase order”"
        suggestions={[
          { id: "condition", reason: "Usually comes after Match purchase order" },
          { id: "approval", reason: "Most invoice workflows ask a person here" },
        ]}
        recent={["extract", "send-email"]}
        onPick={(_kind, item) => setAdded((a) => [item.label, ...a].slice(0, 3))}
      />
      <StepPicker layout="popover" anchor={anchor.current} open={open} onOpenChange={setOpen} onPick={(_kind, item) => setAdded((a) => [item.label, ...a].slice(0, 3))} />
      <div style={{ ...caption, textAlign: "center" }}>
        {added.length ? `Added ${added.join(", ")}. ` : "Type to search, or pick with the arrow keys and Enter. "}
        <button ref={anchor} type="button" style={textButton} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          Open as a popover
        </button>
      </div>
    </div>
  );
}
