import type { ContractSpec } from "../contract.test";

const field = (root: HTMLElement, label: string) => root.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)?.value;
const licence = [{ id: "a", kind: "product", name: "Licence", repeat: "monthly", price: 10, timing: "advance" }];
const promo = [{ id: "b", kind: "discount", name: "Promo", percent: 5 }];
const durations: Record<string, string> = { "3 months": "3m", "12 months": "12m" };

export const spec: ContractSpec = {
  component: "BillingSchedule",
  props: {},
  ref: "root",
  controlled: [
    { prop: "phase", values: ["Pilot", "Rollout"], read: (root) => field(root, "Phase name") },
    { prop: "start", values: ["2026-02-01", "2026-05-01"], read: (root) => root.querySelector<HTMLInputElement>('input[type="date"]')?.value },
    { prop: "duration", values: ["3m", "12m"], read: (root) => durations[root.querySelector('[aria-haspopup="listbox"]')?.textContent ?? ""] },
    {
      prop: "lines",
      values: [licence, promo],
      // The table shows the lines it was given
      read: (root) => ({ Licence: licence, Promo: promo })[[...root.querySelectorAll('[role="row"]:not([class*="--head"]) [class$="__name-text"]')].map((n) => n.textContent).join()],
    },
  ],
};
