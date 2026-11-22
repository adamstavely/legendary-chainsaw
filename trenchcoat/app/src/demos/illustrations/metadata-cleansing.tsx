import type * as UI from "../../../../src/elements/react";

/* A batch of fictional research records moving through metadata cleansing – one illustration per status. */
const STEPS = [
  { status: "required", note: "38 records are missing a publisher or a date." },
  { status: "in-progress", note: "Matching names against the authority file." },
  { status: "failed", note: "The authority file couldn't be reached. Retry in a minute." },
  { status: "success", note: "All 1,240 records are clean and ready to release." },
] as const;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MetadataCleansing } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      {STEPS.map((s) => (
        <div key={s.status}>
          <MetadataCleansing status={s.status} />
          <p style={{ margin: "4px 0 0" }}>{s.note}</p>
        </div>
      ))}
    </div>
  );
}
