import { useEffect, useMemo, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { VersionChange, VersionEntry } from "../../../src/elements/react";
import { buttonSm, caption, textButton } from "../demo-kit";

/* A morning-briefing agent's versions. v1.3 is a draft that tightens the review step; v1.2 is live. Compare with
   v1.2 asks the app for the comparison – the first try times out, Try again works. Approve and activate asks first,
   then v1.3 goes live. Restore on an old version comes back a moment later as a new draft at the top. */

const START: VersionEntry[] = [
  {
    id: "v13",
    label: "v1.3",
    status: "draft",
    note: "Tighter review before anything is sent",
    author: "M. Lindqvist",
    at: "Today · 09:12",
    changes: [
      { kind: "changed", text: "Marks an item urgent from a score of 0.90 (was 0.85)" },
      { kind: "added", text: "Asks a team lead to approve the briefing when anything is urgent" },
      { kind: "changed", text: "Reads at most 20 sources per item (was 40)" },
      { kind: "removed", text: "No longer sends copies to external addresses" },
    ],
  },
  {
    id: "v12",
    label: "v1.2",
    status: "active",
    note: "Groups related items before ranking",
    author: "D. Okafor",
    at: "May 28 · 14:40",
    changes: [
      { kind: "added", text: "Groups items about the same topic into one entry" },
      { kind: "changed", text: "Ranks groups, not single items" },
    ],
  },
  {
    id: "v11",
    label: "v1.1",
    status: "deprecated",
    note: "Sources on every summary",
    author: "M. Lindqvist",
    at: "May 12 · 10:05",
    changes: [{ kind: "added", text: "Every summary links the sources it used" }],
  },
  { id: "v10", label: "v1.0", status: "deprecated", note: "First briefing", author: "M. Lindqvist", at: "Apr 30 · 16:22", changes: [{ kind: "added", text: "Writes a morning summary of new items" }] },
];

/** A long-lived agent: 2,000 versions */
function longHistory(): VersionEntry[] {
  const verbs = ["Shortens", "Adds", "Drops", "Re-ranks", "Rewords", "Caches"];
  const things = ["the summary", "the sources list", "urgent items", "the sign-off", "the digest", "follow-ups"];
  return Array.from({ length: 2000 }, (_, i) => {
    const n = 2000 - i;
    return {
      id: `long-${n}`,
      label: `v${Math.floor(n / 10)}.${n % 10}`,
      status: i === 0 ? "active" : "deprecated",
      note: `${verbs[n % verbs.length]} ${things[(n * 7) % things.length]}`,
      author: ["M. Lindqvist", "D. Okafor", "S. Ortiz"][n % 3],
      at: `Build ${n}`,
      changes: [{ kind: (["added", "changed", "removed"] as const)[n % 3], text: `${verbs[n % verbs.length]} ${things[(n * 7) % things.length]}` }],
    };
  });
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { VersionHistory } = ui;
  const [long, setLong] = useState(false);
  const [versions, setVersions] = useState(START);
  const [note, setNote] = useState("v1.3 is a draft: v1.2 stays live until it's approved.");
  const tries = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (ms: number, fn: () => void) => void timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    tries.current = 0;
    setVersions(long ? longHistory() : START);
    setNote("v1.3 is a draft: v1.2 stays live until it's approved.");
  };
  const big = useMemo(() => (long ? longHistory() : null), [long]);

  // The app's comparison: the first one times out, later ones answer from the versions in between
  const resolveCompare = (from: VersionEntry, to: VersionEntry, signal: AbortSignal) =>
    new Promise<VersionChange[]>((resolve, reject) => {
      const list = big ?? versions;
      const a = list.findIndex((v) => v.id === from.id);
      const b = list.findIndex((v) => v.id === to.id);
      const t = window.setTimeout(() => {
        if (tries.current++ === 0) {
          setNote("The comparison timed out – Try again asks once more.");
          reject(new Error("timeout"));
        } else {
          setNote(`${from.label} → ${to.label}, gathered by the app.`);
          resolve(list.slice(b, a).flatMap((v) => v.changes ?? []));
        }
      }, 900);
      signal.addEventListener("abort", () => window.clearTimeout(t));
    });

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <VersionHistory
        key={long ? "long" : "short"}
        title="Morning briefing agent"
        versions={big ?? versions}
        onVersionsChange={big ? undefined : setVersions}
        resolveCompare={resolveCompare}
        onActivate={({ version, previous }) => setNote(`${version.label} is live${previous ? `; ${previous.label} is deprecated` : ""}. Earlier briefings keep their version.`)}
        onRestore={(version) => {
          if (big) return;
          setNote(`Restoring ${version.label}…`);
          later(1100, () => {
            setVersions((list) => {
              const nextMinor = Math.max(...list.map((v) => Number(v.label.split(".")[1]) || 0)) + 1;
              const draft: VersionEntry = {
                id: `restored-${nextMinor}`,
                label: `v1.${nextMinor}`,
                status: "draft",
                note: `Restored from ${version.label}`,
                author: "You",
                at: "Just now",
                changes: [{ kind: "changed", text: `Behaves as ${version.label} did` }],
              };
              return [draft, ...list.filter((v) => v.status !== "draft")];
            });
            setNote(`A new draft from ${version.label} is at the top. Any earlier draft was replaced.`);
          });
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ ...caption, flex: "1 1 220px", minHeight: 16 }}>
          {note}{" "}
          <button type="button" style={textButton} onClick={reset}>
            Reset
          </button>
        </span>
        <button
          type="button"
          style={buttonSm}
          onClick={() => {
            setLong((l) => !l);
            tries.current = 0;
            setNote(long ? "v1.3 is a draft: v1.2 stays live until it's approved." : "2,000 versions – the timeline renders only the rows on screen.");
          }}
        >
          {long ? "Back to four versions" : "Load 2,000 versions"}
        </button>
      </div>
    </div>
  );
}
