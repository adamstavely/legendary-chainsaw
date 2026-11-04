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
  // Runs after every render: staged nodes can change without a prop changing; it only sets state when they differ
  // eslint-disable-next-line react-hooks/exhaustive-deps -- no deps on purpose, see above
  React.useLayoutEffect(() => {
    const next: Record<string, Element | undefined> = {};
    box.current?.querySelectorAll<HTMLElement>(":scope > [data-k]").forEach((s) => (next[s.dataset.k!] = s.firstElementChild ?? undefined));
    if (Object.keys(next).length !== Object.keys(els).length || Object.entries(next).some(([k, v]) => els[k] !== v)) setEls(next);
  });
  const stage = nodes.length ? h("div", { ref: box, hidden: true, "aria-hidden": "true" }, nodes.map(([k, n]) => h("span", { key: k, "data-k": k }, n))) : null;
  return { stage, els };
}
export const isNode = (v: unknown) => v != null && typeof v === "object" && !(v instanceof Element);

/**
 * A value that's controlled when `value` is given, else kept by the element from `defaultValue`. `ownEvents` is for
 * elements that hold the page's children (a card, a dialog): a child's change event of the same name bubbles through
 * them and isn't theirs. Composite elements leave it off, since the events of the parts they render are their API.
 */
export function useControlled<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined, { ownEvents = false } = {}) {
  // Uncontrolled, the element's own changes are kept here: @lit/react sets every prop on every render, so passing
  // the starting value back would undo them whenever the parent re-renders
  const [own, setOwn] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = React.useCallback(
    (next: T, event: Event) => {
      // A child's change event bubbling through (a list's Show more inside a card) isn't this one's
      if (ownEvents && event.currentTarget && event.target !== event.currentTarget) return;
      if (controlled) event.preventDefault();
      else setOwn(next);
      onChange?.(next);
    },
    [controlled, onChange, ownEvents],
  );
  return { value: controlled ? value : own, handler, controlled };
}
