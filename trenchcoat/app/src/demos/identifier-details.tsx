import { useEffect, useMemo, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { IdentifierInfo, IdentifierKind } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* An incident write-up at a fictional research institute, full of identifiers to hover, focus or right-click: a CVE,
   addresses from the documentation ranges, a file hash, a DOI and a parcel. Every value is a made-up example. A
   version number, a time and a code snippet look like identifiers and stay plain. The "threat-intel service" is a
   fake resolver in this file – no network: answers come back after a short wait, the hash lookup fails once (so its
   card offers Retry), and a moment after the page opens the CVE's card opens on its own. */

const TEXT = `Incident 2026-114 – badge reader firmware (example data)

The attacker exploited CVE-2026-0001 from 192.0.2.44, then moved to 2001:db8::7 on the lab network. Traffic to 10.20.0.15 was internal and expected.

The dropper's SHA-256 is d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592. The method follows doi:10.5555/example.2026.0142.

A replacement reader ships by UPS 1Z999AA10123456784. Not identifiers: firmware v4.2.1.0, the 10:30:00 maintenance window, std::vector.`;

const INTEL: Record<string, IdentifierInfo> = {
  "cve:CVE-2026-0001": {
    title: "Heap overflow in badge reader firmware (example)",
    severity: "critical",
    score: 9.8,
    summary: "A made-up advisory: crafted badge data overflows the reader's buffer and runs code.",
    links: [{ label: "Vendor advisory", url: "https://vendor.example.org/advisories/2026-0001" }],
  },
  "ip:192.0.2.44": { owner: "Example Hosting Ltd", asn: "AS64500", fields: [{ label: "First seen", value: "26 Oct 2026" }, { label: "Reports", value: "14" }] },
  "ip:2001:db8::7": { owner: "Harbour Research Institute – lab", fields: [{ label: "Host", value: "lab-gw-02" }] },
  "hash:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592": { title: "reader-update.bin", status: "Malicious", fields: [{ label: "Detections", value: "41 of 70 engines" }] },
  "doi:10.5555/example.2026.0142": { title: "Fuzzing embedded access-control firmware (example paper)", summary: "Example Journal of Systems Security, 2026." },
  "tracking:1Z999AA10123456784": { status: "Out for delivery", fields: [{ label: "Expected", value: "Today by 18:00" }] },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { IdentifierDetails } = ui;
  const [run, setRun] = useState(0);
  const [log, setLog] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => box.current?.querySelector("tc-identifier-details")?.openCard(0), 900);
    return () => clearTimeout(t);
  }, [run]);
  // A fresh service per run, so Reset shows loading and the failure again
  const resolve = useMemo(() => {
    let failed = false;
    void run;
    return (kind: IdentifierKind, value: string, signal: AbortSignal) =>
      new Promise<IdentifierInfo | null>((done, fail) => {
        const t = setTimeout(() => {
          if (kind === "hash" && !failed) {
            failed = true;
            fail(new Error("The intel service didn't answer"));
            return;
          }
          done(INTEL[`${kind}:${value}`] ?? null);
        }, 600);
        signal.addEventListener("abort", () => clearTimeout(t));
      });
  }, [run]);

  return (
    <div ref={box} style={{ width: "100%", maxWidth: 620, display: "grid", gap: 10 }}>
      <IdentifierDetails
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
        {log || "Hover, focus or right-click an identifier"}{" "}
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
