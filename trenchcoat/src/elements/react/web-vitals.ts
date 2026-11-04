import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcWebVitals, type WebVitalDevice, type WebVitalsDeviceChange } from "../web-vitals";
import { h, useControlled } from "./internal";

export type { WebVital, WebVitalDevice, WebVitalId, WebVitalRating, WebVitalsDeviceChange, WebVitalsLabels, WebVitalUnit } from "../web-vitals";
export { defaultWebVitalsLabels, rateWebVital, webVitalDefaults } from "../web-vitals";

const RawWebVitals = createComponent({
  tagName: "tc-web-vitals",
  elementClass: TcWebVitals,
  react: React,
  events: {
    onTcDeviceChange: "tc-device-change" as EventName<CustomEvent<WebVitalsDeviceChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawWebVitals>;
export type WebVitalsProps = Omit<RawProps, "heading" | "device" | "onTcDeviceChange" | "children"> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** Which device the numbers are for – controlled when given; null hides the switch */
  device?: WebVitalDevice | null;
  /** The device at first, when `device` isn't controlled; null hides the switch */
  defaultDevice?: WebVitalDevice | null;
  /** Mobile or Desktop was chosen */
  onDeviceChange?: (device: WebVitalDevice) => void;
};

export function WebVitals({ title = "Web vitals", device, defaultDevice = null, onDeviceChange, ...props }: WebVitalsProps) {
  const d = useControlled<WebVitalDevice | null>(device, defaultDevice, onDeviceChange ? (next) => {
    if (next) onDeviceChange(next);
  } : undefined);
  return h(RawWebVitals, {
    ...props,
    heading: title,
    device: d.value,
    onTcDeviceChange: (ev: CustomEvent<WebVitalsDeviceChange>) => d.handler(ev.detail.device, ev),
  });
}
