import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentAction, AutonomyLevel } from "../../../src/elements/react";

/* The dial steps through its three levels on its own so the actions glide between the groups; as soon as you
   click a level or a lock, it's yours. "Issue refund" starts pinned to Asks you first. */

const g = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Read = () => (<svg {...g}><path d="M2 4.5c2-1 4-1 6 0v8c-2-1-4-1-6 0zM8 4.5c2-1 4-1 6 0v8c-2-1-4-1-6 0z" /></svg>);
const Tag = () => (<svg {...g}><path d="M2.5 8.5V3a.5.5 0 0 1 .5-.5h5.5l5 5-6 6z" /><circle cx="5.5" cy="5.5" r="1" /></svg>);
const Reply = () => (<svg {...g}><path d="M6 4 2.5 7.5 6 11M3 7.5h6.5a4 4 0 0 1 4 4V12" /></svg>);
const Send = () => (<svg {...g}><path d="M14 2 7 9M14 2l-4.5 12L7 9 2 6.5z" /></svg>);
const Card = () => (<svg {...g}><rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path d="M2 6.5h12M4.5 10h2" /></svg>);
const Trash = () => (<svg {...g}><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" /></svg>);
const Merge = () => (<svg {...g}><circle cx="4.5" cy="3.5" r="1.5" /><circle cx="4.5" cy="12.5" r="1.5" /><circle cx="11.5" cy="8" r="1.5" /><path d="M4.5 5v6M4.5 6c0 2 2 2 5.5 2" /></svg>);

const ACTIONS: AgentAction[] = [
  { id: "read", label: "Read tickets", detail: "Zendesk · all queues", risk: "safe", icon: <Read /> },
  { id: "tag", label: "Tag and route", detail: "Zendesk · priority, team", risk: "safe", icon: <Tag /> },
  { id: "draft", label: "Draft replies", detail: "Saved as internal notes", risk: "safe", icon: <Reply /> },
  { id: "send", label: "Send replies", detail: "Gmail · to customers", risk: "risky", icon: <Send /> },
  { id: "merge", label: "Merge duplicates", detail: "Zendesk · same requester", risk: "risky", icon: <Merge /> },
  { id: "refund", label: "Issue refund", detail: "Stripe · up to $200", risk: "risky", icon: <Card /> },
  { id: "delete", label: "Delete spam tickets", detail: "Zendesk · permanently", risk: "destructive", icon: <Trash /> },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AutonomyDial } = ui;
  const [level, setLevel] = useState<AutonomyLevel>(1);
  const [pinned, setPinned] = useState<string[]>(["refund"]);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const order: AutonomyLevel[] = [1, 2, 1, 0];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % order.length;
      setLevel(order[i]);
    }, 2600);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <AutonomyDial
        title="Support agent"
        subtitle="What it may do on its own in the support inbox"
        actions={ACTIONS}
        level={level}
        onLevelChange={(l) => {
          setAuto(false);
          setLevel(l);
        }}
        pinned={pinned}
        onPinnedChange={(p) => {
          setAuto(false);
          setPinned(p);
        }}
      />
    </div>
  );
}
