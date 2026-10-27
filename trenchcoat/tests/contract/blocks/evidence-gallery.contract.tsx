import type { ContractSpec } from "../../contract.test";

const item = (id: string, attestation: string) => ({ id, title: id, kind: "Photo", src: "data:image/png;base64,", alt: id, attestation, claims: 1 });
const items = [item("a", "attested"), item("b", "failed")];

export const spec: ContractSpec = {
  component: "EvidenceGallery",
  props: { items },
  ref: "root",
  controlled: [
    {
      prop: "filter",
      values: ["attested", "failed"],
      // One attested item and one failed: the summary under the filter tells which one shows
      read: (root) => ({ "1 attested": "attested", "0 attested": "failed" })[root.querySelector(".ui-evg__summary")?.textContent?.match(/\d attested/)?.[0] ?? ""],
    },
  ],
};
