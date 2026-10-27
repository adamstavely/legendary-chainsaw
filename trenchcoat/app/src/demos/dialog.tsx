import { useState } from "react";
import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  return (
    <div>
      <ui.Button label="Review settings" onClick={() => setOpen(true)} />
      {applied && <p>Settings applied.</p>}
      <ui.Dialog
        label="Apply model settings?"
        description="The new settings apply to every conversation in this workspace."
        closeLabel="Cancel"
        open={open}
        onOpenChange={setOpen}
        actions={
          <ui.Button
            variant="primary"
            label="Apply settings"
            onClick={() => {
              setApplied(true);
              setOpen(false);
            }}
          />
        }
      >
        <p>Temperature drops from 0.7 to 0.3, and answers cite their sources.</p>
      </ui.Dialog>
    </div>
  );
}
