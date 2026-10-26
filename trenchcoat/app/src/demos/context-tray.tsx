import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ContextTrayEntry } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The agent is pulling sources into context while you watch – each one lands as a chip with its weight, and the last
   one tips the window into its warning. Hover a chip to find it in the meter, pin what must survive compaction, remove
   the heavy log (Undo, or ⌘Z, puts it back). */

const START: ContextTrayEntry[] = [
  { id: "spec", label: "billing-spec.md", kind: "file", tokens: 18600, pinned: true, hint: "docs/billing/billing-spec.md" },
  { id: "schema", label: "schema.prisma", kind: "file", tokens: 7400, hint: "packages/db/schema.prisma" },
  { id: "priya", label: "@Priya Shah", kind: "mention", tokens: 1200, hint: "Billing eng · owns proration" },
  { id: "invoice", label: "invoice.ts", kind: "file", tokens: 12900, hint: "apps/api/billing/invoice.ts" },
];
const ARRIVING: ContextTrayEntry[] = [
  { id: "stripe", label: "Stripe API reference", kind: "source", tokens: 34800, hint: "stripe.com/docs/api/invoices" },
  { id: "bil-142", label: "BIL-142", kind: "source", tokens: 2100, hint: "Linear · Proration is off by a day" },
  { id: "webhooks", label: "stripe-webhooks.log", kind: "file", tokens: 31200, hint: "logs/stripe-webhooks.log" },
  { id: "changelog", label: "Stripe changelog 2026", kind: "source", tokens: 9800, hint: "stripe.com/changelog" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ContextTray } = ui;
  const [items, setItems] = useState<ContextTrayEntry[]>(START);
  const [arrived, setArrived] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  // One source every 500ms until all four are in – then nothing ticks
  useEffect(() => {
    if (arrived >= ARRIVING.length) return;
    const t = setTimeout(() => {
      setItems((list) => (list.some((it) => it.id === ARRIVING[arrived].id) ? list : [...list, ARRIVING[arrived]]));
      setArrived((n) => n + 1);
    }, 500);
    return () => clearTimeout(t);
  }, [arrived]);

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <ContextTray
        title="In context"
        items={items}
        limit={200_000}
        reserved={46_000}
        onChange={(next, change) => {
          setItems(next);
          setNote(`${change.type === "restore" ? "Put back" : change.type === "remove" ? "Removed" : change.type === "pin" ? "Pinned" : "Unpinned"} ${change.item.label}`);
        }}
      />
      <div style={{ ...caption, minHeight: 18 }}>
        {note ?? "System prompt, tools and the conversation take 46K before anything is attached."}{" "}
        {arrived >= ARRIVING.length && items.length !== START.length + ARRIVING.length ? (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setItems([...START, ...ARRIVING]);
              setNote(null);
            }}
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
