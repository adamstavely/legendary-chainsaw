// Reading a live piece's props, and setting a variant's on it

type Declared = { elementProperties?: Map<PropertyKey, { state?: boolean; attribute?: unknown }> };

/** The element's public props as JSON – what a riff starts from. Functions, elements and internal state are left out */
export function propsOf(el: HTMLElement): Record<string, unknown> {
  const declared = (customElements.get(el.localName) as Declared | undefined)?.elementProperties ?? new Map();
  const out: Record<string, unknown> = {};
  for (const [name, options] of declared) {
    if (typeof name !== "string" || options.state) continue;
    const value = (el as unknown as Record<string, unknown>)[name];
    if (value === undefined || typeof value === "function" || value instanceof Node) continue;
    try {
      const copy = JSON.parse(JSON.stringify(value)) as unknown;
      if (copy !== undefined) out[name] = copy;
    } catch {
      // Not JSON (a cycle, a BigInt): the model couldn't write it back anyway
    }
  }
  return out;
}

/** Sets a variant on the piece: its props, checked as any model-written props are, and its token overrides */
export async function applyVariant(el: HTMLElement, variant: { props: Record<string, unknown>; tokens: Record<string, string> }): Promise<void> {
  // The checks (and every component's schema) load only once a variant is shown
  const { checkComponent } = await import("~tc/src/generative/index");
  const checked = await checkComponent(el.localName, variant.props);
  if (checked) Object.assign(el, checked.props);
  for (const [name, value] of Object.entries(variant.tokens))
    if (/^--tc-[\w-]+$/.test(name) && /^var\(--tc-[\w-]+\)$/.test(value)) el.style.setProperty(name, value);
}
