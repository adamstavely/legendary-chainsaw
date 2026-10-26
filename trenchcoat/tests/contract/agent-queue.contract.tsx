import type { ContractSpec } from "../contract.test";

const NOW = Date.UTC(2026, 9, 24, 12);
const jobs = [
  { id: "r1", name: "Summarize", kind: "llm", status: "running", worker: "w1", enqueuedAt: NOW - 4000, startedAt: NOW - 2000 },
  { id: "q1", name: "Search", kind: "tool", status: "queued", enqueuedAt: NOW - 1000 },
];

export const spec: ContractSpec = {
  component: "AgentQueue",
  props: { jobs, workers: [{ id: "w1", name: "Worker 1" }], now: NOW, onPausedChange: () => {} },
  ref: "root",
  controlled: [
    { prop: "paused", values: [false, true], read: (root) => root.getAttribute("data-state") === "paused" },
    {
      prop: "openId",
      values: ["r1", "q1"],
      read: (root) => (root.querySelector('[role="dialog"], .ui-agq__pop')?.textContent?.includes("Summarize") ? "r1" : "q1"),
    },
  ],
};
