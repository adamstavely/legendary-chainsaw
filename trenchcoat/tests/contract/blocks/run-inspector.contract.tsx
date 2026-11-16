import type { ContractSpec } from "../../contract.test";

const root = { id: "run", name: "Run", kind: "agent" as const, status: "done" as const, start: 0, end: 1000 };

// The block is <tc-run-inspector> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/run-inspector.test.ts)
export const spec: ContractSpec = {
  root: "tc-run-inspector",
  component: "RunInspector",
  props: { root },
  ref: "root",
};
