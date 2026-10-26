import type { ContractSpec } from "../contract.test";

// ToolCallCard is the main export; ToolCallGroup's contract is covered in tests/regressions/tool-call-card.test.tsx
export const spec: ContractSpec = {
  component: "ToolCallCard",
  props: { name: "search_web", status: "success", duration: 400 },
  ref: "root",
  controlled: [
    {
      prop: "open",
      values: [false, true],
      read: (root) => root.querySelector(".ui-tc__head")?.getAttribute("aria-expanded") === "true",
    },
  ],
};
