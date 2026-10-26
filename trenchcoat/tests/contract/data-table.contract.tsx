import type { ContractSpec } from "../contract.test";

const columns = [
  { key: "name", label: "Name", type: "title" },
  { key: "seats", label: "Seats", type: "number" },
];
const a = [{ id: "a", name: "Northwind", seats: 12 }];
const b = [
  { id: "b", name: "Contoso", seats: 40 },
  { id: "c", name: "Fabrikam", seats: 7 },
];
const rowsById: Record<string, unknown> = { Northwind: a, "Contoso|Fabrikam": b };
const names = (root: HTMLElement) => [...root.querySelectorAll('tbody [class$="__name-text"]')].map((n) => n.textContent).join("|");

export const spec: ContractSpec = {
  component: "DataTable",
  props: { title: "Accounts", columns, defaultRows: b },
  ref: "root",
  controlled: [
    { prop: "rows", values: [a, b], read: (root) => rowsById[names(root)] },
    {
      prop: "selection",
      values: [["b"], ["b", "c"]],
      read: (root) =>
        [...root.querySelectorAll('tbody [role="checkbox"][aria-checked="true"]')].map((c) => ({ "Select Contoso": "b", "Select Fabrikam": "c" })[c.getAttribute("aria-label")!]),
    },
    {
      prop: "sort",
      values: [
        { key: "seats", dir: "asc" },
        { key: "seats", dir: "desc" },
      ],
      read: (root) => {
        const th = root.querySelector('[aria-sort]:not([aria-sort="none"])');
        return th && { key: th.getAttribute("data-type") === "number" ? "seats" : "name", dir: th.getAttribute("aria-sort") === "ascending" ? "asc" : "desc" };
      },
    },
  ],
};
