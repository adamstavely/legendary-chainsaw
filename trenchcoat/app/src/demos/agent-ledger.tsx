import { useEffect, useState } from "react";
import type * as UI from "@components/agent-ledger";
import type { LedgerEntry } from "@components/agent-ledger";

/* A launch agent making changes across your tools: a new entry slides in every few seconds until the launch is
   done, then the ledger holds and starts over. Point at a row's time to Undo it and see what builds on it. */

const Logo = ({ bg, letter }: { bg: string; letter: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <rect width="16" height="16" rx="4" fill={bg} />
    <text x="8" y="11.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
      {letter}
    </text>
  </svg>
);
const STRIPE = <Logo bg="#635bff" letter="S" />;
const SHOPIFY = <Logo bg="#5e8e3e" letter="S" />;
const MAIL = <Logo bg="#f59e0b" letter="M" />;
const CMS = <Logo bg="#111827" letter="W" />;
const SLACK = <Logo bg="#4a154b" letter="#" />;

type Draft = Omit<LedgerEntry, "at">;
const SCRIPT: Draft[] = [
  { id: "price", action: "Changed price", target: "Pro plan", system: "Stripe", icon: STRIPE, change: ["$29 / mo", "$34 / mo"] },
  { id: "coupon", action: "Created coupon", target: "EARLY20", system: "Stripe", icon: STRIPE, detail: "20% off the first 3 months", dependsOn: ["price"] },
  { id: "page", action: "Updated pricing page", target: "/pricing", system: "Webflow", icon: CMS, change: ["$29", "$34 · 20% off with EARLY20"], dependsOn: ["price", "coupon"] },
  { id: "product", action: "Published product", target: "Pro annual", system: "Shopify", icon: SHOPIFY, change: ["Draft", "Active"], dependsOn: ["price"] },
  { id: "email", action: "Sent email", target: "4,812 subscribers", system: "Mailchimp", icon: MAIL, detail: "“Pro just got better – 20% off this week”", reversible: false, dependsOn: ["page", "coupon"] },
  { id: "post", action: "Posted announcement", target: "#launches", system: "Slack", icon: SLACK, detail: "Pricing update is live", dependsOn: ["page"] },
];

const BEAT = 2600;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentLedger } = ui;
  const [now, setNow] = useState(() => Date.now());
  const [entries, setEntries] = useState<LedgerEntry[]>(() => {
    // Two changes are already there, a few minutes old
    const t = Date.now();
    return [
      { ...SCRIPT[0], at: t - 6 * 60_000 },
      { ...SCRIPT[1], at: t - 4 * 60_000 },
    ];
  });
  const [undone, setUndone] = useState<string[]>([]);

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    // Beats 1–4 add the remaining changes; the full ledger then holds until beat 12 and starts over
    let beat = 0;
    const id = setInterval(() => {
      beat = (beat + 1) % 12;
      if (beat === 0) {
        const t = Date.now();
        setUndone([]);
        setEntries([
          { ...SCRIPT[0], at: t - 6 * 60_000 },
          { ...SCRIPT[1], at: t - 4 * 60_000 },
        ]);
      } else if (beat <= SCRIPT.length - 2) {
        const next = SCRIPT[beat + 1];
        setEntries((es) => (es.some((e) => e.id === next.id) ? es : [...es, { ...next, at: Date.now() }]));
      }
    }, BEAT);
    return () => {
      clearInterval(clock);
      clearInterval(id);
    };
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <AgentLedger
        title="Ledger"
        agent="Launch agent"
        entries={entries}
        now={now}
        undone={undone}
        onUndo={(ids) => setUndone((u) => [...new Set([...u, ...ids])])}
        onRedo={(ids) => setUndone((u) => u.filter((x) => !ids.includes(x)))}
      />
    </div>
  );
}
