import type { ContractSpec } from "../contract.test";

const attempts = [
  { id: "a", name: "Attempt A", approach: "Mock the API", status: "done", score: 80 },
  { id: "b", name: "Attempt B", approach: "Retry the call", status: "done", score: 60 },
];

// The root is the outer <div>; the attempt in use is the row marked data-picked
export const spec: ContractSpec = {
  component: "ParallelAttempts",
  props: { attempts },
  controlled: [
    {
      prop: "picked",
      values: ["a", "b"],
      read: (root) => ([...root.querySelectorAll(".ui-pa__row")].findIndex((r) => r.hasAttribute("data-picked")) === 0 ? "a" : "b"),
    },
  ],
};
