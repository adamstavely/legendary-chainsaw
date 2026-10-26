import type { ContractSpec } from "../contract.test";

const records = [
  { year: "2025", team: "Core", points: 3 },
  { year: "2026", team: "Growth", points: 5 },
];
const dimensions = [
  { key: "year", label: "Year", values: ["2025", "2026"] },
  { key: "team", label: "Team", values: ["Core", "Growth"] },
];
const measures = [
  { key: "points", label: "Points", unit: "points", field: "points" },
  { key: "count", label: "Tasks", unit: "tasks" },
];
/** What a picker shows, mapped back to its key */
const picker = (root: HTMLElement, n: number) => root.querySelectorAll('[aria-haspopup="listbox"]')[n]?.textContent;
const keys: Record<string, string> = { Points: "points", Tasks: "count", Year: "year", Team: "team", None: "none" };

export const spec: ContractSpec = {
  component: "BreakdownChart",
  props: { records, dimensions, measures },
  ref: "root",
  controlled: [
    { prop: "measure", values: ["points", "count"], read: (root) => keys[picker(root, 0) ?? ""] },
    { prop: "slice", values: ["year", "team"], read: (root) => keys[picker(root, 1) ?? ""] },
    { prop: "segment", values: ["team", "none"], read: (root) => keys[picker(root, 2) ?? ""] },
    {
      prop: "hidden",
      values: [["Core"], []],
      read: (root) => [...root.querySelectorAll('[aria-pressed="false"]')].map((b) => b.textContent),
    },
  ],
};
