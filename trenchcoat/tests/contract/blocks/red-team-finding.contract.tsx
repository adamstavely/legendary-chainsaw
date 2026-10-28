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

// The block is <tc-red-team-finding> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/red-team-finding.test.ts)
export const spec: ContractSpec = {
  root: "tc-red-team-finding",
  component: "RedTeamFinding",
  props: { findings },
  ref: "root",
};
