import type * as UI from "../../../src/elements/react";
import type { ShareLink } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute's links to one report. The addresses are fictional. */

const NOW = Date.UTC(2026, 9, 31);
const DAY = 86_400_000;
const LINKS: ShareLink[] = [
  { id: "a", label: "Review board", url: "https://share.institute.example/l/8f2a", createdBy: "Noor Haddad", createdAt: NOW - 20 * DAY, expiresAt: NOW + 40 * DAY, access: "Can view", password: true, opens: 12, lastOpenedAt: NOW - DAY },
  { id: "b", label: "Visiting panel", url: "https://share.institute.example/l/c31d", createdBy: "Tomás Rivera", createdAt: NOW - 30 * DAY, expiresAt: NOW + 3 * DAY, access: "Can comment", opens: 1, lastOpenedAt: NOW - 10 * DAY },
  { id: "c", label: "Spring workshop", url: "https://share.institute.example/l/09be", createdBy: "Noor Haddad", createdAt: NOW - 200 * DAY, expiresAt: NOW - 90 * DAY, access: "Can view", opens: 48 },
  { id: "d", label: "Old draft", url: "https://share.institute.example/l/77aa", createdBy: "Inês Costa", createdAt: NOW - 300 * DAY, access: "Can view", status: "revoked", opens: 5 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ShareLinkManager } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <ShareLinkManager description="Trial 12 results" defaultLinks={LINKS} now={NOW} locale="en-GB" creatable />
      <div style={{ ...caption, textAlign: "center" }}>Revoke says how many times a link's been opened before it acts.</div>
    </div>
  );
}
