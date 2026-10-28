import type { ContractSpec } from "../../contract.test";

const say = (id: string, text: string) => ({ id, role: "user", text });
const a = [say("a", "Alpha")];

// The block is <tc-ai-side-pane> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/ai-side-pane.test.ts)
export const spec: ContractSpec = {
  component: "AiSidePane",
  props: { messages: a },
  root: "tc-ai-side-pane",
  ref: "root",
};
