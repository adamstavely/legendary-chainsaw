/*
 * Links from data. Lit doesn't sanitise attribute bindings, so a `javascript:` href in a record would run on click.
 * Every href/src bound from data goes through safeUrl; the generative-UI validator uses the same rule. No DOM, so
 * it also runs on a server.
 */

/** Schemes a link from data may use; anything without a scheme is a relative link */
const SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * The link when it's safe to put in an href or src, otherwise undefined (bind it with `ifDefined`). Safe: http(s),
 * mailto and tel, and relative links (`/a`, `./a`, `a/b`, `#x`, `?q`) – but not `//host` or `/\host`, which browsers
 * read as another site.
 */
export function safeUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  // Browsers ignore leading/trailing spaces and controls, and tabs and newlines anywhere – "java\tscript:" is javascript:
  // eslint-disable-next-line no-control-regex
  const bare = url.replace(/^[\u0000- ]+|[\u0000- ]+$/g, "").replace(/[\t\n\r]/g, "");
  if (!bare) return undefined;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(bare);
  if (scheme) return SCHEMES.has(`${scheme[1].toLowerCase()}:`) ? url.trim() : undefined;
  if (/^[\\/]{2}/.test(bare)) return undefined;
  // A colon before any / ? # that isn't a valid scheme ("1x:y", "&#58;") – refuse rather than guess
  if (/^[^/?#]*:/.test(bare)) return undefined;
  return url.trim();
}

/** True when safeUrl keeps it */
export const isSafeUrl = (url: unknown) => safeUrl(url) !== undefined;
