import type { ContractSpec } from "../contract.test";

const tips = [
  { id: "a", title: "First", description: "One", action: "Do it" },
  { id: "b", title: "Second", description: "Two", action: "Do it" },
];

// The root is the <section>; `done` lists the tips whose action was taken
export const spec: ContractSpec = {
  component: "TipsPanel",
  props: { tips },
  controlled: [
    {
      prop: "done",
      values: [["a"], ["a", "b"]],
      read: (root) => [...root.querySelectorAll("li[data-done]")].map((li) => (li.querySelector("p")!.textContent === "First" ? "a" : "b")),
    },
  ],
};
