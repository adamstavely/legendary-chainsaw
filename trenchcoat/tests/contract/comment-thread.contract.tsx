import type { ContractSpec } from "../contract.test";

const you = { name: "You" };
const msg = (id: string, text: string) => ({ id, author: { name: "Mia" }, createdAt: 0, text });

// The root is the <section> (the injected <style> comes first). `messages` stays the source of truth: a new list shows.
export const spec: ContractSpec = {
  component: "CommentThread",
  props: { messages: [msg("a", "First")], currentUser: you },
  ref: "root",
  controlled: [
    {
      prop: "messages",
      values: [[msg("a", "First")], [msg("a", "First"), msg("b", "Second")]],
      read: (root) => [...root.querySelectorAll(".ui-ct__msg")].map((el, i) => msg(i ? "b" : "a", el.querySelector(".ui-ct__text")?.textContent ?? "")),
    },
  ],
};
