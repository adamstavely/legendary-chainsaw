import type { ContractSpec } from "../contract.test";

const contacts = [
  { name: "Jonas Weber", email: "jonas@northwind.io" },
  { name: "Lena Hart", email: "lena@northwind.io" },
];
const tones = [
  { id: "friendly", label: "Friendly", body: () => "Hi there" },
  { id: "short", label: "Short", body: () => "Hi" },
];
const TONES: Record<string, string> = { Friendly: "friendly", Short: "short" };

export const spec: ContractSpec = {
  component: "EmailDraft",
  props: { contacts, tones, demo: true },
  ref: "root",
  controlled: [
    {
      prop: "recipient",
      values: ["jonas@northwind.io", "lena@northwind.io"],
      read: (root) => contacts.find((c) => root.querySelector(".ui-ed__recipient")?.textContent?.includes(c.email))?.email,
    },
    {
      prop: "tone",
      values: ["friendly", "short"],
      read: (root) => TONES[root.querySelector('.ui-ed__tones [aria-pressed="true"]')?.textContent ?? ""],
    },
  ],
};
