import type { CaseRead, FactSection, TimelineCategory, TimelineEvent } from "../../../src/elements/react";

/* A fictional supplier payment review at a research institute, shared by the Case Review and Case File demos. */

const at = (day: number, hour: number) => Date.UTC(2026, 9, day, hour);

export const CASE_READ: CaseRead = {
  summary: "Two payments of the same amount went to one supplier three days apart, the second to a bank account added the day before.",
  points: ["Both reference invoice 88213", "The new account was added by a single approver", "The supplier hasn't confirmed the change"],
  suggestion: "escalate",
  confidence: "Moderately confident",
};
export const CASE_FACTS: FactSection[] = [
  {
    id: "payment",
    title: "Payments",
    facts: [
      { id: "amount", label: "Amount, each", value: "$48,200", source: { label: "Ledger", grade: "A1" } },
      { id: "invoice", label: "Invoice", value: "88213", source: { label: "Accounts payable", grade: "A2" } },
      { id: "account", label: "Receiving account", value: "•••• 4471", source: { label: "Bank file", grade: "B2" }, alternatives: [{ value: "•••• 9023", source: { label: "Supplier record", grade: "B3" } }] },
    ],
  },
];
export const CASE_CATEGORIES: TimelineCategory[] = [
  { id: "payment", label: "Payment", tone: "info" },
  { id: "change", label: "Change", tone: "warning" },
];
export const CASE_EVENTS: TimelineEvent[] = [
  { id: "e3", date: at(29, 10), title: "Second payment sent", detail: "$48,200 to •••• 4471", category: "payment", flag: "Auto-flag" },
  { id: "e2", date: at(28, 16), title: "Bank account added", detail: "One approver, outside normal hours", category: "change" },
  { id: "e1", date: at(26, 9), title: "First payment sent", detail: "$48,200 to •••• 9023", category: "payment" },
];
