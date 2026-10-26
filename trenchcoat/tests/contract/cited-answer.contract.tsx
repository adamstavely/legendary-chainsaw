import type { ContractSpec } from "../contract.test";

const sources = [{ id: "s1", title: "Latency notes", site: "Notes", quote: "Latency fell by half." }];

export const spec: ContractSpec = {
  component: "CitedAnswer",
  props: { segments: [{ text: "Latency fell by half.", cite: ["s1"] }], sources },
  ref: "root",
  controlled: [
    {
      prop: "preview",
      values: [null, "s1"],
      read: (root) => (root.querySelector(".ui-ca__fold")?.hasAttribute("data-open") ? "s1" : null),
    },
  ],
};
