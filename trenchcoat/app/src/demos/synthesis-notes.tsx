import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SynthesisNote } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A person's notes while checking whether a hosting contract can be ended early – kept apart from the model's answer.
   Add, edit, move a note with its grip (arrow keys), remove one and undo, then export. */

const START: SynthesisNote[] = [
  { id: "n1", kind: "conclusions", text: "We can end the Northwind contract before the term is up" },
  { id: "n2", kind: "conclusions", text: "No exit fee once the first year has passed (we're in month 14)" },
  { id: "n3", kind: "assumptions", text: "The order form we have on file is the signed version" },
  { id: "n4", kind: "verify", text: "Notice period – the assistant said 30 days last week and 60 today" },
  { id: "n5", kind: "verify", text: "Whether prepaid months come back as a refund or a credit" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SynthesisNotes } = ui;
  const [notes, setNotes] = useState(START);
  const [exported, setExported] = useState<string | null>(null);

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <SynthesisNotes
        title="Ending the Northwind contract"
        sessionId="2291"
        author="Maya Chen"
        notes={notes}
        onChange={(next) => {
          setNotes(next);
          setExported(null);
        }}
        onExport={(d) => setExported(`Exported ${d.notes.length} notes from session ${d.sessionId} as Markdown (${d.markdown.split("\n").length} lines).`)}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>{exported ?? "Focus a note's grip and use the arrow keys to move it."}</div>
    </div>
  );
}
