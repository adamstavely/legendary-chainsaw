import type { ContractSpec } from "../../contract.test";

// The period switch is the library SegmentedControl (a radiogroup)

// The block is <tc-metrics-dashboard> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/metrics-dashboard.test.ts)
export const spec: ContractSpec = {
  component: "MetricsDashboard",
  props: { now: Date.UTC(2026, 9, 24, 12) },
  ref: "root",
};
