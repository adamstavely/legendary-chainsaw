import type { ContractSpec } from "../contract.test";

const decisions = [
  { id: "d1", title: "Merge it?", primary: "Merge", secondary: "Hold" },
  { id: "d2", title: "Refund it?", primary: "Refund", secondary: "Ask" },
];

// The root is the <section> (after the hoisted <style>); answers show as the open count in the head
export const spec: ContractSpec = {
  component: "DecisionInbox",
  props: { decisions },
  controlled: [
    {
      prop: "answers",
      values: [{}, { d1: "primary" }],
      read: (root) => ([...root.querySelectorAll("[data-answered]")].length === 0 ? {} : { d1: "primary" }),
    },
  ],
};
