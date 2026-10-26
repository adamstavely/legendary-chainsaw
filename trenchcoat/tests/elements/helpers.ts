import { render as litRender, type TemplateResult } from "lit";

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
