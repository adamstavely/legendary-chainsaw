import type { ContractSpec } from "../../contract.test";

// The block is <tc-logo-marquee> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/logo-marquee.test.ts)
export const spec: ContractSpec = {
  component: "LogoMarquee",
  props: { logos: [{ name: "Orbitly" }, { name: "Quanta" }] },
  root: "tc-logo-marquee",
  ref: "root",
};
