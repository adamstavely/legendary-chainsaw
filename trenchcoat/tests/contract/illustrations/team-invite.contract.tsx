import type { ContractSpec } from "../../contract.test";

const avatar = (name: string) => ({ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", name });

export const spec: ContractSpec = {
  component: "TeamInvite",
  props: { avatars: [avatar("Maya"), avatar("Jonas"), avatar("Priya")] },
};
