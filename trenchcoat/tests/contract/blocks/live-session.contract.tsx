import type { ContractSpec } from "../../contract.test";

const participants = [{ id: "you", name: "You", kind: "person" as const }];

// The block is <tc-live-session> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/live-session.test.ts)
export const spec: ContractSpec = {
  root: "tc-live-session",
  component: "LiveSession",
  props: { participants, messages: [], steps: [] },
  ref: "root",
};
