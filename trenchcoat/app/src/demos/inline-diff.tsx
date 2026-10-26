import { useRef, useState } from "react";
import type * as UI from "@components/inline-diff";
import type { InlineDiffHandle } from "@components/inline-diff";
import { buttonSm, caption } from "../demo-kit";

const original =
  "Our team is very excited to announce that we have made the decision to launch a brand new dashboard that will help you to keep track of all of your projects in one single place, starting from next Monday.";
const suggested =
  "We're excited to launch a new dashboard that keeps all your projects in one place, starting next Monday.";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { InlineDiff } = ui;
  const ref = useRef<InlineDiffHandle>(null);
  const [done, setDone] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <InlineDiff
        ref={ref}
        label="Suggested by AI · Make it shorter"
        original={original}
        suggested={suggested}
        onChange={() => setDone(null)}
        onDone={(text) => setDone(text)}
      />
      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" style={buttonSm} onClick={() => ref.current?.acceptAll()}>Accept all</button>
        <button type="button" style={buttonSm} onClick={() => ref.current?.rejectAll()}>Reject all</button>
        <button type="button" style={buttonSm} onClick={() => { ref.current?.reset(); setDone(null); }}>Reset</button>
      </div>
      {done !== null && (
        <div style={{ ...caption, textAlign: "center" }}>Final: “{done}”</div>
      )}
    </div>
  );
}
