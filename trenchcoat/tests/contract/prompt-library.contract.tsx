import type { ContractSpec } from "../contract.test";

const templates = [
  { id: "a", title: "Email", body: "Write to {name}." },
  { id: "b", title: "Recap", body: "Recap for {team}." },
];

export const spec: ContractSpec = {
  component: "PromptLibrary",
  props: { templates },
  ref: "root",
  controlled: [
    {
      prop: "value",
      values: ["a", "b"],
      read: (root) => (root.querySelector('[role="option"][aria-selected="true"]')!.textContent === "Recap" ? "b" : "a"),
    },
    {
      prop: "values",
      values: [{ a: { name: "Ana" } }, { a: { name: "Bo" } }],
      read: (root) => ({ a: { name: root.querySelector<HTMLInputElement>('.ui-pli__panel:not([data-out]) [data-var="name"]')!.value } }),
    },
  ],
};
