import type { ContractSpec } from "../contract.test";

const OPTIONS = [
  { value: "a", label: "Ada" },
  { value: "b", label: "Ben" },
];
const values = (root: HTMLElement) => [...root.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="people"]')].map((i) => i.value);

// Combobox's root is a <div>; the picked values (value / defaultValue / onChange) and the list (open / defaultOpen /
// onOpenChange) are controllable. The values are read from the hidden form inputs that `name` renders.
export const spec: ContractSpec = {
  component: "Combobox",
  props: { options: OPTIONS, name: "people" },
  ref: "root",
  controlled: [
    { prop: "value", values: [["a"], ["a", "b"]], read: values },
    { prop: "open", values: [false, true], read: (root) => !!root.querySelector('[role="listbox"]') },
  ],
};
