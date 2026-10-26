import type { ContractSpec } from "../contract.test";

// The root is the composer's wrapper div (it holds the card, the error and the live status line)
export const spec: ContractSpec = {
  component: "ChatComposer",
  props: { demo: true },
  ref: "root",
  controlled: [
    {
      prop: "value",
      values: ["First draft", "Second draft"],
      read: (root) => root.querySelector<HTMLTextAreaElement>("textarea")!.value,
    },
    {
      prop: "model",
      values: ["claude", "chatgpt"],
      // The button shows the model's name; the default models' ids are their lower-cased names
      read: (root) => root.querySelector(".ui-chat-composer__model-face")!.textContent!.trim().toLowerCase(),
    },
  ],
};
