import { render as litRender, type TemplateResult } from "lit";
import { userEvent } from "vitest/browser";

/** Renders a template into a fresh container on the page and waits until every Trenchcoat element in it is updated */
export async function fixture<T extends Element = HTMLElement>(template: TemplateResult): Promise<T> {
  const host = document.createElement("div");
  document.body.append(host);
  litRender(template, host);
  await settle(host);
  return host.firstElementChild as T;
}

/** Waits for every Lit element under `root` to finish updating */
export async function settle(root: ParentNode = document.body) {
  for (let i = 0; i < 3; i++) {
    const pending = [...root.querySelectorAll("*")].filter((el) => "updateComplete" in el) as unknown as { updateComplete: Promise<unknown> }[];
    await Promise.all(pending.map((el) => el.updateComplete));
  }
  await new Promise((r) => requestAnimationFrame(() => r(null)));
}

export function cleanup() {
  document.body.replaceChildren();
}

/**
 * Moves the real pointer to the page's bottom-right corner, away from where fixtures render. Use it in place of
 * `userEvent.unhover`, which leaves the pointer in the middle of <body> – where the next test's element mounts and then
 * gets a pointer-enter it never asked for (pausing autoplay, opening tooltips, showing hover colours)
 */
export async function parkPointer() {
  const spot = document.createElement("div");
  spot.style.cssText = "position: fixed; right: 0; bottom: 0; width: 2px; height: 2px";
  document.body.append(spot);
  await userEvent.hover(spot);
  spot.remove();
}
