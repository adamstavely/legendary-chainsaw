import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The work against one research topic, as a grid of cards. "Unblock" moves the blocked item back to Active; the
   date is fixed so the overdue item stays overdue. */

const NOW = new Date(2026, 6, 20, 12).getTime();
const at = (m: number, d: number) => new Date(2026, m - 1, d, 12).getTime();

export default function Demo({ ui }: { ui: typeof UI }) {
  const { WorkItem } = ui;
  const [unblocked, setUnblocked] = useState(false);
  const [note, setNote] = useState("");
  const open = (name: string) => () => {
    setNote(`Opened ${name}.`);
    return false;
  };
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        <WorkItem
          title="NeuroBench-E harness"
          status="active"
          note="Energy-normalised benchmark across 7 substrates."
          progress={0.6}
          due={at(8, 15)}
          now={NOW}
          people={[{ name: "Jonah Tran" }, { name: "Elena Castellanos" }]}
          outcome="fills 1 gap"
          spent={360_000}
          budget={600_000}
          effort="1.5 FTE"
          source="Synced · read-only"
          onOpen={open("NeuroBench-E harness")}
        />
        <WorkItem
          title="Local plasticity learning rule"
          status={unblocked ? "active" : "blocked"}
          note={unblocked ? "Test chips arrived; training runs restarted." : "Blocked on the fab run for test chips (Q3)."}
          progress={0.35}
          due={at(10, 1)}
          now={NOW}
          people={[{ name: "Elena Castellanos" }, { name: "Marcus Okonkwo" }]}
          outcome="fills 1 gap"
          spent={320_000}
          budget={900_000}
          effort="1.2 FTE"
          onOpen={open("Local plasticity learning rule")}
        />
        <WorkItem
          title="PyTorch → substrate compiler"
          status="review"
          note="In internal review; targeting an open-source release."
          progress={0.9}
          due={at(6, 30)}
          now={NOW}
          people={[{ name: "Marcus Okonkwo" }, { name: "Jonah Tran" }]}
          outcome="fills 1 gap"
          spent={410_000}
          budget={400_000}
          effort="1 FTE"
          onOpen={open("PyTorch → substrate compiler")}
        />
        <WorkItem
          title="Quantization-aware mapping"
          status="done"
          progress={1}
          due={at(7, 10)}
          now={NOW}
          people={[{ name: "Jonah Tran" }]}
          outcome="fills 1 gap"
          spent={250_000}
          budget={500_000}
          effort="0.7 FTE"
          onOpen={open("Quantization-aware mapping")}
        />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Open a card with a click or Enter. "}
        <button type="button" style={textButton} onClick={() => setUnblocked(!unblocked)}>
          {unblocked ? "Block again" : "Unblock"}
        </button>
      </div>
    </div>
  );
}
