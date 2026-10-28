import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBiometricStatus, type BiometricModality, type BiometricSelectedChange } from "../biometric-status";
import { h, useControlled } from "./internal";

export type { BiometricKind, BiometricMatch, BiometricModality, BiometricState } from "../biometric-status";
export { defaultBiometricStatusLabels } from "../biometric-status";

const RawBiometricStatus = createComponent({
  tagName: "tc-biometric-status",
  elementClass: TcBiometricStatus,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<BiometricSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawBiometricStatus>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type BiometricStatusProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The selected row's id – controlled when given (null for none) */
  selected?: string | null;
  /** The row selected on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A row was selected or cleared; `modality` is the selected row */
  onSelectedChange?: (selected: string | null, modality?: BiometricModality) => void;
};

export function BiometricStatus({ title, selected, defaultSelected = null, onSelectedChange, ...props }: BiometricStatusProps) {
  const modality = React.useRef<BiometricModality | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, modality.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawBiometricStatus, {
    ...props,
    heading: title ?? "Biometrics",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<BiometricSelectedChange>) => {
      modality.current = e.detail.modality;
      s.handler(e.detail.selected, e);
    },
  });
}
