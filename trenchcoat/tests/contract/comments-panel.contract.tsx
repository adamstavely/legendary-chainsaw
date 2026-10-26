import type { ContractSpec } from "../contract.test";

const you = { name: "You" };
const comment = (id: string, text: string) => ({ id, author: { name: "Mia Chen" }, createdAt: 0, text });
const TABS: Record<string, string> = { All: "all", Questions: "questions", Edits: "edits" };

// The root is the <section> (the injected <style> comes first)
export const spec: ContractSpec = {
  component: "CommentsPanel",
  props: { comments: [comment("a", "Looks good?")], currentUser: you },
  ref: "root",
  controlled: [
    {
      prop: "comments",
      values: [[comment("a", "Looks good?")], [comment("a", "Looks good?"), comment("b", "Ship it")]],
      read: (root) => {
        const texts = [...root.querySelectorAll(".ui-cp__text")].map((p) => p.textContent);
        return texts.includes("Ship it") ? [comment("a", "Looks good?"), comment("b", "Ship it")] : [comment("a", "Looks good?")];
      },
    },
    {
      prop: "filter",
      values: ["all", "questions"],
      read: (root) => TABS[root.querySelector('.ui-cp__tab[aria-pressed="true"]')?.firstChild?.textContent ?? ""],
    },
    {
      prop: "resolved",
      values: [[], ["a"]],
      read: (root) => (root.querySelector('.ui-cp__resolve[aria-pressed="true"]') ? ["a"] : []),
    },
  ],
};
