// The parts of a docs page that remediation 6.5 added: the per-framework imports in the header, the framework tabs
// (shared by Usage and Frameworks, and remembered), the Frameworks section, Browser support and Performance.
import { marked } from "marked";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { CodeBlock } from "../../../src/elements/react";
import {
  FRAMEWORKS,
  angularName,
  bindEvent,
  bindProperty,
  controlledSnippets,
  reactEvent,
  twoWay,
  type ApiPage,
  type ApiReact,
  type Browser,
  type BrowserFeature,
  type Framework,
  type FrameworkFacts,
  type Runtime,
} from "./usage";

// ── Shared bits ──────────────────────────────────────────────────────────────────────────────────────────────────
/** Tag names in JSDoc prose ("<tc-look-provider>") are text, not HTML – escaped outside code spans */
export const escapeTags = (text: string) => text.split(/(`[^`]*`)/).map((part, i) => (i % 2 ? part : part.replace(/</g, "&lt;"))).join("");
/** A description with its inline code and emphasis rendered */
export const Inline = ({ text }: { text: string }) => <span dangerouslySetInnerHTML={{ __html: marked.parseInline(escapeTags(text), { async: false }) as string }} />;
export const dash = <span className="muted">–</span>;
export const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const ms = (n: number) => (n < 10 ? `${n.toFixed(1)} ms` : `${Math.round(n)} ms`);
const count = (n: number) => n.toLocaleString("en-GB");

export function Table({ head, rows, label }: { head: string[]; rows: ReactNode[][]; label: string }) {
  if (!rows.length) return null;
  // A wide table scrolls sideways: the wrapper is a named region keyboard users can focus and scroll
  return (
    <div className="docs-table-wrap" role="region" aria-label={label} tabIndex={0}>
      <table className="docs-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── The reader's framework: one choice for every tab set on every page, remembered ─────────────────────────────
const KEY = "trenchcoat-docs-framework";
const listeners = new Set<() => void>();
let chosen: Framework | null = null;
function read(): Framework {
  if (chosen) return chosen;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && FRAMEWORKS.some(([f]) => f === saved)) return (chosen = saved as Framework);
  } catch {
    // storage unavailable
  }
  // No framework is the default but the platform's own: HTML works everywhere
  return "html";
}
function pick(f: Framework) {
  chosen = f;
  try {
    localStorage.setItem(KEY, f);
  } catch {
    // storage unavailable – the choice holds for this visit
  }
  listeners.forEach((l) => l());
}
export function useFramework(): [Framework, (f: Framework) => void] {
  const f = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "html" as Framework,
  );
  return [f, pick];
}

/** Tabs for the frameworks: arrow keys, Home and End move between them (WAI-ARIA tabs, automatic activation) */
export function FrameworkTabs({ id, long = false, children }: { id: string; long?: boolean; children: (fw: Framework) => ReactNode }) {
  const [fw, setFw] = useFramework();
  const list = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent) => {
    const i = FRAMEWORKS.findIndex(([f]) => f === fw);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: FRAMEWORKS.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = FRAMEWORKS[(to + FRAMEWORKS.length) % FRAMEWORKS.length][0];
    setFw(next);
    list.current?.querySelector<HTMLElement>(`[data-fw="${next}"]`)?.focus();
  };
  return (
    <>
      <div className="seg docs-fw" role="tablist" aria-label="Framework" ref={list} onKeyDown={onKey}>
        {FRAMEWORKS.map(([f, short, full]) => (
          <button
            key={f} type="button" role="tab" id={`${id}-tab-${f}`} data-fw={f} aria-selected={fw === f} aria-controls={`${id}-panel`}
            tabIndex={fw === f ? 0 : -1} className={fw === f ? "on" : ""} onClick={() => setFw(f)}
          >
            {long ? full : short}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${fw}`}>
        {children(fw)}
      </div>
    </>
  );
}

