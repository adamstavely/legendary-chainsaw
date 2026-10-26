import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PolicyDecision, PolicySimExample, PolicySimInput, PolicySimResult, PolicyTraceStep } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A small policy set, checked in order – hard stops, then denials, then approvals, then allowances. The demo's
   evaluate() runs it with a short delay, as a policy service would; nothing is ever executed. */

type Rule = { id: string; name: string; classes: string[]; decision: PolicyDecision; test: (i: PolicySimInput) => string | null; miss: string };

const amount = (ctx: string) => Number(ctx.match(/amount:\s*\$?([\d,]+)/i)?.[1]?.replace(/,/g, "") ?? 0);
const RULES: Rule[] = [
  { id: "HS-01", name: "Production data deletion", classes: ["delete"], decision: "hard-stop", test: (i) => (/\bprod(uction)?\b/i.test(i.context + i.action) ? "Targets the production environment" : null), miss: "Not production" },
  { id: "D-12", name: "Personal data to third parties", classes: ["communicate"], decision: "deny", test: (i) => (/personal data|customer list|\bpii\b/i.test(i.context + i.action) && /external|vendor|partner/i.test(i.context + i.action) ? "Personal data leaves the company" : null), miss: "No personal data leaves the company" },
  { id: "AP-20", name: "Payments over $1,000", classes: ["spend"], decision: "require-approval", test: (i) => (amount(i.context) > 1000 ? `$${amount(i.context).toLocaleString("en-US")} is over the $1,000 limit` : null), miss: "Under the $1,000 limit" },
  { id: "AP-31", name: "External recipients", classes: ["communicate"], decision: "require-approval", test: (i) => (/external|partner|vendor|@(?!northwind)/i.test(i.context) ? "The recipient is outside the company" : null), miss: "Every recipient is internal" },
  { id: "AL-40", name: "Read-only lookups", classes: ["read"], decision: "allow", test: () => "Reads only; changes nothing", miss: "" },
  { id: "AL-41", name: "Small internal changes", classes: ["write", "spend"], decision: "allow", test: (i) => (amount(i.context) <= 1000 ? "Within the everyday limits" : null), miss: "Over the everyday limits" },
];
const SOURCE = "Agent policy · v14";

function evaluateSync(input: PolicySimInput): PolicySimResult {
  const trace: PolicyTraceStep[] = [];
  let decided: { rule: Rule; why: string } | null = null;
  RULES.forEach((rule, n) => {
    const ms = 3 + ((n * 7 + input.action.length) % 9);
    if (decided) return trace.push({ rule: rule.name, ruleId: rule.id, outcome: "skipped" });
    if (!rule.classes.includes(input.ruleClass)) return trace.push({ rule: rule.name, ruleId: rule.id, outcome: "skipped", detail: `Only for ${rule.classes.join(" and ")}` });
    const why = rule.test(input);
    if (why) {
      decided = { rule, why };
      return trace.push({ rule: rule.name, ruleId: rule.id, outcome: "matched", decision: rule.decision, detail: why, ms });
    }
    trace.push({ rule: rule.name, ruleId: rule.id, outcome: "no-match", detail: rule.miss, ms });
  });
  const d = decided as { rule: Rule; why: string } | null;
  if (!d) return { decision: "require-approval", reason: "No rule covers this action, so the default applies: a person approves it first.", trace };
  const reasons: Record<PolicyDecision, string> = {
    allow: `${d.why}, so the agent may go ahead without asking.`,
    "require-approval": `${d.why}, so a person on the finance or ops rota approves it first.`,
    deny: `${d.why}. The agent is told no and the attempt is logged.`,
    "hard-stop": `${d.why}. The run stops and the on-call owner is paged – no one can approve this from the run.`,
  };
  return { decision: d.rule.decision, rule: { id: d.rule.id, name: d.rule.name, source: SOURCE }, reason: reasons[d.rule.decision], trace };
}

const EXAMPLES: PolicySimExample[] = [
  { label: "Refund $2,400", action: "Refund invoice INV-2291 in full", ruleClass: "spend", context: "amount: $2,400 · customer: Harbor & Co" },
  { label: "Email a partner", action: "Email the Q3 forecast to Lumen", ruleClass: "communicate", context: "recipient: j.okafor@lumen.co (external)" },
  { label: "Share customer list", action: "Send the customer list to the survey vendor", ruleClass: "communicate", context: "contains personal data · recipient: vendor" },
  { label: "Delete old backups", action: "Delete backups older than 90 days", ruleClass: "delete", context: "environment: production · 214 snapshots" },
  { label: "Look up an invoice", action: "Find the latest invoice for Fieldstone", ruleClass: "read" },
];
const START: PolicySimInput = { action: EXAMPLES[0].action, ruleClass: "spend", context: EXAMPLES[0].context! };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PolicySimulator } = ui;
  const [result, setResult] = useState<PolicySimResult>(() => evaluateSync(START));
  const [note, setNote] = useState("Pick an example or describe an action – Simulate checks it against the policy.");
  return (
    <div style={{ width: "100%", maxWidth: 580, display: "grid", gap: 8 }}>
      <PolicySimulator
        description="Check what the policy would do with an agent's action before it happens."
        defaultValue={START}
        examples={EXAMPLES}
        result={result}
        evaluate={(input) => new Promise<PolicySimResult>((resolve) => setTimeout(() => resolve(evaluateSync(input)), 650))}
        onResult={(r) => {
          setResult(r);
          const n = r.trace.filter((s) => s.outcome !== "skipped").length;
          setNote(`Checked ${n} ${n === 1 ? "rule" : "rules"} – nothing was executed.`);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note}</div>
    </div>
  );
}
