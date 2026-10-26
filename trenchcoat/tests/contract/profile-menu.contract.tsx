import type { ContractSpec } from "../contract.test";

// The root is the <section>; the menu has no state a parent would own (the setup progress is already a prop)
export const spec: ContractSpec = {
  component: "ProfileMenu",
  props: { name: "Ada Lovelace", email: "ada@example.com" },
};
