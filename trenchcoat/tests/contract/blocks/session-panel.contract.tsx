import type { ContractSpec } from "../../contract.test";

// The block is <tc-session-panel> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/session-panel.test.ts)
export const spec: ContractSpec = {
  root: "tc-session-panel",
  component: "SessionPanel",
  props: { outputs: "51" },
  ref: "root",
};
