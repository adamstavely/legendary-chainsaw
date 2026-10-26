import type { ContractSpec } from "../contract.test";

const GROUPS = [
  { id: "status", label: "Status", options: [{ id: "new", label: "New" }, { id: "won", label: "Won" }] },
  { id: "region", label: "Region", options: [{ id: "eu", label: "Europe" }] },
];

// FilterMenu's root is a <div>; the picked options (value / defaultValue / onChange) and the open groups
// (open / defaultOpen / onOpenChange) are controllable
export const spec: ContractSpec = {
  component: "FilterMenu",
  props: { groups: GROUPS },
  ref: "root",
  controlled: [
    {
      prop: "value",
      values: [{ status: ["new"] }, { status: ["won"], region: ["eu"] }],
      read: (root) => {
        const out: Record<string, string[]> = {};
        root.querySelectorAll<HTMLElement>('[role="checkbox"][aria-checked="true"]').forEach((b) => {
          const [, g, o] = b.dataset.key!.split(":");
          (out[g] ??= []).push(o);
        });
        return out;
      },
    },
    {
      prop: "open",
      values: [["status"], ["region"]],
      read: (root) => [...root.querySelectorAll<HTMLElement>('[aria-expanded="true"]')].map((b) => b.dataset.key!.slice(2)),
    },
  ],
};
