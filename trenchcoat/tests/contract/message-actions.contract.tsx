import type { ContractSpec } from "../contract.test";

// MessageActions is the main export; MessageText (the crossfading message) is covered in tests/regressions
export const spec: ContractSpec = {
  component: "MessageActions",
  props: { text: "Hello there", versions: 3, demo: true },
  ref: "root",
  controlled: [
    {
      prop: "feedback",
      values: ["up", "down"],
      read: (root) =>
        root.querySelector('[aria-label="Good response"]')!.getAttribute("aria-pressed") === "true"
          ? "up"
          : root.querySelector('[aria-label="Bad response"]')!.getAttribute("aria-pressed") === "true"
            ? "down"
            : null,
    },
    {
      prop: "version",
      values: [0, 1],
      read: (root) => Number(root.querySelector(".ui-ma__count")!.getAttribute("aria-label")!.match(/Version (\d+)/)![1]) - 1,
    },
  ],
};
