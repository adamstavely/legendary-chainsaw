/*
 * A header trigger's tooltip – its name in a small ink label under it, on hover (after a beat) and on keyboard focus.
 * The label is a sibling-free child of the button, aria-hidden (the button's own aria-label already names it). Escape
 * hides it until the next hover or focus (WCAG 1.4.13), through `data-hush` on the button.
 *
 *   <button aria-label="Apps" @keydown=${hushTip} @pointerenter=${unhushTip} @focus=${unhushTip}>
 *     …<span class="ui-x__tip" aria-hidden="true">Apps</span></button>
 */

/** keydown on the trigger: Escape hides its tooltip */
export function hushTip(e: KeyboardEvent) {
  if (e.key === "Escape") (e.currentTarget as HTMLElement).toggleAttribute("data-hush", true);
}
/** pointerenter or focus on the trigger: its tooltip may show again */
export function unhushTip(e: Event) {
  (e.currentTarget as HTMLElement).removeAttribute("data-hush");
}
