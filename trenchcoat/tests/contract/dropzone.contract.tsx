import type { ContractSpec } from "../contract.test";

const file = (id: string, name: string) => ({ id, name, size: 2048, status: "done", progress: 1 });

// Dropzone's root is a <div>; the list of files is controllable (value / defaultValue / onChange)
export const spec: ContractSpec = {
  component: "Dropzone",
  props: { demo: true },
  ref: "root",
  controlled: [
    {
      prop: "value",
      values: [[file("a", "a.pdf")], [file("b", "b.png"), file("c", "c.csv")]],
      read: (root) =>
        [...root.querySelectorAll('li[class*="__row"]:not([data-removing])')].map((row) => {
          const name = row.querySelector('[class*="__name"]')!.textContent!;
          return file(name[0], name);
        }),
    },
  ],
};
