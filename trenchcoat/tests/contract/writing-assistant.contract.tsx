import type { ContractSpec } from "../contract.test";

const first = [{ id: "1", role: "user", text: "Polish my email" }];
const second = [
  { id: "1", role: "user", text: "Polish my email" },
  { id: "2", role: "assistant", text: "Done – two typos fixed." },
];

export const spec: ContractSpec = {
  component: "WritingAssistant",
  props: { demo: true },
  ref: "root",
  controlled: [
    {
      prop: "messages",
      values: [first, second],
      read: (root) =>
        [...root.querySelectorAll('[class*="__msg--"]')].map((m, i) => ({ id: String(i + 1), role: m.className.includes("--user") ? "user" : "assistant", text: m.textContent })),
    },
    { prop: "draft", values: ["Hello", "Hello there"], read: (root) => root.querySelector("textarea")?.value },
  ],
};
