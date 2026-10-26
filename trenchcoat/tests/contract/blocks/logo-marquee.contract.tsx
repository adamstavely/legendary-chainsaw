import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "LogoMarquee",
  props: { logos: [{ name: "Orbitly" }, { name: "Quanta" }] },
  root: ".ui-lm",
  ref: "root",
};
