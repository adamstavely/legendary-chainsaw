import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ApiKey, ApiKeyCreate, ApiKeyReveal } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The API keys of a fictional case-review app, "Ledgerline". Creating a key makes an obviously fake one ("tc_test_" and
   hex from a seeded counter, so the page is the same every time) and shows it once. This made-up service can also show
   a key again, so `loadSecret` gives each active key Show / Hide and Copy – the secrets are fake too, built from the
   key's own ends with "demo" in the middle. */

const NOW = Date.UTC(2026, 10, 20, 15);
const DAY = 86_400_000;
const SCOPES = [
  { id: "cases:read", label: "cases:read", description: "Read cases and their history" },
  { id: "cases:write", label: "cases:write", description: "Open, update and close cases" },
  { id: "reports:read", label: "reports:read", description: "Download finished reports" },
];
const KEYS: ApiKey[] = [
  { id: "k1", name: "Reporting export", prefix: "tc_live_", last4: "a91f", createdAt: NOW - 120 * DAY, createdBy: "Noor Haddad", lastUsedAt: NOW - 2 * 3_600_000, expiresAt: NOW + 245 * DAY, scopes: ["reports:read"] },
  { id: "k2", name: "Case intake bot", prefix: "tc_live_", last4: "07c2", createdAt: NOW - 85 * DAY, createdBy: "Tomás Rivera", lastUsedAt: NOW - 20 * 60_000, expiresAt: NOW + 5 * DAY, scopes: ["cases:read", "cases:write"] },
  { id: "k3", name: "Staging sync", prefix: "tc_test_", last4: "5b3e", createdAt: NOW - 10 * DAY, createdBy: "Inês Costa", scopes: ["cases:read"] },
  { id: "k4", name: "Old dashboard", prefix: "tc_live_", last4: "e410", createdAt: NOW - 400 * DAY, createdBy: "Noor Haddad", lastUsedAt: NOW - 40 * DAY, expiresAt: NOW - 35 * DAY, scopes: ["reports:read"] },
  { id: "k5", name: "Contractor laptop", prefix: "tc_live_", last4: "9d01", createdAt: NOW - 200 * DAY, createdBy: "Tomás Rivera", lastUsedAt: NOW - 60 * DAY, revokedAt: NOW - 59 * DAY, scopes: ["cases:read"] },
];

let made = 0;
/** An obviously fake secret: "tc_test_" and 32 hex digits from a seeded counter */
function fakeSecret() {
  made += 1;
  let x = 2166136261 ^ made;
  let hex = "";
  while (hex.length < 32) {
    x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0;
    hex += x.toString(16).padStart(8, "0");
  }
  return `tc_test_${hex.slice(0, 32)}`;
}

/** A fake secret for a demo key, matching its masked ends: "tc_live_demo…a91f" */
function demoSecret(key: ApiKey) {
  let x = 2166136261;
  for (const ch of key.id) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0;
  let hex = "";
  while (hex.length < 24) {
    x = Math.imul(x ^ (x >>> 13), 2654435761) >>> 0;
    hex += x.toString(16).padStart(8, "0");
  }
  return `${key.prefix}demo${hex.slice(0, 24)}${key.last4 ?? ""}`;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ApiKeys } = ui;
  const [keys, setKeys] = useState<ApiKey[]>(KEYS);
  const [revealed, setRevealed] = useState<ApiKeyReveal | null>(null);
  // Secrets of keys made on this page, so Show and Copy give back the one that was revealed
  const [made_, setMade] = useState<Record<string, string>>({});
  const loadSecret = async (id: string) => {
    // As if fetched from the service, a moment later
    await new Promise((r) => setTimeout(r, 250));
    const key = keys.find((k) => k.id === id);
    return made_[id] ?? (key ? demoSecret(key) : "");
  };
  const create = (d: ApiKeyCreate) => {
    const secret = fakeSecret();
    const id = `new-${made}`;
    setKeys((all) => [{ id, name: d.name, prefix: "tc_test_", last4: secret.slice(-4), createdAt: NOW, createdBy: "You", scopes: d.scopes, expiresAt: d.expiresIn === null ? undefined : NOW + d.expiresIn * DAY }, ...all]);
    setMade((all) => ({ ...all, [id]: secret }));
    setRevealed({ id, secret });
  };
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <ApiKeys description="Ledgerline · Fraud review workspace" keys={keys} onKeysChange={setKeys} scopes={SCOPES} revealed={revealed} onRevealDismiss={() => setRevealed(null)} onKeyCreate={create} loadSecret={loadSecret} now={NOW} locale="en-GB" />
      <div style={{ ...caption, textAlign: "center" }}>
        Create a key to see its secret once; Revoke asks first.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setKeys(KEYS);
            setRevealed(null);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
