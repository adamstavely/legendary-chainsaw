import type { ContractSpec } from "../../contract.test";

const task = (id: string, title: string) => ({ id, key: id.toUpperCase(), title, status: "todo", priority: 0, labels: [], created: "Oct 1" });
const a = [task("a", "Alpha")];

// The block is <tc-task-board> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/task-board.test.ts)
export const spec: ContractSpec = {
  component: "TaskBoard",
  props: { defaultTasks: a, statuses: [{ id: "todo", label: "Todo", icon: null }], labels: [], people: [] },
  root: "tc-task-board",
  ref: "root",
};
