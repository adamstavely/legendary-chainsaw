import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TestRunTurn, TestRunVariable } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The institute's Policy Q&A agent, tried while its instructions are edited: one exchange in, with the policy search
   it ran folded into a row. Sending asks the "agent", which answers after a moment from a short script – one timeout
   while it replies, none at rest. */

const START: TestRunTurn[] = [
  { id: "u1", role: "user", text: "Can I claim a taxi from the airport after a late flight?" },
  {
    id: "a1",
    role: "agent",
    text: "Yes. Section 4.2 of the travel policy covers a taxi when you land after 21:00 or public transport isn't running. Keep the receipt and add the flight number to the claim.",
    tools: [
      {
        id: "t1",
        name: "search_policy",
        status: "success",
        summary: "Travel policy · 3 passages",
        duration: 640,
        args: { query: "taxi airport late arrival", collection: "travel-expense-2026" },
        result: [{ section: "4.2", title: "Ground transport", score: 0.91 }],
      },
    ],
  },
];

const VARS: TestRunVariable[] = [
  { key: "region", value: "EU" },
  { key: "grade", value: "Research fellow" },
];

const REPLY = "Meals on a travel day are covered up to the daily allowance for the region – €45 in the EU. Alcohol isn't claimable. Itemised receipts are needed for anything over €25.";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TestRunPanel } = ui;
  const [turns, setTurns] = useState<TestRunTurn[]>(START);
  const [pending, setPending] = useState<string | null>(null);
  const [saved, setSaved] = useState(0);

  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      setTurns((t) => t.map((x) => (x.id === pending ? { ...x, text: REPLY, streaming: false, tools: [{ id: `${pending}-t`, name: "search_policy", status: "success" as const, summary: "Expense policy · 2 passages", duration: 520, args: { query: "meal allowance travel day" } }] } : x)));
      setPending(null);
    }, 900);
    return () => clearTimeout(id);
  }, [pending]);

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 10 }}>
      <TestRunPanel
        agent="Policy Q&A"
        version="v14"
        turns={turns}
        onTurnsChange={setTurns}
        defaultVariables={VARS}
        onSend={(text) => {
          const n = turns.length;
          const reply = `a${n + 2}`;
          setTurns((t) => [...t, { id: `u${n + 1}`, role: "user", text }, { id: reply, role: "agent", text: "", streaming: true }]);
          setPending(reply);
        }}
        onSaveCase={() => setSaved((s) => s + 1)}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {saved ? `${saved} saved to the eval set. ` : "Ask about meal allowances, or save the reply as a test case. "}
        <button type="button" style={textButton} onClick={() => setTurns(START)}>
          Start over
        </button>
      </div>
    </div>
  );
}
