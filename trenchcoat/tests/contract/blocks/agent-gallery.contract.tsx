import type { ContractSpec } from "../../contract.test";

const item = (id: string, name: string) => ({
  id,
  name,
  description: `${name} does things.`,
  colors: ["#8b5cf6", "#e9d5ff"],
  trigger: "Ticket created",
  steps: ["One.", "Two.", "Three."],
  skills: ["Classify"],
  guardrail: "Cannot close tickets",
});
const items = [item("a", "Alpha"), item("b", "Beta"), item("c", "Gamma"), item("d", "Delta")];

// The block is <tc-agent-gallery> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an
// element's properties, so controlled `index` is checked in a real browser (tests/elements/agent-gallery.test.ts)
export const spec: ContractSpec = {
  root: "tc-agent-gallery",
  component: "AgentGallery",
  props: { items },
  ref: "root",
};
