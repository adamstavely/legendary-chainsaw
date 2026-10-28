import type { ContractSpec } from "../../contract.test";

// The block is <tc-testimonial-wall> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/testimonial-wall.test.ts)
export const spec: ContractSpec = {
  component: "TestimonialWall",
  props: { items: [{ quote: "Fast.", name: "Ada Park" }, { quote: "Calm.", name: "Ben Ito" }] },
  root: "tc-testimonial-wall",
  ref: "root",
};
