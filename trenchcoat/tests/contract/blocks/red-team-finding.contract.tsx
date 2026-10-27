import type { ContractSpec } from "../../contract.test";

const finding = (id: string, code: string) => ({
  id,
  code,
  title: `Finding ${code}`,
  severity: "high",
  status: "open",
  opened: "1h ago",
  summary: "Something broke.",
  invariants: [{ id: "i", rule: "rule.must-hold" }],
  scenario: { id: "s", description: "A scenario." },
});
const findings = [finding("a", "F-1"), finding("b", "F-2")];

export const spec: ContractSpec = {
  component: "RedTeamFinding",
  props: { findings },
  ref: "root",
  controlled: [
    {
      prop: "finding",
      values: ["a", "b"],
      read: (root) => findings.find((f) => f.code === root.querySelector('[role="option"][aria-selected="true"] .ui-rtf__code')?.textContent)?.id,
    },
  ],
};
