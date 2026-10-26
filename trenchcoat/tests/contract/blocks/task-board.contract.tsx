import type { ContractSpec } from "../../contract.test";

const task = (id: string, title: string) => ({ id, key: id.toUpperCase(), title, status: "todo", priority: 0, labels: [], created: "Oct 1" });
const a = [task("a", "Alpha")];
const b = [task("b", "Beta"), task("c", "Gamma")];
const byTitles: Record<string, unknown> = { Alpha: a, "Beta|Gamma": b };

export const spec: ContractSpec = {
  component: "TaskBoard",
  props: { defaultTasks: a, statuses: [{ id: "todo", label: "Todo", icon: null }], labels: [], people: [] },
  root: ".ui-tb",
  ref: "root",
  controlled: [
    {
      prop: "tasks",
      values: [a, b],
      read: (root) => byTitles[[...root.querySelectorAll(".ui-tb__card-title > span:last-child")].map((n) => n.textContent).join("|")],
    },
  ],
};
