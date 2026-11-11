// Mounts a piece's docs example inside a card. The markup and script come from Trenchcoat's own docs pages at build
// time (plugins/trenchcoat.ts), so the HTML is the repository's, not user input. Several examples can be live at once,
// so each one is kept to its card:
//   · its ids get the card's prefix, and every reference to them (for, aria-labelledby …) follows
//   · its script's `document` finds elements in the card only, and `document.body` is the card
//   · its `console` is silent and its `fetch` gets an empty JSON reply, so demo buttons work without a server
import examples from "virtual:tc-examples";

const ID_REFS = [
  "for",
  "aria-labelledby",
  "aria-describedby",
  "aria-controls",
  "aria-owns",
  "aria-activedescendant",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "list",
  "form",
  "headers",
  "popovertarget",
  "commandfor",
  "anchor",
];

/** Gives every id in `root` the prefix, and points the attributes that reference ids at the new ones */
export function prefixIds(root: ParentNode, prefix: string): Map<string, string> {
  const ids = new Map<string, string>();
  for (const el of root.querySelectorAll("[id]")) {
    const next = `${prefix}-${el.id}`;
    ids.set(el.id, next);
    el.id = next;
  }
  const refs = ID_REFS.map((a) => `[${a}]`).join(",");
  for (const el of root.querySelectorAll(refs))
    for (const attr of ID_REFS) {
      const value = el.getAttribute(attr);
      if (value !== null)
        el.setAttribute(
          attr,
          value
            .split(/\s+/)
            .map((id) => ids.get(id) ?? id)
            .join(" "),
        );
    }
  return ids;
}

/** Rewrites `#id` in a selector to the prefixed id */
export function scopeSelector(selector: string, ids: ReadonlyMap<string, string>): string {
  return selector.replace(/#(-?[A-Za-z_][\w-]*)/g, (whole, id: string) => (ids.has(id) ? `#${CSS.escape(ids.get(id)!)}` : whole));
}

/** A `document` for the example's script: lookups stay inside the card, everything else is the real document */
export function scopedDocument(root: HTMLElement, ids: ReadonlyMap<string, string>): Document {
  const own: Record<PropertyKey, unknown> = {
    querySelector: (s: string) => root.querySelector(scopeSelector(s, ids)),
    querySelectorAll: (s: string) => root.querySelectorAll(scopeSelector(s, ids)),
    getElementById: (id: string) => root.querySelector(`#${CSS.escape(ids.get(id) ?? id)}`),
    body: root,
  };
  return new Proxy(document, {
    get(target, key) {
      if (Object.hasOwn(own, key)) return own[key];
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

const quiet = { log() {}, info() {}, warn() {}, error() {} };
const demoFetch: typeof fetch = () =>
  new Promise((resolve) => setTimeout(() => resolve(new Response("{}", { status: 200, headers: { "content-type": "application/json" } })), 400));

export const hasExample = (slug: string) => Object.hasOwn(examples, slug);

/** Renders the example into `root`; resolves once its script has run, rejects if it fails */
export async function mountExample(root: HTMLElement, slug: string, prefix: string): Promise<void> {
  const load = examples[slug];
  if (!load) throw new Error(`No example for ${slug}`);
  const example = await load();
  root.innerHTML = example.markup;
  const ids = prefixIds(root, prefix);
  await example.default(scopedDocument(root, ids), quiet, demoFetch);
}
