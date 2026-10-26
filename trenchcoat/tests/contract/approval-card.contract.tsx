import type { ContractSpec } from "../contract.test";

// The root is the role="group" <div>; `status` is controlled and shows on the root as data-status
export const spec: ContractSpec = {
  component: "ApprovalCard",
  props: { title: "Send campaign email" },
  controlled: [
    {
      prop: "status",
      values: ["pending", "approved"],
      read: (root) => root.getAttribute("data-status"),
    },
  ],
};
