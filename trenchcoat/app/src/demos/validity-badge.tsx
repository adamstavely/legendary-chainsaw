import { useId, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ValidityInfo, ValidityProfileName } from "../../../src/elements/react";
import { caption, surface } from "../demo-kit";

// Dates are fixed against one day, so the demo reads the same every time; "Look ahead" moves `now` and the bands decay
const TODAY = Date.parse("2026-10-24T12:00:00Z");
const DAY = 86_400_000;
const ago = (days: number) => TODAY - days * DAY;

const SOURCES: { name: string; kind: string; observed: number; profile: ValidityProfileName; contested?: boolean; superseded?: boolean }[] = [
  { name: "Exchange-rate feed", kind: "Updated hourly", observed: ago(0.2), profile: "fast" },
  { name: "Customer survey, Q3", kind: "Quarterly", observed: ago(48), profile: "standard" },
  { name: "Supplier price list", kind: "Contested by the August invoice", observed: ago(160), profile: "standard", contested: true },
  { name: "Onboarding handbook, 2nd ed.", kind: "Replaced by the 3rd edition", observed: ago(700), profile: "slow", superseded: true },
  { name: "Warehouse audit", kind: "Yearly", observed: ago(420), profile: "standard" },
];

const PARAGRAPHS: { text: string; info: ValidityInfo }[] = [
  { text: "Shipping costs rose 4% this quarter, mostly on routes through the northern hub.", info: { observed: ago(5), profile: "standard", label: "Shipping costs" } },
  { text: "Customers rate delivery times 4.1 out of 5, unchanged since the spring survey; complaints now centre on tracking updates rather than speed.", info: { observed: ago(48), label: "Delivery ratings" } },
  { text: "Two suppliers still quote last year's unit prices, which the August invoices contradict.", info: { observed: ago(160), contested: true, label: "Supplier prices" } },
  { text: "Stock levels match the last warehouse audit.", info: { observed: ago(420), label: "Stock levels" } },
];

const AHEAD = [
  { value: "0", label: "Today" },
  { value: "90", label: "+3 months" },
  { value: "365", label: "+1 year" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ValidityBadge, SegmentedControl } = ui;
  const [ahead, setAhead] = useState("0");
  const [located, setLocated] = useState<number | null>(null);
  const docId = "validity-doc" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const now = TODAY + Number(ahead) * DAY;

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={caption}>Look ahead</span>
        <SegmentedControl aria-label="Look ahead" size="sm" value={ahead} onChange={setAhead} options={AHEAD} />
      </div>

      <div style={{ ...surface, borderRadius: 12, overflow: "hidden" }}>
        {SOURCES.map((s, i) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              padding: "10px 14px",
              borderTop: i ? "1px solid var(--tc-divider, light-dark(#ececec, #2a2a2e))" : undefined,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
              <div style={caption}>{s.kind}</div>
            </div>
            <ValidityBadge observed={s.observed} profile={s.profile} contested={s.contested} superseded={s.superseded} now={now} />
          </div>
        ))}
      </div>

      <div style={{ ...surface, borderRadius: 12, padding: "14px 16px 14px 8px", display: "flex", gap: 10 }}>
        <ValidityBadge
          mode="strip"
          htmlFor={docId}
          selector="p"
          now={now}
          items={PARAGRAPHS.map((p) => p.info)}
          onLocate={(d) => setLocated(d.index)}
        />
        <article id={docId} style={{ flex: 1, minWidth: 0, display: "grid", gap: 10, fontSize: 13, lineHeight: "20px" }}>
          {PARAGRAPHS.map((p, i) => (
            <p
              key={i}
              style={{
                margin: 0,
                borderRadius: 4,
                transition: "background-color 200ms",
                background: located === i ? "var(--tc-accent-highlight, light-dark(rgba(47, 107, 255, 0.12), rgba(79, 130, 255, 0.2)))" : undefined,
              }}
            >
              {p.text}
            </p>
          ))}
        </article>
      </div>
      <div style={{ ...caption, textAlign: "center", minHeight: 16 }}>
        {located === null ? "Point at a bar in the margin, or click it to find its paragraph." : `${PARAGRAPHS[located].info.label} – located.`}
      </div>
    </div>
  );
}
