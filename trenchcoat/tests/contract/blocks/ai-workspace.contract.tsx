import type { ContractSpec } from "../../contract.test";

const chat = (id: string, title: string) => ({ id, title, messages: [{ id: `${id}-m`, role: "user", text: title }] });
const a = [chat("a", "Alpha")];

// The block is <tc-ai-workspace> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/ai-workspace.test.ts)
export const spec: ContractSpec = {
  component: "AiWorkspace",
  props: { defaultConversations: a },
  root: "tc-ai-workspace",
  ref: "root",
};
