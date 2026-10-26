import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunCompareRun, RunCompareStep, RunCompareView } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Prompt v3 against v4 on the same support ticket. v3 is done; v4 streams in – its steps land as it goes, its
   answer arrives a few words at a time, and the diff follows. One timeout at a time, none once it is done. */

const TICK = 110;

const V3_PROMPT =
  "You are a support agent for Brightline Home. Be polite and thorough. Always confirm the refund amount and the timeline, and close by offering further help.";
const V4_PROMPT =
  "You are a support agent for Brightline Home. Be warm and brief – three sentences at most. Confirm the refund amount and the timeline, and offer a replacement when the item is in stock.";

const V3_OUTPUT =
  "Hi Dana, thanks for reaching out. I'm sorry the blender arrived damaged. I've started a refund of $89.00 to your original payment method, and it should appear within 5–7 business days. You don't need to return the item. Let me know if there's anything else I can help with.";
const V4_OUTPUT =
  "Hi Dana – sorry the blender arrived cracked. Your refund of $89.00 is on its way to the card you paid with and should appear within 3–5 business days. No need to send it back – or would you like a replacement instead? We have it in stock.";

const V3_STEPS: RunCompareStep[] = [
  { name: "lookup_order", detail: "Order #48213 · Vitamix E310 · delivered Oct 22", duration: 420 },
  { name: "check_policy", detail: "Damaged on arrival → full refund, no return", duration: 310 },
  { name: "issue_refund", detail: "$89.00 to Visa ···· 4242", duration: 880 },
  { name: "draft_reply", detail: "86 words", duration: 2900 },
  { name: "tone_check", detail: "Passed", duration: 600 },
];
const V4_STEPS: RunCompareStep[] = [
  { name: "lookup_order", detail: "Order #48213 · Vitamix E310 · delivered Oct 22", duration: 390 },
  { name: "check_policy", detail: "Damaged on arrival → full refund, no return", duration: 300 },
  { name: "issue_refund", detail: "$89.00 to Visa ···· 4242", duration: 850 },
  { name: "check_stock", detail: "Vitamix E310 · 14 in the Austin warehouse", duration: 270 },
  { name: "draft_reply", detail: "47 words", duration: 2100 },
];

const BASELINE: RunCompareRun = {
  id: "v3",
  label: "Prompt v3",
  model: "Claude Sonnet",
  status: "done",
  prompt: V3_PROMPT,
  output: V3_OUTPUT,
  steps: V3_STEPS,
  duration: 5110,
  cost: 0.031,
  tokens: 8240,
  score: 82,
};

const WORDS = V4_OUTPUT.split(/(?<= )/);
/** Ticks before the answer starts: the steps before draft_reply land first */
const LEAD = 8;
const END = LEAD + Math.ceil(WORDS.length / 2);

function candidateAt(t: number): RunCompareRun {
  const done = t >= END;
  // The first four steps land one every two ticks; draft_reply once the answer starts
  const steps = V4_STEPS.slice(0, Math.min(4, Math.floor(t / 2))).concat(t >= LEAD ? [done ? V4_STEPS[4] : { name: "draft_reply", detail: "Writing…" }] : []);
  const words = Math.max(0, (t - LEAD) * 2);
  const share = Math.min(1, t / END);
  return {
    id: "v4",
    label: "Prompt v4",
    model: "Claude Sonnet",
    status: done ? "done" : "running",
    prompt: V4_PROMPT,
    output: WORDS.slice(0, words).join("").trimEnd(),
    steps,
    duration: Math.round(3910 * share),
    cost: +(0.024 * share).toFixed(4),
    tokens: Math.round(6120 * share),
    score: done ? 91 : undefined,
  };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunCompare } = ui;
  const [t, setT] = useState(0);
  const [view, setView] = useState<RunCompareView>("output");
  const [kept, setKept] = useState<string | null>(null);
  const done = t >= END;

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setT((n) => n + 1), TICK);
    return () => clearTimeout(id);
  }, [t, done]);

  const candidate = useMemo(() => candidateAt(t), [t]);

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <RunCompare
        title="Refund reply · ticket #8812"
        baseline={BASELINE}
        candidate={candidate}
        view={view}
        onViewChange={setView}
        onPick={(p) => setKept(p.run.label)}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {kept ? `Kept ${kept} as the live prompt. ` : done ? "Both runs are through. " : "Prompt v4 is running… "}
        {done && (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setT(0);
              setKept(null);
            }}
          >
            Run v4 again
          </button>
        )}
      </div>
    </div>
  );
}
