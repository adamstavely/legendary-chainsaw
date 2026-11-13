import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { WorkflowEdge, WorkflowNode, WorkflowStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's invoice approval workflow, part way through a run: the invoice is read and matched,
   and the amount check is running. Large amounts wait for a manager; the rest go straight to the ledger. */

const STEPS: WorkflowNode[] = [
  { id: "received", kind: "trigger", title: "Invoice received", summary: "accounts-payable inbox", x: 0, y: 130 },
  { id: "extract", kind: "llm", title: "Extract fields", summary: "Vendor, amount, PO number", x: 250, y: 130 },
  { id: "match", kind: "tool", title: "Match purchase order", summary: "Procurement records", x: 500, y: 130 },
  { id: "amount", kind: "condition", title: "Amount over 10k?", summary: "amount > 10,000", x: 750, y: 130 },
  { id: "approve", kind: "approval", title: "Manager approval", summary: "Budget holder", x: 1000, y: 20 },
  { id: "post", kind: "output", title: "Post to ledger", summary: "General ledger", x: 1250, y: 130 },
  { id: "notify", kind: "output", title: "Notify finance", summary: "#finance-ops", x: 1250, y: 260 },
];
const EDGES: WorkflowEdge[] = [
  { from: "received", to: "extract" },
  { from: "extract", to: "match" },
  { from: "match", to: "amount" },
  { from: "amount", to: "approve", label: "over 10k" },
  { from: "amount", to: "post", label: "10k or less" },
  { from: "approve", to: "post", label: "approved" },
  { from: "approve", to: "notify", label: "rejected" },
];
const RUN: Record<string, WorkflowStatus> = { received: "done", extract: "done", match: "done", amount: "running" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { WorkflowCanvas } = ui;
  const [nodes, setNodes] = useState<WorkflowNode[]>(STEPS.map((s) => ({ ...s, status: RUN[s.id] })));
  const [edges, setEdges] = useState(EDGES);
  const [note, setNote] = useState("");
  const running = nodes.some((n) => n.status);
  return (
    <div style={{ width: "100%", maxWidth: 1080, display: "grid", gap: 8 }}>
      <WorkflowCanvas
        title="Invoice approval"
        description="From the accounts-payable inbox to the ledger, with a manager's sign-off on large amounts."
        nodes={nodes}
        edges={edges}
        defaultSelected="amount"
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        onAddRequest={(after) => setNote(after ? `The page would open a step picker to add a step after “${nodes.find((n) => n.id === after)?.title}”. ` : "The page would open a step picker. ")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Drag a step, or drag from its dot onto another step to connect them. With the keyboard: M moves, C connects, A adds. "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setNodes((ns) => ns.map((n) => ({ ...n, status: running ? undefined : RUN[n.id] })));
            setNote("");
          }}
        >
          {running ? "Clear the run" : "Show the run"}
        </button>
      </div>
    </div>
  );
}
