// The foundations pages beside the component pages (remediation Part 4.4): getting started, looks, themes, tokens,
// accessibility, patterns and the changelog. Prose lives in ./foundations/*.md; the Tokens page reads tokens.css.
import { marked } from "marked";
import { useMemo, useState } from "react";
import changelog from "../../../CHANGELOG.md?raw";
import tokensCss from "../../../tokens/tokens.css?raw";

const prose = import.meta.glob<string>("./foundations/*.md", { query: "?raw", import: "default", eager: true });

export const FOUNDATIONS: [string, string][] = [
  ["getting-started", "Getting started"],
  ["looks", "Looks"],
  ["themes", "Themes"],
  ["tokens", "Tokens"],
  ["patterns", "Patterns"],
  ["accessibility", "Accessibility"],
  ["changelog", "Changelog"],
];

export function Foundations({ page }: { page: string }) {
  const source = page === "changelog" ? changelog : prose[`./foundations/${page}.md`];
  return (
    <div className="docs docs-foundation">
      <article className="docs-body">
        {page === "tokens" ? (
          <Tokens />
        ) : source ? (
          <div className="docs-md docs-prose" dangerouslySetInnerHTML={{ __html: marked.parse(source, { async: false }) as string }} />
        ) : (
          <p className="muted">No such page.</p>
        )}
      </article>
    </div>
  );
}

type Token = { name: string; value: string; group: string };
type Layer = { title: string; about: string; tokens: Token[]; single?: boolean };

/** The tokens of one top-level block of tokens.css, with the comment above each run as its group */
function block(css: string, start: string): Token[] {
  const at = css.indexOf(start);
  if (at < 0) return [];
  const open = css.indexOf("{", at);
  const close = css.indexOf("\n}", open);
  const out: Token[] = [];
  let group = "General";
  for (const line of css.slice(open + 1, close).split("\n")) {
    const comment = line.match(/^\s*\/\*\s*(.+?)\s*(?:–.*)?\*\/\s*$/);
    if (comment) group = comment[1].replace(/\s*\(.*$/, "");
    const decl = line.match(/^\s*(--tc-[\w-]+)\s*:\s*(.+?);\s*(?:\/\*.*)?$/);
    if (decl) out.push({ name: decl[1], value: decl[2], group });
  }
  return out;
}

const COLOR = /light-dark\(|#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|color-mix\(|var\(--tc-(gray|zinc|blue|red|green|amber|purple|orange|teal|pink)/i;
const kindOf = (t: Token) => (/shadow/.test(t.name) ? "shadow" : COLOR.test(t.value) && !/radius|space|size|width|duration|ease|font|line-height|tracking|z-/.test(t.name) ? "color" : "value");

function Tokens() {
  const [q, setQ] = useState("");
  const layers: Layer[] = useMemo(() => {
    const standard = block(tokensCss, ':where(:root, [data-tc-look="standard"]');
    const clean = new Map(block(tokensCss, ':where([data-tc-look="clean"]').map((t) => [t.name, t.value]));
    return [
      { title: "Primitives", about: "Raw values – look- and theme-independent. Components don't use the colour primitives directly.", tokens: block(tokensCss, ":where(:root) {"), single: true },
      {
        title: "Semantic and pattern tokens",
        about: "What components use: text, surfaces, borders, status, and one recipe per UI pattern (controls, menus, cards, trays…). Valued per look; every colour is a light / dark pair.",
        tokens: standard.map((t) => ({ ...t, clean: clean.get(t.name) })) as Token[],
      },
    ];
  }, []);
  const cleanOf = useMemo(() => new Map(block(tokensCss, ':where([data-tc-look="clean"]').map((t) => [t.name, t.value])), []);
  const match = (t: Token) => !q || `${t.name} ${t.group}`.toLowerCase().includes(q.toLowerCase());
  return (
    <>
      <header className="docs-head">
        <div className="docs-eyebrow">Foundations</div>
        <h1>Tokens</h1>
        <p className="docs-lede">
          Every value the components read. Colours are shown live in both looks and both themes – they're{" "}
          <code>light-dark()</code> pairs, so the browser resolves them where they're used. Override any of them with a plain rule:{" "}
          <code>{":root { --tc-accent: … }"}</code>.
        </p>
        <input className="search docs-token-search" type="search" placeholder="Filter tokens…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter tokens" />
      </header>
      {layers.map((layer) => {
        const groups = [...new Set(layer.tokens.filter(match).map((t) => t.group))];
        return (
          <section key={layer.title} className="docs-section">
            <h2>{layer.title}</h2>
            <p className="docs-hint muted">{layer.about}</p>
            {groups.map((g) => (
              <div key={g}>
                <h3 className="docs-sub">{g}</h3>
                <div className="docs-table-wrap">
                  <table className="docs-table docs-token-table">
                    <thead>
                      {layer.single ? (
                        <tr>
                          <th scope="col">Token</th>
                          <th scope="col">Value</th>
                        </tr>
                      ) : (
                      <tr>
                        <th scope="col">Token</th>
                        <th scope="col">Standard · light</th>
                        <th scope="col">Standard · dark</th>
                        <th scope="col">Clean · light</th>
                        <th scope="col">Clean · dark</th>
                      </tr>
                      )}
                    </thead>
                    <tbody>
                      {layer.tokens
                        .filter((t) => t.group === g && match(t))
                        .map((t) => (
                          <tr key={t.name}>
                            <td>
                              <code>{t.name}</code>
                            </td>
                            {layer.single ? (
                              <td>
                                <span className="docs-token-single">
                                  {kindOf(t) === "color" && <span className="docs-swatch" style={{ background: t.value }} />}
                                  <code className="docs-type docs-token-value">{t.value}</code>
                                </span>
                              </td>
                            ) : (["standard", "clean"] as const).flatMap((look) =>
                              (["light", "dark"] as const).map((theme) => (
                                <td key={`${look}-${theme}`}>
                                  <Swatch token={t} look={look} theme={theme} value={look === "clean" ? (cleanOf.get(t.name) ?? t.value) : t.value} />
                                </td>
                              )),
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}

function Swatch({ token, look, theme, value }: { token: Token; look: "standard" | "clean"; theme: "light" | "dark"; value: string }) {
  const kind = kindOf(token);
  if (kind === "value") return <code className="docs-type docs-token-value">{value}</code>;
  return (
    <span className="docs-swatch-cell" data-tc-look={look} data-tc-theme={theme} title={value}>
      {kind === "color" ? <span className="docs-swatch" style={{ background: `var(${token.name})` }} /> : <span className="docs-swatch docs-swatch-shadow" style={{ boxShadow: `var(${token.name})` }} />}
    </span>
  );
}
