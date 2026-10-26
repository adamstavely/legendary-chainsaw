import { useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import type { CompareMode, DateRange } from "../../../src/elements/react";

const today = new Date();
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DateRangePicker, formatRange, defaultPresets } = ui;
  const [range, setRange] = useState<DateRange>(() => {
    const end = startOfDay(today);
    return { start: new Date(end.getFullYear(), end.getMonth(), end.getDate() - 13), end };
  });
  const [compare, setCompare] = useState<{ range: DateRange | null; mode: CompareMode }>({ range: null, mode: "previous" });

  // The panel is absolutely positioned and 652px wide by default – size it to this wrapper instead,
  // so it fits the stage and switches to its narrow layout when needed.
  const wrapper = {
    width: "100%",
    maxWidth: 652,
    containerType: "inline-size",
    minHeight: 500,
    "--tc-date-range-picker-panel-width": "100cqw",
  } as CSSProperties;

  return (
    <div style={wrapper}>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", marginBottom: 8 }}>
        Applied: <strong style={{ color: "var(--tc-text-primary, light-dark(#171717, #ededed))", fontWeight: 500 }}>{formatRange(range)}</strong>
        {compare.range && ` vs ${formatRange(compare.range)}`}
      </div>
      <DateRangePicker
        value={range}
        onChange={(r, c, mode) => {
          setRange(r);
          setCompare({ range: c, mode });
        }}
        presets={defaultPresets}
        compare
        defaultCompare="previous"
        weekStartsOn={1}
        defaultOpen
      />
    </div>
  );
}
