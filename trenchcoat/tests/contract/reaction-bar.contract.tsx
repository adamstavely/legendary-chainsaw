import type { ContractSpec } from "../contract.test";

// The root is the group <div>; the bar follows `reactions` when it changes after mount
export const spec: ContractSpec = {
  component: "ReactionBar",
  props: {},
  controlled: [
    {
      prop: "reactions",
      values: [{ like: { count: 3, active: false } }, { like: { count: 4, active: true } }],
      read: (root) => {
        const like = root.querySelector<HTMLElement>('[data-kind="like"]')!;
        return { like: { count: Number(like.getAttribute("aria-label")!.match(/\d+/)?.[0] ?? 0), active: like.getAttribute("aria-pressed") === "true" } };
      },
    },
  ],
};
