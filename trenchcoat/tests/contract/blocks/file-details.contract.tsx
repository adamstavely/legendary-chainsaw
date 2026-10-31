import type { ContractSpec } from "../../contract.test";

// The block is <tc-file-details> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/file-details.test.ts)
export const spec: ContractSpec = {
  root: "tc-file-details",
  component: "FileDetails",
  props: { file: { name: "Trial 12.pdf" } },
  ref: "root",
};
