import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSmartRecommendation, type Recommendation as ElementRecommendation } from "../smart-recommendation";
import { h, isNode, useStaged } from "./internal";

/** A recommendation, its reason any React node */
export type Recommendation = Omit<ElementRecommendation, "reason"> & { reason: React.ReactNode };

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the user's change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const [own, setOwn] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else setOwn(next);
    onChange?.(next);
  };
  return { value: controlled ? value : own, handler, controlled };
}

const RawSmartRecommendation = createComponent({
  tagName: "tc-smart-recommendation",
  elementClass: TcSmartRecommendation,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<{ value: string; reset: boolean }>>,
    onTcAcceptedChange: "tc-accepted-change" as EventName<CustomEvent<{ accepted: string | null; reset: boolean }>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSmartRecommendation>;
export type SmartRecommendationProps = Omit<
  RawProps,
  "heading" | "options" | "value" | "accepted" | "open" | "acceptOption" | "undoOption" | "onTcValueChange" | "onTcAcceptedChange" | "onTcOpenChange" | "defaultValue"
> & {
  title?: string;
  /**
   * First entry is the recommendation, the rest are offered as alternatives. A new set of options starts over
   * (uncontrolled choice and acceptance go back to the recommendation); an empty list shows the card with nothing to accept
   */
  options: Recommendation[];
  /** Id of the option on show (controlled when defined) – the recommendation or an alternative */
  value?: string;
  /** The option on show at first when uncontrolled – defaults to the recommendation */
  defaultValue?: string;
  /** Called when an alternative (or the recommendation again) is picked from the menu */
  onValueChange?: (id: string) => void;
  /** Id of the accepted option, or null (controlled when defined). onAccept / onUndo report the changes */
  accepted?: string | null;
  defaultAccepted?: string | null;
  /**
   * Accepts the option. Return a promise to keep the button pending until it settles: the option counts as
   * accepted once it resolves, and a rejection says so and lets you try again
   */
  onAccept?: (option: Recommendation) => void | Promise<unknown>;
  /** Takes the acceptance back – may return a promise, like onAccept */
  onUndo?: (option: Recommendation) => void | Promise<unknown>;
  /** Whether the reason is unfolded (controlled when defined) */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SmartRecommendation({
  title = "Smart recommendation",
  options,
  value,
  defaultValue,
  onValueChange,
  accepted,
  defaultAccepted = null,
  onAccept,
  onUndo,
  open,
  defaultOpen = true,
  onOpenChange,
  ...props
}: SmartRecommendationProps) {
  // Reasons given as React nodes render in the staging box (wrapped, so a fragment stays whole); the element clones them
  const { stage, els } = useStaged(options.filter((o) => isNode(o.reason)).map((o) => [o.id, h("span", null, o.reason)]));
  const byId = React.useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const opts = React.useMemo(
    () => options.map((o) => (isNode(o.reason) ? { ...o, reason: els[o.id] ?? "" } : { ...o, reason: o.reason == null || typeof o.reason === "boolean" ? "" : String(o.reason) })) as ElementRecommendation[],
    [options, els],
  );
  // The callbacks get the app's own option back, React reason and all
  const own = (o: ElementRecommendation) => byId.get(o.id) ?? (o as unknown as Recommendation);
  const v = useOwned(value, defaultValue ?? options[0]?.id ?? "", onValueChange);
  // onAccept / onUndo report acceptance, so it has no change callback of its own
  const a = useOwned<string | null>(accepted, defaultAccepted, undefined);
  const o = useOwned(open, defaultOpen, onOpenChange);
  return h(React.Fragment, null, stage, h(RawSmartRecommendation, {
    ...props,
    heading: title,
    options: opts,
    value: v.value,
    accepted: a.value,
    open: o.value,
    acceptOption: onAccept ? (opt: ElementRecommendation) => onAccept(own(opt)) : undefined,
    undoOption: onUndo ? (opt: ElementRecommendation) => onUndo(own(opt)) : undefined,
    onTcValueChange: (e: CustomEvent<{ value: string; reset: boolean }>) => {
      // A reset to the recommendation for a new set of options is the wrapper's own business when controlled
      if (e.detail.reset && v.controlled) return e.preventDefault();
      v.handler(e.detail.value, e);
    },
    onTcAcceptedChange: (e: CustomEvent<{ accepted: string | null; reset: boolean }>) => a.handler(e.detail.accepted, e),
    onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
  }));
}
