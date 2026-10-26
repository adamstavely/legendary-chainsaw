import { useState } from "react";
import type * as UI from "@components/setup-guide";
import { textButton } from "../demo-kit";

const GROUPS: UI.SetupGroup[] = [
  {
    id: "basics",
    title: "Set up your store",
    tasks: [
      { id: "name", label: "Name your store", done: true },
      { id: "logo", label: "Upload a logo", done: true },
      { id: "domain", label: "Connect a custom domain" },
    ],
  },
  {
    id: "products",
    title: "Add products",
    tasks: [
      { id: "first-product", label: "Add your first product" },
      { id: "collection", label: "Create a collection" },
      { id: "inventory", label: "Set inventory levels" },
    ],
  },
  {
    id: "launch",
    title: "Get ready to launch",
    tasks: [
      { id: "payments", label: "Set up payments" },
      { id: "shipping", label: "Choose shipping rates" },
      { id: "test-order", label: "Place a test order" },
    ],
  },
];

const TOTAL = GROUPS.reduce((n, g) => n + g.tasks.length, 0);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SetupGuide } = ui;
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(GROUPS.flatMap((g) => g.tasks.filter((t) => t.done).map((t) => t.id)).length);
  const [note, setNote] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);

  const restart = () => {
    setRound((r) => r + 1);
    setDone(GROUPS.flatMap((g) => g.tasks.filter((t) => t.done).map((t) => t.id)).length);
    setNote(null);
    setClosed(false);
  };

  const link = { ...textButton, marginLeft: 6 };

  return (
    <div style={{ width: "100%", maxWidth: 320, display: "grid", gap: 12, justifyItems: "center" }}>
      {closed ? (
        <div style={{ fontSize: 13, color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))", padding: "40px 0" }}>
          Setup guide hidden.
          <button type="button" onClick={restart} style={link}>
            Show it again
          </button>
        </div>
      ) : (
        <div style={{ width: "100%" }}>
          <SetupGuide
            key={round}
            title="Setup guide"
            groups={GROUPS}
            onEdit={() => setNote("Edit opens your checklist settings")}
            onClose={() => setClosed(true)}
            onChange={(ids) => {
              setDone(ids.length);
              setNote(null);
            }}
          />
        </div>
      )}
      {!closed && (
        <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }} aria-live="polite">
          {note ?? `${done} of ${TOTAL} tasks finished`}
          <button type="button" onClick={restart} style={link}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
