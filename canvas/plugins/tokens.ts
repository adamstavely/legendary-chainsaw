// Design tokens, read from Trenchcoat's source: which ones exist, which a component uses, and which of those sit on a
// scale (space, radius, type size …) that a dial can step along. Shared by the riff endpoint and the Tune dials
/** Every design token tokens.css defines */
export const definedTokens = (css: string) => new Set([...css.matchAll(/(--tc-[\w-]+)\s*:/g)].map((m) => m[1]));

/**
 * The tokens a component may override: the shared ones its source uses, and its own component tokens (--tc-<slug>-…,
 * which may live only in its source, with a fallback)
 */
export function componentTokens(source: string, slug: string, defined: ReadonlySet<string>): string[] {
  const own = (t: string) => t.startsWith(`--tc-${slug}-`);
  const used = [...source.matchAll(/var\(\s*(--tc-[\w-]+)/g)].map((m) => m[1]);
  return [...new Set([...used, ...[...defined].filter(own)])].filter((t) => defined.has(t) || own(t)).sort();
}

/** Scales a dial can move a token along: each token is one step of its scale, in tokens.css order */
const SCALES = ["space", "radius", "font-size", "font-weight", "line-height", "shadow", "duration"];

/** The scale a token belongs to (--tc-space-2 → "space"), or null */
export const scaleOf = (token: string) => SCALES.find((s) => new RegExp(`^--tc-${s}-[a-z0-9-]+$`).test(token)) ?? null;

/** Each scale's tokens, in the order tokens.css defines them */
export function scales(css: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const m of css.matchAll(/(--tc-[\w-]+)\s*:/g)) {
    const scale = scaleOf(m[1]);
    if (scale && !(out[scale] ??= []).includes(m[1])) out[scale].push(m[1]);
  }
  return out;
}

/** The component's tokens that sit on a scale, each with the scale's other steps to choose from */
export function tunableTokens(source: string, slug: string, css: string): { token: string; options: string[] }[] {
  const all = scales(css);
  return componentTokens(source, slug, definedTokens(css)).flatMap((token) => {
    const scale = scaleOf(token);
    return scale && all[scale]?.length > 2 ? [{ token, options: all[scale] }] : [];
  });
}
