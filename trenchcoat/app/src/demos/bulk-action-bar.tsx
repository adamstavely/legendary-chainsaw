import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's file list: a few files are selected, and the bar acts on them. */

const ACTIONS = [
  { id: "flag", label: "Flag" },
  { id: "share", label: "Share" },
  { id: "remove", label: "Remove", danger: true, confirm: true },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BulkActionBar } = ui;
  const [count, setCount] = useState(3);
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <BulkActionBar
        count={count}
        total={40}
        actions={ACTIONS}
        onTcAction={(e) => setNote(`${e.detail.action.label}: ${e.detail.count} files`)}
        onTcSelectAll={() => setCount(40)}
        onTcClear={() => setCount(0)}
        onTcUndo={(e) => setNote(`Undid ${e.detail.action.label}`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Remove asks first, and every action offers Undo."}{" "}
        <button type="button" style={textButton} onClick={() => setCount(3)}>
          Select 3
        </button>
      </div>
    </div>
  );
}
