/*
 * What the React wrappers share (decision L9): rendering React nodes for an element that takes icons as data, and
 * controlled values through the elements' cancelable change events.
 */
import * as React from "react";

export const h = React.createElement;

/**
 * Renders React nodes into a hidden box and returns their DOM elements by key, once they're mounted. The box is part
 * of the wrapper's output, so the nodes render the normal React way (hooks, context) and update with it.
 */
export function useStaged(nodes: [string, React.ReactNode][]) {
  const box = React.useRef<HTMLDivElement>(null);
  const [els, setEls] = React.useState<Record<string, Element | undefined>>({});
  React.useLayoutEffect(() => {
    const next: Record<string, Element | undefined> = {};
    box.current?.querySelectorAll<HTMLElement>(":scope > [data-k]").forEach((s) => (next[s.dataset.k!] = s.firstElementChild ?? undefined));
    if (Object.keys(next).length !== Object.keys(els).length || Object.entries(next).some(([k, v]) => els[k] !== v)) setEls(next);
  });
  const stage = nodes.length ? h("div", { ref: box, hidden: true, "aria-hidden": "true" }, nodes.map(([k, n]) => h("span", { key: k, "data-k": k }, n))) : null;
  return { stage, els };
}
export const isNode = (v: unknown) => v != null && typeof v === "object" && !(v instanceof Element);

/** A value that's controlled when `value` is given, else kept by the element from `defaultValue` */
export function useControlled<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const [initial] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = React.useCallback(
    (next: T, event: Event) => {
      if (controlled) event.preventDefault();
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return { value: controlled ? value : initial, handler, controlled };
}
