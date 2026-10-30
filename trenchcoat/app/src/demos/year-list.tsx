import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's annual reports: choose a year on the left and the page beside it shows that year. Counts
   are the reports filed each year; one list is a column, the other the row a narrow page would use. */

const COUNTS: Record<number, number> = { 2026: 41, 2025: 128, 2024: 117, 2023: 96, 2022: 102, 2021: 88, 2020: 64, 2019: 71, 2018: 59, 2017: 40, 2016: 33, 2015: 21, 2014: 12, 2013: 4 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { YearList } = ui;
  const [year, setYear] = useState<number | null>(2026);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <YearList label="Report year" from={2013} to={2026} selected={year} onSelectedChange={setYear} counts={COUNTS} countLabel="reports" />
        <div style={{ ...caption, flex: 1, paddingTop: 8 }}>
          <div style={{ fontSize: "var(--tc-font-size-xl, 18px)", fontWeight: 600, color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}>{year ?? "No year"}</div>
          {year !== null ? `${COUNTS[year] ?? 0} reports filed.` : "Choose a year."}
        </div>
      </div>
      <YearList label="Report year, compact" orientation="horizontal" from={2013} to={2026} selected={year} onSelectedChange={setYear} />
      <div style={{ ...caption, textAlign: "center" }}>
        Arrow keys move, Enter chooses, or type a year.{" "}
        <button type="button" style={textButton} onClick={() => setYear(2019)}>
          Go to 2019
        </button>
      </div>
    </div>
  );
}
