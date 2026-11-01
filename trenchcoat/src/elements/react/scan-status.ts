import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcScanStatus, type ScanActionDetail } from "../scan-status";

export type { ScanAction, ScanActionDetail, ScanLayout, ScanState, ScanStatusLabels } from "../scan-status";
export { defaultScanStatusLabels } from "../scan-status";

/** Where a file stands in malware scanning. The ref receives the element */
export const ScanStatus = createComponent({
  tagName: "tc-scan-status",
  elementClass: TcScanStatus,
  react: React,
  events: { onTcAction: "tc-action" as EventName<CustomEvent<ScanActionDetail>> },
});
export type ScanStatusProps = React.ComponentProps<typeof ScanStatus>;
