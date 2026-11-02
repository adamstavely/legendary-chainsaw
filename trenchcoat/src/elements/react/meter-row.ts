import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMeterRow } from "../meter-row";

export type { MeterRowLabels } from "../meter-row";
export { defaultMeterRowLabels } from "../meter-row";

/** A label, a percentage and a tiny bar on one line. The ref receives the element */
export const MeterRow = createComponent({
  tagName: "tc-meter-row",
  elementClass: TcMeterRow,
  react: React,
  events: { onTcOpen: "tc-open" as EventName<CustomEvent<null>> },
});
export type MeterRowProps = React.ComponentProps<typeof MeterRow>;
