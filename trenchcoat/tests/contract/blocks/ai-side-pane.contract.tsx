import type { ContractSpec } from "../../contract.test";

const say = (id: string, text: string) => ({ id, role: "user", text });
const a = [say("a", "Alpha")];
const b = [say("b", "Beta"), say("c", "Gamma")];
const byTexts: Record<string, unknown> = { Alpha: a, "Beta|Gamma": b };

export const spec: ContractSpec = {
  component: "AiSidePane",
  props: { messages: a },
  root: ".ui-sp",
  ref: "root",
  controlled: [
    {
      prop: "messages",
      values: [a, b],
      read: (root) => byTexts[[...root.querySelectorAll(".ui-sp__bubble")].map((n) => n.textContent).join("|")],
    },
    {
      prop: "width",
      values: [360, 480],
      read: (root) => Number(root.querySelector('[role="separator"]')?.getAttribute("aria-valuenow")),
    },
    {
      prop: "open",
      values: [true, false],
      read: (root) => !root.querySelector(".ui-sp__pane")!.hasAttribute("hidden"),
    },
    {
      prop: "collapsed",
      values: [false, true],
      read: (root) => root.querySelector(".ui-sp__pane")!.hasAttribute("data-rail"),
    },
  ],
};
