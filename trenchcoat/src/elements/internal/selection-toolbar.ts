import type { ReactiveControllerHost } from "lit";
import { ToolbarController } from "./controllers";
import { PopoverController, type PopoverCloseReason, type PopoverRect } from "./popover";
import { rangeOf, type SelectionController, type TextRange } from "./selection";

/*
 * The toolbar that floats over a text selection (remediation 6.0) – text-annotator, response-selection and
 * selection-translate. It joins internal/selection.ts (what's selected) and internal/popover.ts (where it floats):
 *
 *   sel = new SelectionController(this, { root: () => this.textRoot, caret: true,
 *                                         onChange: (s, how) => { this.picked = …; this.bar.follow(!!this.picked, how.final); } });
 *   bar = new SelectionToolbarController(this, {
 *     sel: this.sel, root: () => this.textRoot, range: () => this.picked,
 *     popover: () => this.querySelector(".ui-x__pop"), items: () => [...this.querySelectorAll(".ui-x__pop .ui-x__tool")],
 *   });
 *   ${bar.pop.open ? html`<div class="tc-pop ui-x__pop" role="toolbar" aria-label="Selection">…</div>` : nothing}
 *
 * What it does:
 *   · anchors above the passage's first line, centred over all its lines (`box: true`: around all of them)
 *   · `follow(selected, final)` – opens when a selection is finished, closes while the pointer is still dragging, and
 *     when the selection goes (unless focus is in the toolbar or `inside()`)
 *   · keyboard: the toolbar is one tab stop (← → Home End between its buttons – `tools`); Tab from the text moves into
 *     it, Shift + Tab goes back to the text, Tab moves on past the text; Esc closes it, puts focus back in the text and
 *     collapses the selection to its caret. Focus moving anywhere else closes it
 *   · a mouse-down in the toolbar doesn't take focus from the text (the selection stays painted)
 */

/** A passage's box in viewport pixels: above its first line and across all its lines (`box`: around all of them); null when it has no rendered lines */
export function passageRect(root: HTMLElement | null, range: TextRange | null, box = false): PopoverRect | null {
  if (!root || !range) return null;
  const rects = [...rangeOf(root, range.start, range.end).getClientRects()].filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  if (!box) return { left, top: rects[0].top, width: right - left, height: rects[0].height };
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { left, top, width: right - left, height: bottom - top };
}

export type SelectionToolbarOptions = {
  /** The text's selection */
  sel: SelectionController;
  /** The selectable text (its root) – the toolbar's trigger */
  root: () => HTMLElement | null;
  /** The passage the toolbar acts on (default: the selection) */
  range?: () => TextRange | null;
  /** Anchor around all the passage's lines, not above its first (default false) */
  box?: boolean;
  /** The toolbar element, rendered while `pop.open` */
  popover: () => HTMLElement | null;
  /** Its buttons, for the arrow keys */
  items: () => HTMLElement[];
  /** Elements that belong to it – a menu it opens: pointer-downs and focus there don't close it */
  inside?: () => Array<Element | null | undefined>;
  /** After it closed (after Escape has collapsed the selection) */
  onClose?: (reason: PopoverCloseReason) => void;
};

/** The floating toolbar over a text selection. See the file header */
export class SelectionToolbarController {
  readonly pop: PopoverController;
  readonly tools: ToolbarController;
  private wired: HTMLElement | null = null;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    private options: SelectionToolbarOptions,
  ) {
    const { sel, root } = options;
    this.tools = new ToolbarController(host, { items: options.items });
    this.pop = new PopoverController(host, {
      popover: options.popover,
      anchor: () => passageRect(root(), options.range ? options.range() : { start: sel.start ?? 0, end: sel.end ?? 0 }, options.box) ?? sel.rect(),
      kind: "toolbar",
      trigger: root,
      returnFocus: root,
      inside: () => options.inside?.() ?? [],
      tabBridge: true,
      closeOnFocusOut: true,
      onClose: (reason) => {
        if (reason === "escape" && sel.focus !== null) sel.select(sel.focus);
        options.onClose?.(reason);
      },
    });
    host.addController({ hostUpdated: () => this.wire() });
  }

  /** Follows the selection: `selected` – a passage is selected; `final` – the person has finished selecting */
  follow(selected: boolean, final: boolean) {
    if (selected && final) this.pop.show();
    else if (this.pop.open && (selected || !this.focusInside())) this.pop.close();
  }

  private focusInside() {
    const a = document.activeElement;
    return !!a && [this.options.popover(), ...(this.options.inside?.() ?? [])].some((el) => el?.contains(a));
  }

  private keep = (e: Event) => e.preventDefault();

  /** The toolbar's own events, once per rendered element */
  private wire() {
    const pop = this.pop.open ? this.options.popover() : null;
    if (!pop || pop === this.wired) return;
    this.wired = pop;
    pop.addEventListener("mousedown", this.keep);
    pop.addEventListener("keydown", this.tools.onKeyDown);
    pop.addEventListener("focusin", this.tools.onFocusIn);
  }
}
