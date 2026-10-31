import type { ReactiveController, ReactiveControllerHost } from "lit";

/*
 * Rows that glide: measures a list's rows before a change and animates each one from where it was to where it is, so
 * reordering, adding and removing don't jump. Rows that are new fade in. A row that's gone leaves as an inert copy, with
 * `exits`. With reduced motion, or in a hidden tab, nothing moves.
 *
 *   private readonly motion = new ListMotionController(this, () => this.querySelector(".ui-x__list"));
 */

export type ListMotionOptions = {
  /** Length in ms; by default the --tc-duration-slow token */
  duration?: number;
  /** A row that's removed leaves as a fading copy */
  exits?: boolean;
};

const GHOST = "data-list-motion-ghost";
const FALLBACK_DURATION = 320;
export const rowsOf = (list: Element) => [...list.children].filter((c) => !c.hasAttribute(GHOST)) as HTMLElement[];

function shouldAnimate() {
  return document.visibilityState !== "hidden" && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export type RowBoxes = Map<HTMLElement, DOMRect>;

/** Where each row is now, relative to the list, so scrolling the page between measures doesn't count as moving */
export function measureRows(list: Element): RowBoxes {
  const origin = list.getBoundingClientRect();
  const boxes: RowBoxes = new Map();
  for (const row of rowsOf(list)) {
    const r = row.getBoundingClientRect();
    boxes.set(row, new DOMRect(r.left - origin.left, r.top - origin.top, r.width, r.height));
  }
  return boxes;
}

function timing(list: Element, options: ListMotionOptions) {
  const style = getComputedStyle(list);
  const token = Number.parseFloat(style.getPropertyValue("--tc-duration-slow"));
  return { duration: options.duration ?? (Number.isFinite(token) ? token : FALLBACK_DURATION), easing: style.getPropertyValue("--tc-ease-move").trim() || "ease-out" };
}

function leave(list: HTMLElement, row: HTMLElement, box: DOMRect, opts: KeyframeAnimationOptions) {
  const copy = row.cloneNode(true) as HTMLElement;
  copy.setAttribute(GHOST, "");
  copy.setAttribute("aria-hidden", "true");
  copy.toggleAttribute("inert", true);
  copy.removeAttribute("id");
  for (const el of copy.querySelectorAll("[id]")) el.removeAttribute("id");
  Object.assign(copy.style, { position: "absolute", left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, margin: "0", pointerEvents: "none" });
  if (getComputedStyle(list).position === "static") list.style.position = "relative";
  list.append(copy);
  copy.animate([{ opacity: 1 }, { opacity: 0 }], opts).finished.finally(() => copy.remove());
}

/** Animates every row from its box in `before` to where it is now */
export function playRows(list: HTMLElement, before: RowBoxes, options: ListMotionOptions = {}) {
  if (!shouldAnimate()) return;
  const after = measureRows(list);
  const opts: KeyframeAnimationOptions = timing(list, options);
  for (const [row, box] of after) {
    const old = before.get(row);
    if (!old) {
      if (before.size) row.animate([{ opacity: 0 }, { opacity: 1 }], opts);
      continue;
    }
    const dx = old.left - box.left;
    const dy = old.top - box.top;
    if (dx || dy) row.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], opts);
  }
  if (options.exits) for (const [row, box] of before) if (!after.has(row)) leave(list, row, box, opts);
}

/** For a Lit element that renders its own rows: measures before each update and plays after it */
export class ListMotionController implements ReactiveController {
  private before: RowBoxes | null = null;

  constructor(
    host: ReactiveControllerHost,
    private readonly list: () => HTMLElement | null,
    private readonly options: ListMotionOptions = {},
  ) {
    host.addController(this);
  }

  hostUpdate() {
    const list = this.list();
    this.before = list ? measureRows(list) : null;
  }

  hostUpdated() {
    const list = this.list();
    if (list && this.before) playRows(list, this.before, this.options);
    this.before = null;
  }
}
