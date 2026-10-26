import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSegmentedControl, type SegmentOption as ElementOption, type SegmentValueChange } from "../segmented-control";
import { h, isNode, useControlled, useStaged } from "./internal";

/** React nodes in place of elements: labels, icons and badges */
export type SegmentOption<T extends string = string> = Omit<ElementOption, "value" | "label" | "icon" | "badge"> & {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  /** A small tinted tag after the label, e.g. "Save 20%" */
  badge?: React.ReactNode;
};

const RawSegmentedControl = createComponent({
  tagName: "tc-segmented-control",
  elementClass: TcSegmentedControl,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<SegmentValueChange>> },
});
type RawSegmentedControlProps = React.ComponentProps<typeof RawSegmentedControl>;
export type SegmentedControlProps<T extends string = string> = Omit<RawSegmentedControlProps, "value" | "options" | "onTcValueChange" | "onChange" | "defaultValue"> & {
  options: SegmentOption<T>[];
  /** Controlled value */
  value?: T;
  /** Starting value when uncontrolled – defaults to the first enabled option */
  defaultValue?: T;
  onChange?: (value: T) => void;
};

/** Text stays text; other React nodes render in the staging box and the element clones their DOM */
const asText = (v: React.ReactNode) => (typeof v === "string" || typeof v === "number" ? String(v) : undefined);

export function SegmentedControl<T extends string = string>({ options, value, defaultValue, onChange, ...props }: SegmentedControlProps<T>) {
  const nodes: [string, React.ReactNode][] = [];
  for (const o of options) {
    if (isNode(o.icon)) nodes.push([`icon:${o.value}`, o.icon]);
    if (o.label != null && asText(o.label) === undefined && isNode(o.label)) nodes.push([`label:${o.value}`, o.label]);
    if (o.badge != null && asText(o.badge) === undefined && isNode(o.badge)) nodes.push([`badge:${o.value}`, o.badge]);
  }
  const { stage, els } = useStaged(nodes);
  const opts = React.useMemo(
    () =>
      options.map((o) => ({
        ...o,
        icon: isNode(o.icon) ? els[`icon:${o.value}`] : (o.icon as Element | undefined),
        label: o.label == null ? undefined : (asText(o.label) ?? (isNode(o.label) ? els[`label:${o.value}`] : (o.label as unknown as Element))),
        badge: o.badge == null ? undefined : (asText(o.badge) ?? (isNode(o.badge) ? els[`badge:${o.value}`] : (o.badge as unknown as Element))),
      })) as ElementOption[],
    [options, els],
  );
  const v = useControlled<T | undefined>(value, defaultValue, onChange as ((next: T | undefined) => void) | undefined);
  return h(React.Fragment, null, stage, h(RawSegmentedControl, {
    ...props,
    options: opts,
    value: v.value,
    onTcValueChange: (e: CustomEvent<SegmentValueChange>) => v.handler(e.detail.value as T, e),
  }));
}
