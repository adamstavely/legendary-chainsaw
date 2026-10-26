import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "TestimonialWall",
  props: { items: [{ quote: "Fast.", name: "Ada Park" }, { quote: "Calm.", name: "Ben Ito" }] },
  root: ".ui-twl",
  ref: "root",
};
