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

export const spec: ContractSpec = {
  component: "AgentGallery",
  props: { items },
  ref: "root",
  controlled: [
    {
      prop: "index",
      values: [0, 3],
      // The caption names the open agent
      read: (root) => items.findIndex((i) => `${i.name}.` === root.querySelector(".ui-ag__caption b")?.textContent),
    },
  ],
};
