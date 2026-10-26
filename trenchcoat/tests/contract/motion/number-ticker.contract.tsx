import type { ContractSpec } from "../../contract.test";

// `value` is display data, not state the ticker owns, so there is nothing to control
export const spec: ContractSpec = {
  component: "NumberTicker",
  props: { value: 48240, locale: "en-US" },
};
