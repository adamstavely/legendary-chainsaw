// Counters for literal values that should be tokens, used by scripts/check-ratchet.mjs. Each takes a file's
// source and returns how many offending sites it has. Token references – var(--tc-…) with or without a
// fallback – are blanked first, so a fallback's literal never counts.
//   literal duration       a time (≥ 10ms) in transition / animation (-duration / -delay) – use --tc-duration-*
//                          (loops ≥ 1s: --tc-duration-shimmer or a component token)
//   literal easing         ease / ease-in / ease-out / ease-in-out / cubic-bezier() in transition / animation
//                          (-timing-function) – use --tc-ease-* (linear and steps() are allowed)
//   z-index ≥ 7            a literal stacking value of 7 or more – use --tc-z-* (0–6 are fine inside an isolated root)
//   literal font-weight    a numeric / bold weight – use --tc-font-weight-* (or -strong)
//   literal line-height    a numeric line height – use --tc-line-height-*
//   literal border-radius  a radius other than 0 / 50% / 100% (also in --tc-<comp>-…radius… tokens) – use
//                          --tc-radius-* or a pattern token (calc() of tokens is fine)
//   literal blurred shadow a box-shadow layer with a blur > 0 written by hand – use --tc-shadow-* / pattern tokens
//   literal spacing        a non-zero px length in padding / margin / gap – use --tc-space-* (1 px, fractions,
//                          negatives and values 2 px or more off the scale may stay; they're counted here)
//   dark-scoped colour rule a rule under .dark / [data-theme="dark"] / [data-tc-theme="dark"] that sets a colour – use light-dark() in the light rule (it also works with OS / system dark)

/** Replace every var(--tc-…[, fallback]) with VAR, balancing parentheses */
export function blankTokens(source) {
  let out = "";
  let i = 0;
  for (;;) {
    const at = source.indexOf("var(--tc-", i);
    if (at < 0) return out + source.slice(i);
    out += source.slice(i, at) + "VAR";
    let depth = 0;
    let j = at + 3;
    for (; j < source.length; j++) {
      if (source[j] === "(") depth++;
      else if (source[j] === ")" && --depth === 0) break;
    }
    i = j + 1;
  }
}

/** CSS declarations (and inline-style object entries) for a set of property names → their values */
function values(source, props) {
  const css = new RegExp(`(?:^|[\\s;{"'\`])(?:${props.join("|")})\\s*:\\s*([^;{}\\n]*)`, "g");
  return [...source.matchAll(css)].map((m) => m[1]);
}
const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const both = (props) => [...props, ...props.map(camel)];

const SIDES = ["", "-top", "-right", "-bottom", "-left", "-inline", "-inline-start", "-inline-end", "-block", "-block-start", "-block-end"];
const SPACING = [...SIDES.map((x) => `padding${x}`), ...SIDES.map((x) => `margin${x}`), "gap", "row-gap", "column-gap"];
const MOTION = both(["transition", "transition-duration", "transition-delay", "transition-timing-function", "animation", "animation-duration", "animation-delay", "animation-timing-function"]);

function splitTop(value) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  return [...out, cur];
}

/** A declaration that sets a colour: a colour property, or a colour value (in a custom property too) */
const COLOUR = /(?:^|[;\s{])(?:color|background(?:-color|-image)?|border(?:-[a-z]+)*-color|border(?:-top|-right|-bottom|-left)?|outline(?:-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|text-decoration-color)\s*:|#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|color-mix|light-dark)\(|:\s*(?:white|black)\b/;

export const TOKEN_RULES = {
  "literal duration": (s) =>
    values(blankTokens(s), MOTION).reduce((n, v) => n + [...v.matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g)].filter((m) => (m[2] === "s" ? +m[1] * 1000 : +m[1]) >= 10).length, 0),
  "literal easing": (s) => values(blankTokens(s), MOTION).reduce((n, v) => n + (v.match(/(?<![\w-])(?:ease(?:-in-out|-in|-out)?|cubic-bezier\()(?![\w-])/g)?.length ?? 0), 0),
  "z-index ≥ 7": (s) => values(blankTokens(s), both(["z-index"])).filter((v) => /^\s*["']?(\d+)/.test(v) && +v.match(/(\d+)/)[1] >= 7).length,
  "literal font-weight": (s) => values(blankTokens(s), both(["font-weight"])).filter((v) => /^\s*["']?(?:\d{3}|bold|bolder|lighter)\b/.test(v)).length,
  "literal line-height": (s) => values(blankTokens(s), both(["line-height"])).filter((v) => /^\s*["']?\d*\.?\d/.test(v)).length,
  "literal border-radius": (s) => {
    const blank = blankTokens(s);
    const radii = [
      ...values(blank, both(["border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius"])),
      ...[...blank.matchAll(/--tc-[\w-]*radius[\w-]*\s*:\s*([^;{}\n]*)/g)].map((m) => m[1]),
    ];
    return radii.filter((v) => [...v.matchAll(/(?<![\w.-])(\d*\.?\d+)(px|rem|em|%)?/g)].some((m) => !(+m[1] === 0 || (m[2] === "%" && (+m[1] === 50 || +m[1] === 100))))).length;
  },
  "literal blurred shadow": (s) =>
    values(blankTokens(s), both(["box-shadow"])).reduce((n, v) => {
      for (const layer of splitTop(v.replace(/["'`]/g, ""))) {
        const lengths = [...layer.replace(/\b(?:rgba?|hsla?|color-mix|light-dark)\([^)]*\)/g, "").matchAll(/(?<![\w.#-])(-?\d*\.?\d+)(px)?(?![\w.])/g)].map((m) => +m[1]);
        if (lengths.length >= 3 && lengths[2] > 0) n++;
      }
      return n;
    }, 0),
  "literal spacing": (s) =>
    values(blankTokens(s), both(SPACING)).reduce((n, v) => n + [...v.matchAll(/(?<![\w.#])-?(\d*\.?\d+)px\b/g)].filter((m) => +m[1] !== 0).length, 0),
  "dark-scoped colour rule": (s) =>
    [...s.matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter(
      ([, selector, body]) => /\.dark\b|\[data-(?:tc-)?theme=["']?dark/.test(selector) && COLOUR.test(body.replace(/color-scheme\s*:[^;]*;?/g, "")),
    ).length,
};
