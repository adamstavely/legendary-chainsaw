import type { ContractSpec } from "../contract.test";

const root = {
  id: "run",
  name: "Run",
  kind: "agent",
  status: "done",
  start: 0,
  end: 2000,
  children: [{ id: "llm", name: "Plan", kind: "llm", status: "done", start: 100, end: 900 }],
};

export const spec: ContractSpec = {
  component: "TraceWaterfall",
  props: { root },
  ref: "root",
  controlled: [
    {
      prop: "collapsed",
      values: [[], ["run"]],
      read: (el) => (el.querySelector('[role="treeitem"][aria-expanded="false"]') ? ["run"] : []),
    },
    {
      prop: "openId",
      values: [null, "llm"],
      read: (el) => (el.querySelector('[role="dialog"]') ? "llm" : null),
    },
  ],
};
