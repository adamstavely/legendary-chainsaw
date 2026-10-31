import type * as UI from "../../../../src/elements/react";
import type { ShareEntitlementCheck, ShareGrant, ShareRecipient, TeamFlag, VersionEntry } from "../../../../src/elements/react";

/* A research institute's restricted trial report. The check stands in for an entitlement service; nothing leaves the page. */

const FLAGS: TeamFlag[] = [
  { id: "review", label: "Needs review", meaning: "A second reader should check this before it's relied on.", color: "#CA8A04" },
  { id: "hold", label: "Legal hold", meaning: "Don't change or delete it.", color: "#DC2626" },
  { id: "final", label: "Final", meaning: "Signed off, and the version to cite.", color: "#16A34A" },
];
const DIRECTORY: ShareRecipient[] = [
  { id: "noor", kind: "person", name: "Noor Haddad", detail: "noor@institute.example" },
  { id: "tomas", kind: "person", name: "Tomás Rivera", detail: "tomas@institute.example" },
  { id: "ines", kind: "person", name: "Inês Costa", detail: "Visiting researcher" },
  { id: "biostat", kind: "group", name: "Biostatistics", detail: "12 members" },
];
const ACCESS: ShareGrant[] = [
  { recipient: DIRECTORY[0]!, level: "edit" },
  { recipient: DIRECTORY[1]!, level: "view" },
];
const VERSIONS: VersionEntry[] = [
  { id: "v3", label: "v3", status: "active", author: "Noor Haddad", at: "Oct 12", note: "Adds the 12-week follow-up", changes: [{ kind: "added", text: "12-week follow-up results" }] },
  { id: "v2", label: "v2", status: "deprecated", author: "Tomás Rivera", at: "Sep 2", note: "Corrects the dosing table", changes: [{ kind: "changed", text: "Dosing table, section 4" }] },
];
const check: ShareEntitlementCheck = async (recipient) => {
  await new Promise((r) => setTimeout(r, 400));
  if (recipient.id === "ines") return { status: "denied", reason: "Needs the Restricted data agreement." };
  if (recipient.id === "biostat") return { status: "partial", allowed: 9, total: 12, reason: "3 members haven't completed data training." };
  return { status: "allowed" };
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FileDetails } = ui;
  return (
    <div style={{ width: "100%" }}>
      <FileDetails
        file={{ name: "Trial 12 results.pdf", size: 2400000, pages: 38, owner: "Noor Haddad", modified: Date.UTC(2026, 9, 12) }}
        flags={FLAGS}
        defaultFlag="review"
        summaryStatus="done"
        summary="The 12-week follow-up supports the primary endpoint, with no new safety signals. Enrolment fell short at two sites."
        points={[
          { id: "a", text: "Primary endpoint met at 12 weeks", refs: [{ page: 4 }] },
          { id: "b", text: "Two sites under target enrolment", refs: [{ page: 17 }] },
        ]}
        versions={VERSIONS}
        access={ACCESS}
        directory={DIRECTORY}
        checkEntitlement={check}
      />
    </div>
  );
}
