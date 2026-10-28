import type { ContractSpec } from "../../contract.test";

const user = { name: "Ada Lovelace", email: "ada@example.com" };

// The block is <tc-header-nav> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/header-nav.test.ts)
export const spec: ContractSpec = {
  root: "tc-header-nav",
  component: "HeaderNav",
  props: { user, notifications: { items: [] }, apps: { apps: [{ id: "mail", name: "Mail", href: "#mail" }] } },
  ref: "root",
};
