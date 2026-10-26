import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ReviewItem } from "../../../src/elements/react";
import { buttonSm } from "../demo-kit";

const MIN = 60_000;

const Star = ({ c }: { c: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l1.7 4.8 4.8 1.7-4.8 1.7L8 14.5l-1.7-4.8L1.5 8l4.8-1.7z" fill={c} />
  </svg>
);
const Dot = ({ c }: { c: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <rect width="14" height="14" rx="4" fill={c} />
  </svg>
);

function makeItems(t: number): ReviewItem[] {
  return [
    {
      id: "refund-4821",
      title: "Refund order #4821 for Maya Chen",
      agent: "Support agent",
      model: "Claude Haiku",
      icon: <Star c="#d97757" />,
      type: "Refund",
      risk: "high",
      confidence: 0.62,
      createdAt: t - 26 * MIN,
      reasoning: "The tracking shows the parcel was returned to sender after two failed deliveries. Policy allows a full refund when the carrier fails.",
      fields: [
        { label: "Amount", value: ["$", { text: "312.40", note: "Includes $18.40 express shipping – policy is unclear whether shipping is refunded on carrier failure.", source: "Refund policy §4.2" }] },
        { label: "Method", value: "Original card (Visa ··4417)" },
        { label: "Customer since", value: "March 2021 · 14 orders" },
      ],
      body: "Hi Maya – sorry your order never made it. I've refunded the full amount to your Visa; it should show up within 3–5 business days.",
      bodyLabel: "Reply",
      sources: [{ label: "Order #4821", icon: <Dot c="#16a34a" /> }, { label: "UPS tracking 1Z84…", icon: <Dot c="#7c4a03" /> }],
    },
    {
      id: "pr-coupon",
      title: "Fix rounding in coupon totals",
      agent: "Coder",
      model: "Claude Sonnet",
      icon: <Star c="#c2410c" />,
      type: "Code change",
      risk: "medium",
      confidence: 0.84,
      createdAt: t - 12 * MIN,
      reasoning: "Percent coupons were applied to the rounded subtotal, so totals were off by a cent in ~0.3% of orders.",
      fields: [{ label: "Branch", value: "fix/coupon-rounding → main" }],
      files: [
        {
          path: "checkout/coupon.ts",
          added: 3,
          removed: 2,
          start: 18,
          diff: [
            "@@ -18,6 +18,7 @@\n export function applyCoupon(cart: Cart, coupon: Coupon) {\n-  const subtotal = round(cart.subtotal);\n-  const off = subtotal * coupon.percent / 100;\n+  const off = cart.subtotal * coupon.percent / 100;\n+  ",
            { text: "const total = round(cart.subtotal - off);", note: "Rounds half away from zero – the payment provider rounds half to even. Totals may still differ on exact .5 cents.", source: "stripe docs · amounts" },
            "\n+  return { ...cart, total };\n }",
          ],
        },
        { path: "checkout/coupon.test.ts", added: 24, removed: 0 },
      ],
    },
    {
      id: "email-renewal",
      title: "Renewal reminder to Northwind Traders",
      agent: "Account agent",
      model: "Claude Sonnet",
      icon: <Star c="#e8a27e" />,
      type: "Email",
      risk: "low",
      confidence: 0.91,
      createdAt: t - 41 * MIN,
      fields: [
        { label: "To", value: "jonas@northwind.io" },
        { label: "Subject", value: "Your plan renews on Nov 1" },
      ],
      body: [
        "Hi Jonas,\n\nA quick heads-up that your Team plan renews on November 1 for ",
        { text: "$4,800/year", note: "Last year's price was $4,200 – the increase was announced in July, but this account may have a grandfathered rate.", source: "CRM · Northwind notes" },
        ". Nothing to do on your side – reply here if you'd like to change seats.\n\nBest,\nRiley",
      ],
      bodyLabel: "Email",
    },
    {
      id: "plan-migrate",
      title: "Move 1,240 contacts into the new CRM",
      agent: "Ops agent",
      model: "Claude Opus",
      icon: <Star c="#b45309" />,
      type: "Plan",
      risk: "medium",
      confidence: 0.77,
      createdAt: t - 7 * MIN,
      reasoning: "Export, dedupe on email, then import in batches of 200 so a failure only affects one batch.",
      steps: [
        { title: "Export contacts from HubSpot", tool: "HubSpot", icon: <Dot c="#ff7a59" /> },
        { title: "Dedupe on email address", tool: "Python", detail: ["Merges ", { text: "~60 duplicates", note: "Estimated from a sample of 200 – the real count could be higher.", source: "sample.csv" }, " – newest record wins"] },
        { title: "Import in batches of 200", tool: "Attio", icon: <Dot c="#111827" /> },
        { title: "Post a summary to #ops", tool: "Slack", icon: <Dot c="#4a154b" /> },
      ],
    },
  ];
}

const LATE: (t: number) => ReviewItem = (t) => ({
  id: "clause-liability",
  title: "Cap liability at 12 months of fees",
  agent: "Legal agent",
  model: "Claude Opus",
  icon: <Star c="#9a3412" />,
  type: "Contract clause",
  risk: "high",
  confidence: 0.58,
  createdAt: t,
  reasoning: "The customer's redline removes the cap entirely. Our standard is 12 months of fees; I've proposed that back.",
  body: [
    "Each party's total liability under this Agreement shall not exceed ",
    { text: "the fees paid in the twelve (12) months", note: "The customer asked for 24 months in their last email – this may stall the deal.", source: "Email from J. Park, Oct 22" },
    " preceding the event giving rise to the claim.",
  ],
  bodyLabel: "Clause 9.2",
});

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ReviewCenter } = ui;
  const [round, setRound] = useState(0);
  const [items, setItems] = useState(() => makeItems(Date.now()));
  const [lastAction, setLastAction] = useState("");

  // A new high-risk item slides into the queue a few seconds in
  useEffect(() => {
    const id = window.setTimeout(() => setItems((xs) => (xs.some((x) => x.id === "clause-liability") ? xs : [...xs, LATE(Date.now())])), 6000);
    return () => window.clearTimeout(id);
  }, [round]);

  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 8 }}>
      <ReviewCenter
        key={round}
        items={items}
        reviewed={11}
        sla={45 * MIN}
        title="Review"
        onDecide={(item, r) => setLastAction(`${r.decision === "approved" ? "Approved" : `Rejected (${r.reason ?? "no reason"})`}: ${item.title}`)}
        onUndo={(item) => setLastAction(`Undid: ${item.title}`)}
        onSkip={(item) => setLastAction(`Skipped: ${item.title}`)}
      />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
        <span>{lastAction || "Try A, E, R, S and Z – or point at the amber spans."}</span>
        <button
          type="button"
          onClick={() => { setItems(makeItems(Date.now())); setLastAction(""); setRound((r) => r + 1); }}
          style={buttonSm}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
