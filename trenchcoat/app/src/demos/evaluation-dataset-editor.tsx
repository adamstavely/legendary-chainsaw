import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EvaluationCase, EvaluationDatasetValue, EvaluationDatasetVersion } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A support team's reply evals: 2,400 cases across train, validation and test. v3 is last week's snapshot; since then a
   dozen refund cases were added (one with a schema check that doesn't parse yet), four were edited and three removed.
   Import reads a batch the team has ready; Export says what would be written. */

const TOPICS: [string, string, string, string[]][] = [
  ["Where is my order {n}? It said two days.", "Gives the tracking link and the carrier's latest scan", "tracking", ["shipping"]],
  ["Can I get a refund for order {n}? It arrived broken.", "Offers a refund or a replacement and asks for a photo", "refund", ["refunds"]],
  ["I was charged twice for invoice {n}.", "Confirms the duplicate charge and says it is reversed in 3–5 days", "reversed", ["billing"]],
  ["How do I change the email on my account?", "Points to Settings → Profile and explains the confirmation email", "Settings", ["account"]],
  ["Cancel my subscription before the {n}th.", "Cancels at the end of the period and states the last billing date", "end of the period", ["billing", "churn"]],
  ["The app logs me out every few minutes.", "Asks for the app version and suggests clearing the session", "app version", ["account", "bug"]],
  ["Do you ship to Norway? Order {n} is waiting.", "Lists the countries served and the customs note for Norway", "customs", ["shipping", "international"]],
  ["What is your return window for sale items?", "States 30 days for sale items, unworn, with tags", "30 days", ["refunds", "policy"]],
];
const SPLITS = ["train", "train", "train", "train", "train", "train", "train", "validation", "test", "test"];

function makeCase(i: number): EvaluationCase {
  const [q, expected, must, tags] = TOPICS[i % TOPICS.length];
  const n = 10_400 + ((i * 37) % 9_000);
  const checks = i % 3 === 0 ? [{ id: "c1", type: "contains", value: must }] : i % 5 === 1 ? [{ id: "c1", type: "rubric", value: "Apologises once, then gets to the answer" }] : [];
  return { id: `case-${String(i + 1).padStart(4, "0")}`, input: q.replace("{n}", String(n)), ...(i % 7 === 6 ? {} : { expected }), assertions: checks, tags: i % 4 === 0 ? [...tags, "priority"] : tags, split: SPLITS[(i * 7) % SPLITS.length] };
}

const BASE = Array.from({ length: 2_391 }, (_, i) => makeCase(i));
const REMOVED = new Set(["case-0012", "case-0450", "case-1203"]);
const EDITED = new Set(["case-0003", "case-0018", "case-0101", "case-0777"]);
const ADDED: EvaluationCase[] = Array.from({ length: 12 }, (_, i) => ({
  id: `case-r${i + 1}`,
  input: ["Refund to a card that has expired?", "Partial refund for a missing item in order 51{n}", "Refund for a gift – who gets the money?"][i % 3].replace("{n}", String(200 + i)),
  expected: "Explains where the money goes and how long it takes",
  assertions:
    i === 0
      ? [{ id: "c1", type: "schema", value: '{ "type": "object", "required": ["refund_id", "amount"]' }]
      : [{ id: "c1", type: "contains", value: i % 2 ? "5–10 business days" : "original payment method" }],
  tags: ["refunds", "new-policy"],
  split: i % 4 === 3 ? "test" : "train",
}));
const START: EvaluationDatasetValue = {
  cases: [
    ...ADDED.slice(0, 1),
    ...BASE.filter((c) => !REMOVED.has(c.id)).map((c) => (EDITED.has(c.id) ? { ...c, expected: `${c.expected ?? "Answers the question"} – and links the help article`, tags: [...c.tags, "reviewed"] } : c)),
    ...ADDED.slice(1),
  ],
};
const VERSIONS: EvaluationDatasetVersion[] = [
  { id: "v2", label: "v2", detail: "Sep 28", cases: BASE.slice(0, 2_200) },
  { id: "v3", label: "v3", detail: "Oct 19", cases: BASE },
];

/* The batch "in the file" Import reads */
const BATCH = Array.from({ length: 60 }, (_, i) =>
  JSON.stringify({ id: `import-${i + 1}`, input: `Order ${70_100 + i} came with the wrong size – exchange or refund?`, expected: "Offers a free exchange first, refund if they prefer", assertions: [{ type: "contains", value: "exchange" }], tags: ["refunds", "sizing"], split: i % 5 === 4 ? "validation" : "train" }),
).join("\n");

const size = (bytes: number) => (bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1_000)} KB`);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EvaluationDatasetEditor, evaluationDatasetFromJsonl } = ui;
  const [value, setValue] = useState(START);
  const [open, setOpen] = useState<string | null>(ADDED[0].id);
  const [imported, setImported] = useState(false);
  const [note, setNote] = useState("Compared with v3: new and edited cases are marked. Import adds a batch of 60 sizing cases.");
  return (
    <div style={{ width: "100%", maxWidth: 1040, display: "grid", gap: 8 }}>
      <EvaluationDatasetEditor
        title="Support replies"
        description="Billing, shipping and refunds"
        name="dataset"
        value={value}
        onChange={setValue}
        versions={VERSIONS}
        defaultCompare="v3"
        open={open}
        onOpenChange={setOpen}
        onImport={() => {
          if (imported) return setNote("That batch is already in the set.");
          const { value: batch, errors } = evaluationDatasetFromJsonl(BATCH);
          setValue((v) => ({ cases: [...v.cases, ...batch.cases] }));
          setImported(true);
          setNote(`Imported ${batch.cases.length} cases from sizing-batch.jsonl${errors.length ? ` – ${errors.length} lines skipped` : ""}.`);
        }}
        onExport={(v, jsonl) => setNote(`Exported ${v.cases.length.toLocaleString("en-US")} cases as JSON Lines – ${size(new Blob([jsonl]).size)}.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note}</div>
    </div>
  );
}
