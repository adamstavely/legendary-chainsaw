import type { ContractSpec } from "../contract.test";

const one = [{ id: "a", label: "Write brief", done: true }];
const two = [
  { id: "a", label: "Write brief", done: false },
  { id: "b", label: "Review", done: false },
];
const statusIds: Record<string, string> = { "To do": "todo", "In review": "review" };

export const spec: ContractSpec = {
  component: "ProjectCard",
  props: { title: "Onboarding", defaultTasks: two },
  ref: "root",
  controlled: [
    { prop: "open", values: [true, false], read: (root) => root.querySelector('[class$="__toggle"]')?.getAttribute("aria-expanded") === "true" },
    { prop: "status", values: ["todo", "review"], read: (root) => statusIds[root.querySelector('[role="radio"][aria-checked="true"]')?.textContent ?? ""] },
    {
      prop: "tasks",
      values: [one, two],
      read: (root) =>
        [...root.querySelectorAll('[role="checkbox"]')].map((t, i) => ({ id: "ab"[i], label: t.textContent, done: t.getAttribute("aria-checked") === "true" })),
    },
  ],
};