// ── Header: install and import, per framework ─────────────────────────────────────────────────────────────────────
export function Imports({ slug, api }: { slug: string; api: ApiPage }) {
  const wrappers = api.react.filter((r) => r.exported).map((r) => r.component);
  const mod = `import "trenchcoat/${slug}";`;
  const rows: [string, ReactNode][] = [
    ["Install", <><code>npm install trenchcoat-0.1.0.tgz</code> <a className="docs-link" href="#/foundations/getting-started">packed from the repository</a>, then <code>import "trenchcoat/tokens.css"</code> once</>],
    ["HTML", <code>{mod}</code>],
    ["React / Next.js", wrappers.length ? <><code>{`import { ${wrappers.join(", ")} } from "trenchcoat/react";`}</code> <span className="muted">· in a client component in Next.js</span></> : <><code>{mod}</code> <span className="muted">· no wrapper: use the tag</span></>],
    ["Vue / Nuxt", <><code>{mod}</code> <span className="muted">· tags starting with tc- are custom elements</span></>],
    ["Angular", <><code>{`import { ${api.elements.map(angularName).join(", ")} } from "trenchcoat/angular";`}</code> <span className="muted">· standalone directives, no schema</span></>],
    ["Svelte", <code>{mod}</code>],
  ];
  return (
    <dl className="docs-imports" aria-label="Install and import">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── Frameworks ───────────────────────────────────────────────────────────────────────────────────────────────────
const SETUP: Record<Framework, ReactNode> = {
  html: <>Import the module once – it registers the tag – and load <code>trenchcoat/tokens.css</code>. Nothing else to set up.</>,
  react: <>The wrappers in <code>trenchcoat/react</code> take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a <code>"use client"</code> file.</>,
  vue: <>Tell the template compiler that <code>tc-</code> tags are custom elements: <code>compilerOptions.isCustomElement</code> in the Vue plugin, or <code>vue.compilerOptions</code> in <code>nuxt.config.ts</code>.</>,
  angular: <>Import the element's directive from <code>trenchcoat/angular</code> into the component's <code>imports</code> – no <code>CUSTOM_ELEMENTS_SCHEMA</code>. The directive registers the tag, and strict templates check every binding and event.</>,
  svelte: <>Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.</>,
};
const SSR: Record<Framework, ReactNode> = {
  html: <>Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.</>,
  react: <>No server rendering in this version. In Next.js, load the component with <code>dynamic(() =&gt; import("./…"), {"{ ssr: false }"})</code> from a <code>"use client"</code> file, with a placeholder the size of the component so the page doesn't shift (<code>examples/next</code>).</>,
  vue: <>In Nuxt, import the module from a client-only plugin (<code>plugins/trenchcoat.client.ts</code>) and wrap the tag in <code>&lt;ClientOnly&gt;</code> (<code>examples/nuxt</code>).</>,
  angular: <>Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add <code>ngSkipHydration</code> to the component that holds it. To keep its code out of the server bundle, put it in a <code>@defer</code> block. (<code>examples/angular</code> renders on the client.)</>,
  svelte: <>In SvelteKit, import the module in <code>onMount</code> or behind <code>browser</code> from <code>$app/environment</code>; the server sends the bare tag. (<code>examples/svelte</code> is client-only.)</>,
};

function typing(fw: Framework, f: FrameworkFacts, react?: ApiReact): ReactNode {
  const el = <code>{`import type { ${f.className} } from "${f.module}";`}</code>;
  switch (fw) {
    case "html":
      return <>With TypeScript or <code>// @ts-check</code>, <code>document.querySelector("{f.tag}")</code> returns a <code>{f.className}</code> (the module adds the tag to <code>HTMLElementTagNameMap</code>). The class: {el}</>;
    case "react":
      return react?.exported ? <>Props: <code>{`import type { ${react.component}Props } from "trenchcoat/react";`}</code> – or <code>{`ComponentProps<typeof ${react.component}>`}</code>. The element class, for refs: {el}</> : <>The element class: {el}</>;
    case "vue":
      return <>Add <code>import type {"{}"} from "trenchcoat/vue";</code> to a <code>.d.ts</code> file: <code>vue-tsc</code> then checks the tag's props and <code>@tc-…</code> events in templates. A property's type: <code>{`${f.className}["${f.data[0] ?? f.attributes[0]?.name ?? "look"}"]`}</code> with {el}</>;
    case "angular":
      return <>The directive types the template: <code>[{f.data[0] ?? f.attributes[0]?.name ?? "look"}]</code> takes <code>{`${f.className}["${f.data[0] ?? f.attributes[0]?.name ?? "look"}"]`}</code>, and <code>$event</code> is the event's <code>CustomEvent&lt;…&gt;</code>, so a misspelt input or a wrong type fails the build. For the element itself, <code>#ref</code> with <code>exportAs</code> gives the directive and its <code>element</code>. {el}</>;
    case "svelte":
      return <>Add <code>import type {"{}"} from "trenchcoat/svelte";</code> to a <code>.d.ts</code> file: <code>svelte-check</code> then knows the tag's props. Type <code>bind:this</code> with {el}</>;
  }
}

const TWO_WAY_NOTE: Record<Framework, ReactNode> = {
  html: <>Listen for the change and keep your copy; set the property when your copy changes.</>,
  react: <>Pass the value and its callback. Leave the value out to let the element keep it, starting at the <code>default…</code> prop.</>,
  vue: <><code>v-model</code> doesn't apply: on an element it listens for <code>input</code> and reads <code>value</code>, while Trenchcoat reports changes with <code>tc-value-change</code>. Bind the value and take it back from the event:</>,
  angular: <>With Angular forms, an element that holds a <code>value</code> takes <code>[(ngModel)]</code>, <code>[formControl]</code> or <code>formControlName</code> through its accessor in <code>trenchcoat/angular/forms</code>. Without forms, bind the value and take it back from the event:</>,
  svelte: <><code>bind:value</code> doesn't apply to a custom element's events. Pass the value and take it back from the event:</>,
};

export function FrameworksSection({ slug, api, reactTable }: { slug: string; api: ApiPage; reactTable: ReactNode }) {
  const f = api.frameworks?.[0];
  const react = api.react.find((r) => r.exported);
  if (!f) return <p className="muted">Generate the page's data: <code>node scripts/gen-docs.mjs {slug}</code>.</p>;
  const controlled = controlledSnippets(slug, f, react);
  const cancelable = f.events.filter((e) => e.cancelable);
  return (
    <FrameworkTabs id={`fw-${slug}`} long>
      {(fw) => (
        <div className="docs-fw-panel">
          <p>
            {SETUP[fw]} <a className="docs-link" href="#/foundations/frameworks">Set-up for each framework</a>
          </p>

          <h3 className="docs-sub">Data properties</h3>
          {f.data.length ? (
            <>
              <p className="docs-hint muted">Lists, objects and functions are properties, not attributes – bind them as properties:</p>
              <Table label="Data properties" head={["Property", fw === "react" ? "React" : "Binding"]} rows={f.data.map((p) => [<code key="p">{p}</code>, <code key="b">{bindProperty(fw, f, p)}</code>])} />
            </>
          ) : (
            <p className="docs-hint muted">Everything it takes is a string, number or boolean, so attributes work too.</p>
          )}
          {f.attributes.length > 0 && (
            <p className="docs-hint muted">
              Also attributes: {f.attributes.slice(0, 8).map((a, i) => <span key={a.name}>{i ? ", " : ""}<code>{a.attribute}</code></span>)}
              {f.attributes.length > 8 ? ` and ${f.attributes.length - 8} more` : ""} – see the API table.
            </p>
          )}

          <h3 className="docs-sub">Events</h3>
          {f.events.length ? (
            <Table
              label="Events" head={["Event", fw === "react" ? "React prop" : "Listen with", "Cancelable"]}
              rows={f.events.map((e) => [<code key="n">{e.name}</code>, <code key="b">{bindEvent(fw, f, e.name, react)}</code>, e.cancelable ? "Yes" : "No"])}
            />
          ) : (
            <p className="docs-hint muted">No <code>tc-</code> events of its own: listen for the native ones (<code>click</code>, <code>focus</code>…) as usual.</p>
          )}
          {fw === "react" && f.events.some((e) => !reactEvent(e.name, react)) && <p className="docs-hint muted">Events without a prop: listen on the element through a ref.</p>}

          <h3 className="docs-sub">Controlled</h3>
          {f.controlled.length ? (
            <>
              <p className="docs-hint muted">
                The element changes {f.controlled.map((c, i) => <span key={c.property}>{i ? (i === f.controlled.length - 1 ? " and " : ", ") : ""}<code>{c.property}</code></span>)} itself unless a listener calls <code>preventDefault()</code> on{" "}
                {f.controlled.map((c, i) => <span key={c.event}>{i ? (i === f.controlled.length - 1 ? " or " : ", ") : ""}<code>{c.event}</code></span>)} – then the app decides and sets it.
                {fw === "react" && " The wrapper does that for you when you pass the value."}
              </p>
              {controlled?.[fw] ? (
                <CodeBlock key={`c-${fw}`} code={controlled[fw]!} language={FRAMEWORKS.find(([x]) => x === fw)![3]} look="clean" lineNumbers={false} wrap />
              ) : (
                <p className="docs-hint muted">The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.</p>
              )}
            </>
          ) : cancelable.length ? (
            <p className="docs-hint muted">
              {cancelable.map((e, i) => <span key={e.name}>{i ? ", " : ""}<code>{e.name}</code></span>)} {cancelable.length > 1 ? "are" : "is"} cancelable: call <code>preventDefault()</code> to stop what the element would do next.
            </p>
          ) : (
            <p className="docs-hint muted">Nothing to control: it keeps no value the user changes.</p>
          )}

          {f.form && (
            <>
              <h3 className="docs-sub">Two-way binding</h3>
              <p className="docs-hint muted">
                {TWO_WAY_NOTE[fw]}
                {f.form.formAssociated && fw !== "react" && " It takes part in its form: the value is submitted under its name, and reset with the form."}
              </p>
              {twoWay(fw, f, react) && <CodeBlock key={`t-${fw}`} code={twoWay(fw, f, react)!} language={fw === "angular" ? "html" : FRAMEWORKS.find(([x]) => x === fw)![3]} look="clean" lineNumbers={false} wrap />}
            </>
          )}

          <h3 className="docs-sub">Slots and children</h3>
          {f.slots.length ? (
            <p className="docs-hint muted">
              Put children inside the tag with a <code>slot</code> attribute: {f.slots.map((s, i) => <span key={s}>{i ? ", " : ""}<code>{s === "(default)" ? "no slot attribute" : `slot="${s}"`}</code></span>)}.
              {fw === "vue" && <> It's the HTML attribute, not Vue's <code>&lt;template #name&gt;</code>.</>}
              {fw === "react" && " In React, pass them as children with the same attribute."} The element renders into itself (no shadow root) and leaves them where you put them.
            </p>
          ) : (
            <p className="docs-hint muted">No slots: everything it shows comes from its properties{fw === "react" && react?.props.some((p) => p.name === "children") ? ", and the wrapper's children" : ""}.</p>
          )}

          <h3 className="docs-sub">Server rendering</h3>
          <p className="docs-hint muted">{SSR[fw]}</p>

          <h3 className="docs-sub">TypeScript</h3>
          <p className="docs-hint muted">{typing(fw, f, react)}</p>

          {fw === "react" && reactTable}
        </div>
      )}
    </FrameworkTabs>
  );
}

// ── Browser support ──────────────────────────────────────────────────────────────────────────────────────────────
type Floor = { floor: Record<Browser, string | null>; engines: { playwright: string; chromium: string; firefox: string; webkit: string } };
const floorFile = Object.values(import.meta.glob<Floor>("./browser-floor.json", { eager: true, import: "default" }))[0];
const BROWSERS: [Browser[], string][] = [
  [["chrome", "edge"], "Chrome / Edge"],
  [["firefox"], "Firefox"],
  [["safari"], "Safari (macOS)"],
  [["safari_ios"], "Safari (iOS, iPadOS)"],
];
const version = (v: string | null) => (v === null ? "No" : v === "1" ? "Any" : v);
const both = (v: Record<Browser, string | null>) => (v.chrome === v.edge ? version(v.chrome) : `${version(v.chrome)} (Edge ${version(v.edge)})`);

export function BrowserSupportSection({ api, singular }: { api: ApiPage; singular: string }) {
  const b = api.browser;
  if (!b) return null;
  const name = (id: string) => b.features.find((x) => x.id === id)?.name ?? id;
  const required = b.features.filter((x) => !x.progressive);
  const progressive = b.features.filter((x) => x.progressive);
  const e = floorFile?.engines;
  const featureRows = (list: BrowserFeature[]) =>
    list.map((x) => [
      <span key="n">
        {x.name}
        {x.note && <span className="muted"> ({x.note})</span>}
      </span>,
      both(x.versions),
      version(x.versions.firefox),
      version(x.versions.safari),
      version(x.versions.safari_ios),
      <span key="v" className="muted">{x.via.join(", ")}</span>,
      x.progressive ? <span key="w">{x.without}</span> : x.why ? <span key="w" className="muted">{x.why}</span> : dash,
    ]);
  return (
    <>
      <Table
        label="Minimum versions" head={["Browser", "Works fully from", "Set by"]}
        rows={BROWSERS.map(([keys, label]) => [
          label,
          <strong key="v">{keys.length > 1 ? both(b.floor) : version(b.floor[keys[0]])}</strong>,
          <span key="s" className="muted">{(b.setBy[keys[0]] ?? []).map(name).join(", ") || "–"}</span>,
        ])}
      />
      <p className="docs-hint muted">
        Tested in {e ? `Chromium ${e.chromium.split(".")[0]}, Firefox ${e.firefox.split(".")[0]} and WebKit ${e.webkit}` : "Chromium, Firefox and WebKit"} – the engines behind Chrome and Edge, Firefox,
        and Safari – where every element's tests and axe checks run (Playwright{e ? ` ${e.playwright}` : ""}). The versions come from the platform features {singular} uses, from MDN's
        browser-compat-data; <a className="docs-link" href="#/foundations/browser-support">how they're worked out</a>.
      </p>
      <h3 className="docs-sub">Features it needs</h3>
      <Table label="Features it needs" head={["Feature", "Chrome / Edge", "Firefox", "Safari", "iOS", "Used in", "Why"]} rows={featureRows(required)} />
      {progressive.length > 0 && (
        <>
          <h3 className="docs-sub">Progressive</h3>
          <p className="docs-hint muted">Used where the browser has them; without them it still works, with the difference described.</p>
          <Table label="Progressive features" head={["Feature", "Chrome / Edge", "Firefox", "Safari", "iOS", "Used in", "Without it"]} rows={featureRows(progressive)} />
        </>
      )}
    </>
  );
}

// ── Performance ──────────────────────────────────────────────────────────────────────────────────────────────────
export type PerfEntry = {
  measuredAt: string;
  hash: string;
  bundle: { own: { min: number; gzip: number }; shared: { name: string; kind: string; min: number }[]; withoutLit: { min: number; gzip: number }; withLit: { min: number; gzip: number } };
  render: null | {
    error?: string;
    tag: string;
    source: "demo" | "defaults";
    runs: number;
    cold: number;
    first: number;
    update: number;
    updateKind: string;
    nodes: number;
    scale: { property: string; demoItems: number; points: { items: number; first: number; update: number; nodes: number }[] } | null;
    idle: Record<"visible" | "away" | "reducedMotion", { frames: number; timers: number }>;
  };
};
export type PerfFile = { environment: { browser: string; os: string; cpu: string; playwright: string; runs: number }; pieces: Record<string, PerfEntry> };
const perfLoader = Object.values(import.meta.glob<PerfFile>("./perf.json", { import: "default" }))[0];
const budgets = (Object.values(import.meta.glob<Record<string, number>>("../../../tests/render-budgets.json", { eager: true, import: "default" }))[0] ?? {}) as Record<string, number>;
let perfCache: PerfFile | null = null;

function usePerf() {
  const [perf, setPerf] = useState<PerfFile | null>(perfCache);
  useEffect(() => {
    if (perfCache || !perfLoader) return;
    void perfLoader().then((p) => setPerf((perfCache = p)));
  }, []);
  return perf;
}

const KIND: Record<string, string> = { lit: "the library every element is built on, the parts it uses", internal: "Shared Trenchcoat code", element: "Element it renders", other: "Dependency" };

/** How a list scales, in a sentence */
function scaling(r: NonNullable<PerfEntry["render"]>, windowed: boolean) {
  const s = r.scale;
  if (!s?.points.length) return null;
  const last = s.points[s.points.length - 1];
  if (windowed) return `Windowed: ${count(last.items)} items of ${s.property} render ${count(last.nodes)} nodes in ${ms(last.first)} – only the rows near the viewport are in the page.`;
  if (s.points.every((p) => p.nodes === r.nodes)) return `What it renders doesn't grow with ${s.property} (tested to ${count(last.items)} items).`;
  if (last.first <= 50) return `${count(last.items)} items of ${s.property}: ${ms(last.first)}, ${count(last.nodes)} nodes. It renders every item – past a few thousand, page through them or use a windowed list.`;
  // Linear estimate of where a first render becomes a long task (50 ms)
  const per = last.first / last.items;
  const limit = Math.max(10, Math.round(50 / per / 10) * 10);
  return `${count(last.items)} items of ${s.property}: ${ms(last.first)}. It renders every item, so a first render passes 50 ms (a long task) at about ${count(limit)} items – page or filter longer lists.`;
}

export function PerformanceSection({ slug, entryId, api, library }: { slug: string; entryId: string; api: ApiPage; library: string }) {
  const perf = usePerf();
  const p = perf?.pieces[slug];
  const rt = api.runtime;
  const budgetKeys = Object.keys(budgets).filter((k) => k.startsWith(`${entryId}:`));
  if (!perfLoader || (perf && !p))
    return (
      <>
        <p className="docs-hint muted">
          Not measured yet – <code>npm run measure:perf -- {slug}</code> measures it (or <code>-- --missing</code> for every element not measured yet). Size without Lit:{" "}
          {api.size ? `${kb(api.size.gzip)} gzip, ${kb(api.size.min)} min` : "–"}.
        </p>
        {rt && <RuntimeNotes rt={rt} idle={null} />}
      </>
    );
  if (!p) return <p className="docs-hint muted">Loading the measurements…</p>;
  const b = p.bundle;
  const r = p.render;
  return (
    <>
      <p className="docs-hint muted">
        Measured {p.measuredAt} in headless {perf!.environment.browser} on {perf!.environment.cpu || perf!.environment.os} by <code>npm run measure:perf</code>.{" "}
        <a className="docs-link" href="#/foundations/performance">What the numbers mean</a>
      </p>

      <h3 className="docs-sub">Bundle</h3>
      <Table
        label="Bundle size" head={["Part", "Minified", "Gzip"]}
        rows={[
          [<strong key="o">This {library === "components" ? "component" : "piece"} alone</strong>, kb(b.own.min), kb(b.own.gzip)],
          ...b.shared.map((s) => [
            <span key="s">
              {s.kind === "element" ? <a className="docs-link" href={`#/${s.name}`}>{s.name}</a> : s.name === "Lit" ? "Lit" : <code>{s.name}</code>} <span className="muted">· {KIND[s.kind]}</span>
            </span>,
            kb(s.min),
            dash,
          ]),
          [<strong key="w">Added to a page that already has Lit</strong>, <strong key="m">{kb(b.withoutLit.min)}</strong>, <strong key="g">{kb(b.withoutLit.gzip)}</strong>],
          ["With Lit – the first component on a page", kb(b.withLit.min), kb(b.withLit.gzip)],
        ]}
      />
      <p className="docs-hint muted">
        Shared code counts once per page: a second component that uses the same <code>internal/*</code> modules or renders the same elements adds only its own code. Shared rows show
        their share of the minified bundle; gzip only exists for whole files.
      </p>

      <h3 className="docs-sub">Rendering</h3>
      {!r || r.error ? (
        <p className="docs-hint muted">The render measurement failed: {r?.error ?? "no result"}.</p>
      ) : (
        <>
          <Table
            label="Render timings" head={["Measure", "Time", "Details"]}
            rows={[
              ["First render", <strong key="f">{ms(r.first)}</strong>, <span key="n" className="muted">{r.source === "demo" ? "the gallery demo's data" : "default properties"}, {count(r.nodes)} DOM nodes – to layout, median of {r.runs}</span>],
              ["Typical update", <strong key="u">{ms(r.update)}</strong>, <span key="n" className="muted">{r.updateKind}</span>],
              ["First on the page", ms(r.cold), <span key="n" className="muted">default properties; includes adding its CSS to the document</span>],
              ...(r.scale?.points ?? []).map((pt) => [`${count(pt.items)} items`, ms(pt.first), <span key="n" className="muted">{r.scale!.property}: first render, {count(pt.nodes)} nodes; update {ms(pt.update)}</span>]),
            ]}
          />
          {scaling(r, !!rt?.windowed) && <p className="docs-hint">{scaling(r, !!rt?.windowed)}</p>}
          <p className="docs-hint muted">
            Render budget (smoke test, the gallery demo over 5 simulated seconds):{" "}
            {budgetKeys.length ? budgetKeys.map((k, i) => <span key={k}>{i ? ", " : ""}{budgets[k]} React commits ({k.split(":")[1]})</span>) : "none recorded – the default of 300 applies"}
            {budgetKeys.length ? ", with 30 % headroom." : "."} It counts re-renders, so it catches a component that renders on every frame.
          </p>
        </>
      )}

      <h3 className="docs-sub">Runtime</h3>
      {rt && <RuntimeNotes rt={rt} idle={r && !r.error ? r.idle : null} />}
    </>
  );
}

function RuntimeNotes({ rt, idle }: { rt: Runtime; idle: NonNullable<PerfEntry["render"]>["idle"] | null }) {
  const list = (xs: string[]) => xs.map((x, i) => <span key={x}>{i ? ", " : ""}<code>{x.replace(/ \(.*/, "")}</code>{/\(/.test(x) && <span className="muted"> {x.match(/\(.*\)/)![0].replace("›", "–")}</span>}</span>);
  const rate = (v: { frames: number; timers: number }) => (v.frames || v.timers ? `${v.frames ? `${Math.round(v.frames)} frames/s` : ""}${v.frames && v.timers ? ", " : ""}${v.timers ? `${Math.round(v.timers)} timer callbacks/s` : ""}` : "nothing");
  const items: ReactNode[] = [];
  if (idle) items.push(<>At rest with the demo's data: <strong>{rate(idle.visible)}</strong> on screen, <strong>{rate(idle.away)}</strong> scrolled away, <strong>{rate(idle.reducedMotion)}</strong> under reduced motion (measured).</>);
  items.push(rt.frames.length ? <>Animation frames: {list(rt.frames)}.</> : <>No animation-frame loop.</>);
  items.push(rt.timers.length ? <>Timers: {list(rt.timers)}.</> : <>No timers.</>);
  if (rt.animations) items.push(<>{rt.animations} infinite CSS animation{rt.animations > 1 ? "s" : ""}.</>);
  const pauses = [rt.pauses.offscreen.length && "off screen", rt.pauses.hidden.length && "in a hidden tab", rt.pauses.reducedMotion.length && "under reduced motion"].filter(Boolean);
  if (pauses.length) items.push(<>Stops or pauses {pauses.join(", ").replace(/, ([^,]*)$/, " and $1")}.</>);
  items.push(rt.observers.length ? <>Observers: {list(rt.observers)}.</> : <>No observers.</>);
  if (rt.listeners.length) items.push(<>Listens on the page: {list(rt.listeners)}.</>);
  items.push(rt.clock.length ? <>Reads the clock: {list(rt.clock)}.</> : <>Doesn't read the clock.</>);
  return (
    <>
      <ul className="docs-guarantees">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
      <p className="docs-hint muted">Found in its source and the shared code it uses (gen-docs); “measured” rows come from <code>measure:perf</code>.</p>
    </>
  );
}
