import type { ContractSpec } from "../contract.test";

// The root is the <section> region; toasts live in the module store, so there is no prop-held state to control
// (`id` routes toasts to this stack – it is not the DOM id)
export const spec: ContractSpec = {
  component: "Toaster",
  props: { inline: true },
};
