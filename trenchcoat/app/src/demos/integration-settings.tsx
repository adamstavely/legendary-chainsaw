import { useState } from "react";
import type * as UI from "../../../src/elements/react";

const StoreLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" fill="#95BF47" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="#5E8E3E" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 15.5c.5.6 1.2.9 2 .9 1 0 1.8-.5 1.8-1.3 0-1.7-3.6-1-3.6-2.7 0-.8.8-1.3 1.8-1.3.7 0 1.3.3 1.7.7" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { IntegrationSettings } = ui;
  const [status, setStatus] = useState<string>("Edit a field to see the save bar");

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12, justifyItems: "center" }}>
      <div style={{ width: "100%" }}>
        <IntegrationSettings
          name="Shopify"
          logo={<StoreLogo />}
          count={1284}
          meta="Connected Mar 14 · syncing orders every 5 min"
          defaultValues={{ enabled: true, siteUrl: "northwind-goods.com", timeZone: "(GMT −05:00) New York", apiKey: null }}
          onGenerateKey={() =>
            new Promise<string>((resolve) =>
              setTimeout(
                () =>
                  resolve(
                    "shpat_" +
                      Array.from({ length: 28 }, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join(""),
                  ),
                900,
              ),
            )
          }
          onSave={(values) =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                setStatus(`Saved · ${values.enabled ? "on" : "off"} · ${values.siteUrl} · ${values.timeZone}`);
                resolve();
              }, 800),
            )
          }
          onToggle={(enabled) => setStatus(enabled ? "Integration switched on" : "Integration switched off")}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }} aria-live="polite">
        {status}
      </div>
    </div>
  );
}
