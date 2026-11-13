import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Secret } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's agents and the secrets they run on. The names and services are fictional */

const NOW = Date.UTC(2026, 10, 12, 10);
const DAY = 86_400_000;
const SECRETS: Secret[] = [
  { name: "LEDGER_API_TOKEN", scope: "Invoice matcher", status: "missing", usedBy: ["Invoice matcher"] },
  { name: "SANCTIONS_LIST_KEY", scope: "Vendor risk", status: "missing", usedBy: ["Vendor risk", "Onboarding checks"] },
  { name: "MODEL_API_KEY", scope: "Workspace", status: "set", updatedAt: NOW - 21 * DAY, updatedBy: "Noor Haddad", usedBy: ["Invoice matcher", "Vendor risk", "Onboarding checks"] },
  { name: "VENDOR_REGISTRY_TOKEN", scope: "Vendor risk", status: "expiring", updatedAt: NOW - 85 * DAY, updatedBy: "Tomás Rivera", expiresAt: NOW + 5 * DAY, usedBy: ["Vendor risk"] },
  { name: "AP_MAILBOX_PASSWORD", scope: "Invoice matcher", status: "expired", updatedAt: NOW - 200 * DAY, updatedBy: "Inês Costa", expiresAt: NOW - 2 * DAY, usedBy: ["Invoice matcher"] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SecretsManager } = ui;
  const [secrets, setSecrets] = useState(SECRETS);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <SecretsManager
        description="Audit agents · Research institute"
        secrets={secrets}
        onSecretsChange={setSecrets}
        scopes={["Workspace", "Invoice matcher", "Vendor risk", "Onboarding checks"]}
        now={NOW}
        currentUser="You"
        locale="en-GB"
        creatable
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Set a missing secret – the value goes to the page and isn't kept.{" "}
        <button type="button" style={textButton} onClick={() => setSecrets(SECRETS)}>
          Start over
        </button>
      </div>
    </div>
  );
}
