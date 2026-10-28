import type { ContractSpec } from "../../contract.test";

const role = (id: string, headline: string) => ({ id, label: id, headline, kpis: [], services: [] });
const roles = [role("reviewer", "Five to review."), role("lead", "Two paused.")];

// The block is <tc-oversight-home> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/oversight-home.test.ts)
export const spec: ContractSpec = {
  root: "tc-oversight-home",
  component: "OversightHome",
  props: { roles },
  ref: "root",
};
