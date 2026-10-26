import type { ContractSpec } from "../contract.test";

// Reads the memories back from the rows: id, text and the group they sit in
const rows = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>("[data-memory]")].map((el) => ({
    id: el.dataset.memory,
    text: el.querySelector(".ui-mp__text")!.textContent,
    category: el.closest("section")!.getAttribute("aria-label"),
  }));

export const spec: ContractSpec = {
  component: "MemoryPanel",
  props: { defaultMemories: [{ id: "a", text: "Likes tea", category: "Preferences" }] },
  ref: "root",
  controlled: [
    {
      prop: "memories",
      values: [
        [{ id: "a", text: "Likes tea", category: "Preferences" }],
        [
          { id: "b", text: "Works in Berlin", category: "Work" },
          { id: "c", text: "Uses metric units", category: "Preferences" },
        ],
      ],
      read: rows,
    },
    {
      prop: "enabled",
      values: [true, false],
      read: (root) => root.querySelector('[role="switch"]')!.getAttribute("aria-checked") === "true",
    },
  ],
};
