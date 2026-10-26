import type { ContractSpec } from "../contract.test";

// OtpInput's root is a <div>; the code (value / defaultValue / onChange) is controllable, and so is the check's
// state (status – without it the field follows the promise onComplete returns)
export const spec: ContractSpec = {
  component: "OtpInput",
  props: {},
  ref: "root",
  controlled: [
    { prop: "value", values: ["12", "123456"], read: (root) => root.querySelector("input")!.value },
    { prop: "status", values: ["idle", "verifying"], read: (root) => root.getAttribute("data-status") },
  ],
};
