import { useState } from "react";
import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <ui.Button label="Open settings" onClick={() => setOpen(true)} />
      <ui.Dialog label="Review settings" open={open} onOpenChange={setOpen}>
        <p>Review your model configuration before applying it.</p>
        <ui.Button label="Apply and close" onClick={() => setOpen(false)} />
      </ui.Dialog>
    </div>
  );
}
