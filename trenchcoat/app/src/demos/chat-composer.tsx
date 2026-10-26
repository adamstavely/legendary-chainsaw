import { useState } from "react";
import type * as UI from "@components/chat-composer";
import { surface } from "../demo-kit";

type Sent = { text: string; model: string };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChatComposer, defaultModels } = ui;
  const [sent, setSent] = useState<Sent[]>([]);
  const [note, setNote] = useState("");
  const name = (id: string) => defaultModels.find((m) => m.id === id)?.name ?? id;
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
      {sent.length > 0 && (
        <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
          {sent.slice(-3).map((m, i) => (
            <div key={i} style={{ maxWidth: "80%", ...surface, borderRadius: 14, padding: "8px 12px", fontSize: 13 }}>
              {m.text}
              <div style={{ fontSize: 11, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", marginTop: 2 }}>to {name(m.model)}</div>
            </div>
          ))}
        </div>
      )}
      <ChatComposer
        placeholder="Ask anything, or press the mic to dictate…"
        models={defaultModels}
        loadMs={1400}
        demo
        dictation="Can you summarize yesterday's customer calls and pull out the three most requested features?"
        onSend={(text, d) => {
          setSent((s) => [...s, { text, model: d.model }]);
          setNote("");
        }}
        onModelChange={(m) => setNote(`Model: ${m.name}`)}
        onAttach={() => setNote("Attach clicked – open your file picker here.")}
        onConnectApps={() => setNote("Apps connected.")}
        onRequestApproval={() => setNote("Approval requested.")}
        onSelectProject={() => setNote("Project picker clicked.")}
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center", minHeight: 16 }}>{note}</div>
    </div>
  );
}
