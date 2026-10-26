import type { ContractSpec } from "../contract.test";

const a = { id: "a", title: "First notice", text: "One" };
const b = { id: "b", title: "Second notice", text: "Two" };

// The root is the <section>; the stack follows `notices` after mount
export const spec: ContractSpec = {
  component: "NotificationStack",
  props: { notices: [a] },
  controlled: [
    {
      prop: "notices",
      values: [[a], [b, a]],
      read: (root) =>
        [...root.querySelectorAll("article:not([data-leaving])")].map((el) => ({ id: el.querySelector("h3")!.textContent === "First notice" ? "a" : "b", title: el.querySelector("h3")!.textContent, text: el.querySelector("p")!.textContent })),
    },
  ],
};
