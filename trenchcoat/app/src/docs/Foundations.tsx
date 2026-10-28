// The foundations pages beside the component pages (remediation Part 4.4): getting started, looks, themes, tokens,
// accessibility, patterns and the changelog. Prose lives in ./foundations/*.md; the Tokens page reads tokens.css.
import { marked } from "marked";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Table, kb, type PerfFile } from "./DocsSections";
import type { Browser } from "./usage";
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
  ["frameworks", "Frameworks"],
  ["generative-ui", "Generative UI"],
  ["browser-support", "Browser support"],
  ["performance", "Performance"],
  ["changelog", "Changelog"],
];

/** Generated parts of a prose page, where its markdown has the marker comment */
const GENERATED: Record<string, () => ReactNode> = {
  floor: () => <Floor />,
  summary: () => <PerfSummary />,
};
const html = (text: string) => ({ __html: marked.parse(text, { async: false }) as string });

export function Foundations({ page }: { page: string }) {
  const source = page === "changelog" ? changelog : prose[`./foundations/${page}.md`];
  return (
    <div className="docs docs-foundation">
      <article className="docs-body">
        {page === "tokens" ? (
          <Tokens />
        ) : source ? (
          <div className="docs-prose">
            {source.split(/<!-- (\w+) -->/).map((part, i) =>
              i % 2 ? <div key={i}>{GENERATED[part]?.()}</div> : <div key={i} className="docs-md" dangerouslySetInnerHTML={html(part)} />,
            )}
          </div>
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
        <p className="docs-lede">
          For design tools, the same tokens ship in the Design Tokens Community Group format (DTCG 2025.10), in{" "}
          <code>trenchcoat/tokens/dtcg/</code>:
        </p>
        <ul className="docs-lede">
          <li>
            <code>primitives.json</code> holds the primitives.
          </li>
          <li>
            One file per look and theme holds the semantic and pattern tokens, as aliases where the CSS points at another token – a
            shadow's or border's colour and width included: <code>standard-light.json</code>, <code>standard-dark.json</code>,{" "}
            <code>clean-light.json</code> and <code>clean-dark.json</code>. Values built with <code>color-mix()</code> or{" "}
            <code>calc()</code> have no DTCG form, so they're exported resolved. Style Dictionary reads these files as they are.
          </li>
          <li>
            <code>tokens-studio/</code> holds the same sets for Tokens Studio, whose DTCG mode doesn't read 2025.10 colour and
            dimension objects yet: values are strings (<code>"#2f68ff"</code>, <code>"4px"</code>), types are its own
            (<code>boxShadow</code>, <code>fontWeights</code>), a group's own token is <code>DEFAULT</code>, and{" "}
            <code>$themes.json</code> pairs each mode with the primitives.
          </li>
          <li>
            A few tokens have no DTCG type (em letter-spacing, <code>uppercase</code>, a padding shorthand, a shadow of{" "}
            <code>none</code>). They're listed with their CSS under <code>$extensions</code> in each file.
          </li>
          <li>
            CI checks every exported token against what a browser computes from <code>tokens.css</code>, in each look and theme.
          </li>
        </ul>
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

// ── Browser support: the library-wide floor (app/src/docs/browser-floor.json, written by gen-docs) ───────────────
type FloorFile = {
  floor: Record<Browser, string | null>;
  setBy: Record<Browser, { features: string[]; elements: number }>;
  features: { id: string; name: string; versions: Record<Browser, string | null>; progressive: boolean; without?: string; elements: number }[];
  engines: { playwright: string; chromium: string; firefox: string; webkit: string };
};
const floorFile = Object.values(import.meta.glob<FloorFile>("./browser-floor.json", { eager: true, import: "default" }))[0];
const v = (x: string | null) => (x === null ? "No" : x);

function Floor() {
  if (!floorFile) return <p className="muted">Run node scripts/gen-docs.mjs to work out the floor.</p>;
  const f = floorFile;
  const name = (id: string) => f.features.find((x) => x.id === id)?.name ?? id;
  const row = (b: Browser, label: string) => [label, <strong key="v">{v(f.floor[b])}</strong>, f.setBy[b].features.map(name).join(", "), `${f.setBy[b].elements} components`];
  return (
    <>
      <Table
        label="Library-wide floor" head={["Browser", "Works fully from", "Set by", "At that version"]}
        rows={[row("chrome", "Chrome"), row("edge", "Edge"), row("firefox", "Firefox"), row("safari", "Safari (macOS)"), row("safari_ios", "Safari (iOS, iPadOS)")]}
      />
      <p className="docs-hint muted">
        Tested in Chromium {f.engines.chromium.split(".")[0]}, Firefox {f.engines.firefox.split(".")[0]} and WebKit {f.engines.webkit} (Playwright {f.engines.playwright}).
      </p>
      <h3>Every feature in use</h3>
      <Table
        label="Features in use" head={["Feature", "Chrome / Edge", "Firefox", "Safari", "iOS", "Components", "Kind"]}
        rows={f.features.map((x) => [x.name, v(x.versions.chrome), v(x.versions.firefox), v(x.versions.safari), v(x.versions.safari_ios), x.elements, x.progressive ? `Progressive – ${x.without}` : "Needed"])}
      />
    </>
  );
}

// ── Performance: what was measured, and the heaviest and slowest components ────────────────────────────────────
const perfLoader = Object.values(import.meta.glob<PerfFile>("./perf.json", { import: "default" }))[0];

function PerfSummary() {
  const [perf, setPerf] = useState<PerfFile | null>(null);
  useEffect(() => {
    void perfLoader?.().then(setPerf);
  }, []);
  if (!perfLoader) return <p className="muted">Nothing measured yet – run npm run measure:perf.</p>;
  if (!perf) return <p className="muted">Loading the measurements…</p>;
  const entries = Object.entries(perf.pieces);
  const dates = entries.map(([, p]) => p.measuredAt).sort();
  const heaviest = [...entries].sort(([, a], [, b]) => b.bundle.withoutLit.gzip - a.bundle.withoutLit.gzip).slice(0, 8);
  const slowest = entries.filter(([, p]) => p.render && !p.render.error).sort(([, a], [, b]) => b.render!.first - a.render!.first).slice(0, 8);
  const link = (slug: string) => <a key="l" className="docs-link" href={`#/${slug}`}>{slug}</a>;
  return (
    <>
      <p className="docs-hint muted">
        {entries.length} components measured{dates.length ? `, ${dates[0] === dates[dates.length - 1] ? `on ${dates[0]}` : `between ${dates[0]} and ${dates[dates.length - 1]}`}` : ""}, in headless {perf.environment.browser} on{" "}
        {perf.environment.cpu || perf.environment.os}.
      </p>
      <h3>Largest, on a page that has Lit</h3>
      <Table label="Largest components" head={["Component", "Gzip", "Minified", "Own code (gzip)"]} rows={heaviest.map(([slug, p]) => [link(slug), kb(p.bundle.withoutLit.gzip), kb(p.bundle.withoutLit.min), kb(p.bundle.own.gzip)])} />
      <h3>Slowest first render</h3>
      <Table label="Slowest first render" head={["Component", "First render", "Update", "DOM nodes"]} rows={slowest.map(([slug, p]) => [link(slug), `${p.render!.first} ms`, `${p.render!.update} ms`, p.render!.nodes])} />
    </>
  );
}
