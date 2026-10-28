import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AlertItem } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A security operations team's live feed of account and payment alerts. A new alert arrives every few seconds; pause
   the feed and they wait behind "Show N new"; Acknowledge quiets an alert, Escalate names it below. */

const MIN = 60_000;
const NEXT: Omit<AlertItem, "id" | "time">[] = [
  { category: "Sign-in", severity: "high", title: "Impossible travel between sign-ins", subject: "Ravi Menon · CUS-2210-V · Lisbon → Singapore", source: "Identity rules" },
  { category: "Payment", severity: "medium", title: "Refund larger than the original charge", subject: "Copperleaf Market · MER-6603-K", source: "Payments" },
  { category: "Device", severity: "info", title: "New device trusted", subject: "Mia Lindqvist · CUS-1144-R · iPhone", source: "Identity rules" },
  { category: "Payment", severity: "critical", title: "Card tested with 40 small charges", subject: "Northwind Traders · MER-4471-K · 3 cards", source: "Case 22-1187" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AlertFeed } = ui;
  const [start] = useState(() => Date.now());
  const [items, setItems] = useState<AlertItem[]>(() => [
    { id: "a1", category: "Payment", severity: "critical", title: "Card used in two countries within an hour", subject: "Dana Okafor · CUS-0098-S · Geneva", source: "Chargebacks", time: start - 27_000 },
    { id: "a2", category: "Location", severity: "high", title: "Payout to a newly added bank account", subject: "Lumen Freight · MER-9011-P · Rotterdam", source: "Case 23-0461", time: start - 4 * MIN },
    { id: "a3", category: "Document", severity: "medium", title: "Uploaded ID failed the liveness check", subject: "Tomás Herrera · CUS-5560-B", source: "Onboarding", time: start - 18 * MIN },
    { id: "a4", category: "Sign-in", severity: "info", title: "Password reset from a known device", subject: "Mia Lindqvist · CUS-1144-R", source: "Identity rules", time: start - 52 * MIN, acknowledged: true },
  ]);
  const [said, setSaid] = useState("");
  useEffect(() => {
    let n = 0;
    const t = window.setInterval(() => {
      if (n >= NEXT.length) return window.clearInterval(t);
      const next = { ...NEXT[n], id: `n${n}`, time: Date.now() };
      n++;
      setItems((list) => [next, ...list]);
    }, 6000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <AlertFeed title="Live alerts" description="Accounts and payments, all rules" items={items} todayCount={37} onAction={(_, action, item) => void (action === "escalate" && setSaid(`Escalated: ${item.title}`))} />
      <div style={{ ...caption, textAlign: "center" }}>{said || "New alerts arrive every few seconds. Pause the feed to hold them."}</div>
    </div>
  );
}
