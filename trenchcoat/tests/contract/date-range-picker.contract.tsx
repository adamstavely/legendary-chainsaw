import type { ContractSpec } from "../contract.test";

// DateRangePicker's root is a <div>; the applied range (value / defaultValue / onChange), the comparison
// (compareMode / defaultCompare) and the panel (open / defaultOpen / onOpenChange) are controllable.
export const spec: ContractSpec = {
  component: "DateRangePicker",
  props: { today: new Date(2026, 9, 8), name: "period" },
  ref: "root",
  controlled: [
    {
      prop: "value",
      values: [
        { start: new Date(2026, 9, 1), end: new Date(2026, 9, 8) },
        { start: new Date(2026, 8, 1), end: new Date(2026, 8, 30) },
      ],
      read: (root) => {
        const [start, end] = root.querySelector<HTMLInputElement>('input[name="period"]')!.value.split("/");
        const at = (s: string) => new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8)));
        return { start: at(start), end: at(end) };
      },
    },
    { prop: "open", values: [false, true], read: (root) => !!root.querySelector('[role="dialog"]') },
    { prop: "compareMode", values: ["off", "year"], read: (root) => (root.querySelector('[class*="__trigger-compare"]') ? "year" : "off") },
  ],
};
