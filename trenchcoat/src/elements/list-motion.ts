import { nothing } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { measureRows, playRows, rowsOf, type RowBoxes } from "./internal/list-motion";

/*
 * <tc-list-motion> – rows that glide. Put a list's rows inside it, in any framework, and when they're reordered, added
 * or removed each one moves from where it was to where it is, instead of jumping. New rows fade in, and removed rows
 * leave as an inert copy that fades out. With reduced motion, or in a hidden tab, the change is immediate.
 *
 *   <tc-list-motion><div>One</div><div>Two</div></tc-list-motion>
 *
 * It doesn't change the rows' order or focus: whatever moves the rows stays in charge of those. Give it `display: grid`
 * or `flex` as you would the list itself; it adds no role, so use `role="list"` when the rows are a list.
 */

/**
 * Makes a list's rows glide when they're reordered, added or removed.
 * @tag tc-list-motion
 */
export class TcListMotion extends TcElement {
  static override ui = "lsm";
  static override looks = false;

  /** Length of the move in ms; by default the --tc-duration-slow token */
  @property({ type: Number }) accessor duration: number | undefined = undefined;
  /** Removed rows leave as a fading copy; set exits="false" to have them go at once */
  @property({ attribute: "exits", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor exits = true;

  private boxes: RowBoxes = new Map();
  private mutations?: MutationObserver;
  private resizes?: ResizeObserver;

  override connectedCallback() {
    super.connectedCallback();
    this.boxes = measureRows(this);
    this.mutations = new MutationObserver((records) => {
      // The copies of leaving rows come and go without being a change to the list
      if (!records.some((r) => [...r.addedNodes, ...r.removedNodes].some((n) => n instanceof Element && !n.hasAttribute("data-list-motion-ghost")))) return;
      const before = this.boxes;
      playRows(this, before, { duration: this.duration, exits: this.exits });
      this.boxes = measureRows(this);
    });
    this.mutations.observe(this, { childList: true });
    if (typeof ResizeObserver !== "undefined") {
      this.resizes = new ResizeObserver(() => {
        if (!this.getAnimations({ subtree: true }).length) this.boxes = measureRows(this);
      });
      this.resizes.observe(this);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mutations?.disconnect();
    this.resizes?.disconnect();
  }

  /** How many rows it holds, without the copies of rows that are leaving */
  get rowCount() {
    return rowsOf(this).length;
  }

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
[data-ui="lsm"] { display: block; position: relative; }
`;
}

if (!customElements.get("tc-list-motion")) customElements.define("tc-list-motion", TcListMotion);

declare global {
  interface HTMLElementTagNameMap {
    "tc-list-motion": TcListMotion;
  }
}
