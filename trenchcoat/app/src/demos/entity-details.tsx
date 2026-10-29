import { useEffect, useMemo, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EntityInfo, EntityKind } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A security-operations hand-over note at a fictional research institute, with addresses, numbers, links and handles
   to hover, focus or right-click. A date, a version, an IP address and a ticket number look like phone numbers and
   stay plain. The "staff directory" is a fake resolver in this file – no network: people come back after a short
   wait, the help desk's number fails once (so its card offers Retry), and the rest are unknown. A moment after the
   page opens, the first card opens on its own. */

const TEXT = `Hand-over – night shift, 28 Oct

Incident lead is priya.natarajan@example.org (desk +44 20 7946 0958). The facilities help desk is on (555) 010-4477 if the badge readers act up again.

Runbook: https://intranet.example.org/soc/runbook – the old one at http://legacy.example.org/soc is out of date. Status page: www.example.org/status.

Ping @ops_lead or @analyst@social.example.org before 07:00. Ignore ticket 40817726512, build v2.4.1.8 and 2026-10-28 – they're not numbers to call.`;

const avatar = (bg: string, initials: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${bg}"/><text x="20" y="25" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#fff" text-anchor="middle">${initials}</text></svg>`)}`;

const DIRECTORY: Record<string, EntityInfo> = {
  "email:priya.natarajan@example.org": {
    name: "Priya Natarajan",
    summary: "Security operations lead, Harbour Research Institute.",
    avatar: avatar("#3b6ea5", "PN"),
    fields: [
      { label: "Team", value: "Security operations" },
      { label: "Local time", value: "London" },
    ],
    links: [{ label: "Directory entry", url: "https://directory.example.org/people/pn" }],
  },
  "phone:+442079460958": { name: "Priya Natarajan – desk", summary: "Answered 08:00–18:00; out of hours it forwards to the duty phone." },
  "phone:5550104477": { name: "Facilities help desk", fields: [{ label: "Hours", value: "24 hours" }] },
  "url:https://intranet.example.org/soc/runbook": { name: "SOC runbook", summary: "Updated 21 Oct 2026 by the SOC." },
  "handle:@ops_lead": { name: "Ops lead rota", summary: "This week: Sam Okafor.", avatar: avatar("#6a5aa8", "OL") },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EntityDetails } = ui;
  const [run, setRun] = useState(0);
  const [log, setLog] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => box.current?.querySelector("tc-entity-details")?.openCard(0), 900);
    return () => clearTimeout(t);
  }, [run]);
  // A fresh directory per run, so Reset shows loading and the failure again
  const resolve = useMemo(() => {
    let failed = false;
    void run;
    return (kind: EntityKind, value: string, signal: AbortSignal) =>
      new Promise<EntityInfo | null>((done, fail) => {
        const t = setTimeout(() => {
          if (kind === "phone" && value === "5550104477" && !failed) {
            failed = true;
            fail(new Error("The directory didn't answer"));
            return;
          }
          done(DIRECTORY[`${kind}:${value}`] ?? null);
        }, 600);
        signal.addEventListener("abort", () => clearTimeout(t));
      });
  }, [run]);

  return (
    <div ref={box} style={{ width: "100%", maxWidth: 600, display: "grid", gap: 10 }}>
      <EntityDetails
        key={run}
        text={TEXT}
        resolve={resolve}
        onCopy={(text) => setLog(`Copied ${text}`)}
        onOpenLink={(d) => {
          setLog(`Would open ${d.url}`);
          return false;
        }}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Hover, focus or right-click an address, number, link or handle"}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setRun((n) => n + 1);
            setLog("");
          }}
        >
          Reset
        </button>
      </p>
    </div>
  );
}
