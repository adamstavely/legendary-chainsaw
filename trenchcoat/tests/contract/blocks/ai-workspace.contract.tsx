import type { ContractSpec } from "../../contract.test";

const chat = (id: string, title: string) => ({ id, title, messages: [{ id: `${id}-m`, role: "user", text: title }] });
const a = [chat("a", "Alpha")];
const b = [chat("b", "Beta"), chat("c", "Gamma")];
const byTitles: Record<string, unknown> = { Alpha: a, "Beta|Gamma": b };
const project = (id: string, name: string) => ({ id, name, description: "", updatedDaysAgo: 1 });
const p1 = [project("p1", "Brand")];
const p2 = [project("p2", "Research")];
const byProject: Record<string, unknown> = { Brand: p1, Research: p2 };

export const spec: ContractSpec = {
  component: "AiWorkspace",
  props: { defaultConversations: a },
  root: ".ui-aw",
  ref: "root",
  controlled: [
    {
      prop: "conversations",
      values: [a, b],
      read: (root) => byTitles[[...root.querySelectorAll(".ui-aw__recents .ui-aw__ellipsis")].map((n) => n.textContent).join("|")],
    },
    {
      prop: "projects",
      values: [p1, p2],
      // The breadcrumb names the first project
      read: (root) => byProject[root.querySelector(".ui-aw__crumb-btn .ui-aw__muted")?.textContent ?? ""],
    },
  ],
};
