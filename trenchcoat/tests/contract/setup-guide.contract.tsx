import type { ContractSpec } from "../contract.test";

const groups = [
  {
    id: "g",
    title: "Basics",
    tasks: [
      { id: "a", label: "First" },
      { id: "b", label: "Second" },
    ],
  },
  { id: "h", title: "Launch", tasks: [{ id: "c", label: "Third" }] },
];

const pressed = (root: HTMLElement) =>
  [...root.querySelectorAll(".ui-sg__task")].filter((b) => b.getAttribute("aria-checked") === "true").map((b) => b.textContent);

// The root is the <section>; finished tasks, the open group and the minimized state are all controllable
export const spec: ContractSpec = {
  component: "SetupGuide",
  props: { groups },
  controlled: [
    { prop: "done", values: [["a"], ["a", "b"]], read: (root) => pressed(root).map((t) => ({ First: "a", Second: "b", Third: "c" })[t!]) },
    {
      prop: "openGroup",
      values: ["g", "h"],
      read: (root) => ({ Basics: "g", Launch: "h" })[root.querySelector('.ui-sg__group[data-open] .ui-sg__group-title')?.textContent ?? ""],
    },
    { prop: "minimized", values: [false, true], read: (root) => root.querySelector(".ui-sg__body")!.hasAttribute("data-hidden") },
  ],
};
