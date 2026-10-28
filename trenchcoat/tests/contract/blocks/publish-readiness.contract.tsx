import type { ContractSpec } from "../../contract.test";

const checks = [
  { id: "spec", label: "Spec is valid", state: "passed" },
  { id: "owner", label: "Owner signs off", state: "manual" },
  { id: "lead", label: "Lead signs off", state: "manual" },
];

// The block is <tc-publish-readiness> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/publish-readiness.test.ts)
export const spec: ContractSpec = {
  root: "tc-publish-readiness",
  component: "PublishReadiness",
  props: { subject: "Digest", checks },
  ref: "root",
};
