import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { IdleMember, SeatGroup } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's 150 Business seats, renewing in March. */

const NOW = Date.UTC(2026, 10, 12);
const DAY = 86_400_000;

const GROUPS: SeatGroup[] = [
  { id: "audit", label: "Audit", paid: 60, assigned: 60, active: 49 },
  { id: "research", label: "Research", paid: 55, assigned: 55, active: 41 },
  { id: "ops", label: "Operations", paid: 35, assigned: 35, active: 22 },
];

const IDLE: IdleMember[] = [
  { id: "u1", name: "Ines Lindqvist", detail: "Analyst", group: "Audit", lastActive: NOW - 47 * DAY },
  { id: "u2", name: "Omar Haddad", detail: "Field researcher", group: "Research", lastActive: NOW - 62 * DAY },
  { id: "u3", name: "Grace Mwangi", detail: "Coordinator", group: "Operations", lastActive: NOW - 33 * DAY },
  { id: "u4", name: "Tomás Ferreira", detail: "Visiting fellow", group: "Research" },
  { id: "u5", name: "Hannah Weiss", detail: "Records officer", group: "Operations", lastActive: NOW - 91 * DAY },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SeatUsage } = ui;
  const [idle, setIdle] = useState(IDLE);
  const [note, setNote] = useState<string | null>(null);
  const reclaimed = IDLE.length - idle.length;
  const groups = GROUPS.map((g) => ({ ...g, assigned: g.assigned - IDLE.filter((m) => m.group === g.label && !idle.includes(m)).length }));
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <SeatUsage
        description="Business plan · renews 1 March"
        groups={groups}
        idle={idle}
        seatPrice={30}
        now={NOW}
        locale="en-US"
        onReclaim={(ids) => {
          setIdle((list) => list.filter((m) => !ids.includes(m.id)));
          setNote(`Reclaimed ${ids.length} ${ids.length === 1 ? "seat" : "seats"}.`);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note ?? "Tick idle members, or reclaim one seat, and confirm."}{" "}
        {reclaimed ? (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setIdle(IDLE);
              setNote(null);
            }}
          >
            Start again
          </button>
        ) : null}
      </div>
    </div>
  );
}
