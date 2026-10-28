import type { ContractSpec } from "../../contract.test";

const app = (id: string, name: string) => ({ id, name, vendor: "Acme", description: "", categories: ["all"], logo: null, essential: true });
const apps = [app("slack", "Slack"), app("notion", "Notion")];

// The block is <tc-app-directory> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an
// element's properties, so controlled `connected` is checked in a real browser (tests/elements/app-directory.test.ts)
export const spec: ContractSpec = {
  component: "AppDirectory",
  props: { apps },
  root: ".ui-adir",
  ref: "root",
};
