import type { ContractSpec } from "../../contract.test";

// Decorative scene with a meaningful default description (role="img"); no controlled state
export const spec: ContractSpec = {
  component: "AgentTeam",
  props: {
    members: [
      { role: "Researcher", avatar: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
      { role: "SDR", avatar: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", tools: ["gmail"] },
      { role: "Ops", avatar: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
    ],
  },
};
