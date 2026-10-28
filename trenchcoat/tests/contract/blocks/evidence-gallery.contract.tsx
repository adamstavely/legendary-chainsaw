import type { ContractSpec } from "../../contract.test";

const item = (id: string, attestation: string) => ({ id, title: id, kind: "Photo", src: "data:image/png;base64,", alt: id, attestation, claims: 1 });
const items = [item("a", "attested"), item("b", "failed")];

// The block is <tc-evidence-gallery> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/evidence-gallery.test.ts)
export const spec: ContractSpec = {
  root: "tc-evidence-gallery",
  component: "EvidenceGallery",
  props: { items },
  ref: "root",
};
