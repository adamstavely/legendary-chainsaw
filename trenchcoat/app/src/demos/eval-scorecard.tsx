import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EvalCase, EvalOutcome, EvalScorecardOpen, EvalVersion } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A support assistant's eval set: 2,400 cases against five prompt versions. v1–v4 are in; v5 runs when the demo
   mounts – its results land a tenth at a time and the trend follows. One timeout at a time, none once it is done. */

const COUNT = 2400;
const STEPS = 10;
const TICK = 260;

const VERSIONS: EvalVersion[] = [
  { id: "v1", label: "v1", detail: "Sonnet" },
  { id: "v2", label: "v2", detail: "Sonnet" },
  { id: "v3", label: "v3", detail: "Sonnet" },
  { id: "v4", label: "v4", detail: "Opus" },
  { id: "v5", label: "v5", detail: "Opus" },
];

type Template = { name: string; tags: string[]; input: string; expected: string; wrong: string; reason: string };
const TEMPLATES: Template[] = [
  {
    name: "Refund for a damaged blender",
    tags: ["refunds"],
    input: "My blender arrived cracked. Order #48213. Can I get my money back?",
    expected: "Sorry it arrived cracked. I've refunded $89.00 to your card – it should appear within 3–5 business days, and you don't need to send it back.",
    wrong: "Sorry it arrived cracked. Please send it back to us and we'll refund you once it arrives at our warehouse.",
    reason: "Asked for a return the policy waives",
  },
  {
    name: "Late parcel, tracking stalled",
    tags: ["shipping"],
    input: "Tracking hasn't moved in six days. Where is my order?",
    expected: "I'm sorry for the wait. Your parcel is held at the Memphis hub; I've asked the carrier to trace it and will email you by Friday.",
    wrong: "I'm sorry for the wait. Your parcel is on its way and should arrive soon.",
    reason: "Didn't give the hub or a date",
  },
  {
    name: "Charged twice for one plan",
    tags: ["billing", "refunds"],
    input: "I see two charges of $24 for my March subscription.",
    expected: "You're right – the second $24.00 charge was a duplicate. I've refunded it; it will show within 5 business days.",
    wrong: "You're right – the second $24.00 charge was a duplicate. Please contact your bank to dispute it.",
    reason: "Sent the customer to their bank",
  },
  {
    name: "Angry customer, third contact",
    tags: ["tone", "escalation"],
    input: "This is the THIRD time I'm writing. Nobody reads these.",
    expected: "I'm sorry you've had to write three times – that shouldn't happen. I've read your earlier messages and I'm passing this to a team lead now.",
    wrong: "Thanks for reaching out! We're always happy to help. Could you tell us more about your issue?",
    reason: "Ignored the earlier messages",
  },
  {
    name: "Reply in Spanish",
    tags: ["multilingual"],
    input: "¿Puedo cambiar la dirección de envío?",
    expected: "Sí – he cambiado la dirección de envío. Recibirás la confirmación por correo en unos minutos.",
    wrong: "Yes – I've changed the shipping address. You'll get a confirmation email in a few minutes.",
    reason: "Answered in English",
  },
  {
    name: "Cancel before renewal",
    tags: ["billing"],
    input: "Please cancel my plan before it renews on the 14th.",
    expected: "Done – your plan won't renew on the 14th. You keep access until then, and you won't be charged again.",
    wrong: "Done – your plan is cancelled as of today and access has ended.",
    reason: "Ended access early",
  },
];

/** A seeded generator, so the demo draws the same cases every time */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** Each version passes a little more often than the one before – except v3, which regressed on tone */
const PASS: Record<string, (t: Template) => number> = {
  v1: () => 0.68,
  v2: () => 0.76,
  v3: (t) => (t.tags.includes("tone") ? 0.52 : 0.81),
  v4: (t) => (t.tags.includes("multilingual") ? 0.7 : 0.86),
  v5: (t) => (t.tags.includes("multilingual") ? 0.9 : 0.89),
};

function build(): EvalCase[] {
  const rnd = seeded(7);
  return Array.from({ length: COUNT }, (_, i) => {
    const t = TEMPLATES[i % TEMPLATES.length];
    const results: EvalCase["results"] = {};
    // How hard the case is: the same for every version, plus a little noise – so a case that passes tends to keep passing
    const hard = rnd();
    for (const v of VERSIONS) {
      const roll = Math.min(0.999, Math.max(0, hard + (rnd() - 0.5) * 0.16));
      const outcome: EvalOutcome = roll < PASS[v.id](t) ? "pass" : roll > 0.99 ? "error" : "fail";
      results[v.id] =
        outcome === "pass"
          ? { outcome, output: t.expected, score: (0.86 + rnd() * 0.14).toFixed(2) }
          : outcome === "fail"
            ? { outcome, output: t.wrong, score: (0.2 + rnd() * 0.3).toFixed(2), reason: t.reason }
            : { outcome, reason: "Timed out after 30s" };
    }
    return { id: `case-${i + 1}`, name: `${t.name} #${Math.floor(i / TEMPLATES.length) + 1}`, tags: t.tags, input: t.input, expected: t.expected, results };
  });
}

const ALL = build();
// Opens on a case v4 fails, so the side-by-side shows from the start
const FIRST_FAIL = ALL.find((c) => c.results.v4?.outcome === "fail" && c.results.v3?.outcome === "pass")!;

/** v5's results land a tenth of the cases at a time */
function at(step: number): { versions: EvalVersion[]; cases: EvalCase[] } {
  if (step >= STEPS) return { versions: VERSIONS, cases: ALL };
  const upto = Math.floor((COUNT * step) / STEPS);
  return {
    versions: VERSIONS.map((v) => (v.id === "v5" ? { ...v, status: "running" } : v)),
    cases: ALL.map((c, i) => (i < upto ? c : { ...c, results: { ...c.results, v5: { outcome: "pending" } } })),
  };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EvalScorecard } = ui;
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState<EvalScorecardOpen | null>({ caseId: FIRST_FAIL.id, versionId: "v4" });
  const done = step >= STEPS;

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setStep((n) => n + 1), TICK);
    return () => clearTimeout(id);
  }, [step, done]);

  const data = useMemo(() => at(step), [step]);

  return (
    <div style={{ width: "100%", maxWidth: 880, display: "grid", gap: 10 }}>
      <EvalScorecard title="Support replies" versions={data.versions} cases={data.cases} open={open} onOpenChange={setOpen} />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {done ? "v5 is through. " : `v5 is running… ${Math.round((step / STEPS) * 100)}% `}
        {done && (
          <button type="button" style={textButton} onClick={() => setStep(0)}>
            Run v5 again
          </button>
        )}
      </div>
    </div>
  );
}
