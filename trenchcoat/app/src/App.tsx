import { Component, createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LookProvider } from "../../src/elements/react";
import { DocsPage } from "./docs/DocsPage";
import { FOUNDATIONS, Foundations } from "./docs/Foundations";
import { GUIDANCE } from "./docs/guidance";
import { CATEGORIES, ENTRIES, LIBRARY_INFO, type Entry, type LibraryInfo, type Variant } from "./registry";

type Mode = Variant | "both";
type Theme = "light" | "dark" | "system";

const THEMES: Theme[] = ["light", "dark", "system"];
const THEME_KEY = "trenchcoat-gallery-theme";
const LOOK_KEY = "trenchcoat-gallery-look";
/** The stages' theme – set as data-tc-theme, the mechanism tokens.css documents (chrome stays light) */
const ThemeContext = createContext<Theme>("light");

function useStoredTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return THEMES.includes(saved as Theme) ? (saved as Theme) : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // storage unavailable – the choice just isn't remembered
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

/** The Standard / Clean / Both switch: ?look=clean in the URL wins on load, then the viewer's last choice */
function useStoredMode() {
  const modes: Mode[] = ["standard", "clean", "both"];
  const [mode, setMode] = useState<Mode>(() => {
    const fromUrl = new URLSearchParams(location.search).get("look") as Mode | null;
    if (fromUrl && modes.includes(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem(LOOK_KEY) as Mode | null;
      return saved && modes.includes(saved) ? saved : "both";
    } catch {
      return "both";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(LOOK_KEY, mode);
    } catch {
      // storage unavailable – the choice just isn't remembered
    }
  }, [mode]);
  return [mode, setMode] as const;
}

function useHash() {
  const [hash, setHash] = useState(() => decodeURIComponent(location.hash.slice(2)));
  useEffect(() => {
    const on = () => setHash(decodeURIComponent(location.hash.slice(2)));
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return hash;
}

// Source files, not stages: a component's Clean stage is the same file with look="clean"
const fileCount = (list: Entry[]) => list.reduce((n, e) => n + new Set(Object.values(e.files).map((f) => f.split(" ")[0])).size, 0);
const entriesOf = (library: string) => ENTRIES.filter((e) => e.library === library);

/** Entries grouped by category, in sidebar order, empty groups dropped */
function grouped(list: Entry[]) {
  return CATEGORIES.map((cat) => [cat, list.filter((e) => e.category === cat)] as const)
    .concat([["Other", list.filter((e) => !CATEGORIES.includes(e.category))]])
    .filter(([, items]) => items.length > 0);
}

export function App() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useStoredMode();
  const [theme, setTheme] = useStoredTheme();
  const route = useHash();
  // #/<id> or #/<id>/<section> – ids can hold a slash (illustrations/voice-orb), so the longest match wins
  const focused = ENTRIES.filter((e) => route === e.id || route.startsWith(`${e.id}/`)).sort((a, b) => b.id.length - a.id.length)[0];
  const section = focused && route.length > focused.id.length ? route.slice(focused.id.length + 1) : "";
  const library = LIBRARY_INFO.find((l) => route === `library/${l.key}`);
  const foundation = route.startsWith("foundations/") ? route.slice("foundations/".length) : null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    // Names, descriptions and the docs pages' guidance text
    return ENTRIES.filter((e) => `${e.name} ${e.slug} ${e.library} ${e.description} ${GUIDANCE[e.slug]?.text ?? ""}`.toLowerCase().includes(q));
  }, [query]);

  // Standard/Clean only exists for components, so the switch only shows where components are on screen
  const showVariant = Boolean(results) || library?.key === "components" || focused?.library === "components";

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="logo" aria-hidden>
            ◐
          </span>
          Trenchcoat
        </a>
        <span className="count">
          {ENTRIES.length} items · {fileCount(ENTRIES)} files
        </span>
        <div className="spacer" />
        <input className="search" type="search" placeholder="Search everything…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {showVariant && (
          <div className="seg" role="radiogroup" aria-label="Look">
            {(["standard", "clean", "both"] as Mode[]).map((m) => (
              <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
                {m === "both" ? "Both" : m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        )}
        <div className="seg" role="radiogroup" aria-label="Theme of the previews">
          {THEMES.map((t) => (
            <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? "on" : ""} onClick={() => setTheme(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <nav className="sidebar">
        <a href="#/" className={`navtop ${route === "" ? "active" : ""}`}>
          Overview
        </a>
        <div className="navlib">
          <div className="navlibhead">Foundations</div>
          <div className="navgroup">
            {FOUNDATIONS.map(([id, title]) => (
              <a key={id} href={`#/foundations/${id}`} className={foundation === id ? "active" : ""}>
                {title}
              </a>
            ))}
          </div>
        </div>
        {LIBRARY_INFO.map((lib) => {
          const groups = grouped(entriesOf(lib.key));
          return (
            <div key={lib.key} className="navlib">
              <a href={`#/library/${lib.key}`} className={`navlibhead ${library?.key === lib.key ? "active" : ""}`}>
                {lib.label} <span className="muted">{entriesOf(lib.key).length}</span>
              </a>
              {groups.map(([cat, list]) => (
                <div key={cat} className="navgroup">
                  {groups.length > 1 && <div className="navcat">{cat}</div>}
                  {list.map((e) => (
                    <a key={e.id} href={`#/${e.id}`} className={focused?.id === e.id ? "active" : ""}>
                      {e.name}
                      {!e.Demo && <span className="dot" title="No demo yet" />}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </nav>

      <main className="main">
        <ThemeContext.Provider value={theme}>
        {results ? (
          <Results list={results} query={query} mode={mode} />
        ) : foundation ? (
          <Foundations key={foundation} page={foundation} />
        ) : focused ? (
          <FocusView entry={focused} mode={mode} section={section} />
        ) : library ? (
          <LibraryPage lib={library} mode={mode} />
        ) : (
          <Home />
        )}
        </ThemeContext.Provider>
      </main>
    </div>
  );
}

function Sections({ list, mode }: { list: Entry[]; mode: Mode }) {
  const groups = grouped(list);
  return (
    <>
      {groups.map(([cat, items]) => (
        <section key={cat}>
          {groups.length > 1 && (
            <h2 className="cathead">
              {cat} <span className="muted">{items.length}</span>
            </h2>
          )}
          <div className="grid">
            {items.map((e) => (
              <Card key={e.id} entry={e} mode={mode} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function Results({ list, query, mode }: { list: Entry[]; query: string; mode: Mode }) {
  if (!list.length) return <p className="empty">Nothing matches “{query}”.</p>;
  return <Sections list={list} mode={mode} />;
}

function LibraryPage({ lib, mode }: { lib: LibraryInfo; mode: Mode }) {
  const list = entriesOf(lib.key);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lib]);
  return (
    <>
      <header className="libhead">
        <a href="#/" className="crumb">
          ← Overview
        </a>
        <h1>{lib.label}</h1>
        <p className="tagline">{lib.tagline}</p>
        <p className="about">{lib.about}</p>
        <p className="muted">
          {list.length} items · {fileCount(list)} files
          {lib.key === "components" && " · switch Standard, Clean or Both in the top bar"}
        </p>
      </header>
      <Sections list={list} mode={mode} />
    </>
  );
}

/** The landing page: what Trenchcoat is, the five libraries, and the two component styles */
function Home() {
  const compare = ["button", "change-summary", "segmented-control"].map((slug) => ENTRIES.find((e) => e.id === slug)!);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="home">
      <section className="hero">
        <h1>Trenchcoat</h1>
        <p className="lede">
          A UI kit for AI-native products. Components, illustrations and motion are moving to Lit web components that any framework
          can use, packaged with one stylesheet, <code>tokens.css</code>. Blocks and Screens are single React files you can copy.
        </p>
        <div className="stats">
          {LIBRARY_INFO.map((lib) => (
            <a key={lib.key} href={`#/library/${lib.key}`}>
              <strong>{entriesOf(lib.key).length}</strong>
              <span>{lib.label}</span>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="cathead">What's inside</h2>
        <p className="intro">
          The libraries stack: <b>Motion</b> primitives add movement, <b>Components</b> are the interactive pieces, <b>Blocks</b> combine
          components into sections, and <b>Screens</b> are whole pages in an app shell. <b>Illustrations</b> sit alongside for empty states
          and marketing.
        </p>
        <div className="layers" aria-hidden>
          <span>Motion</span>→<span>Components</span>→<span>Blocks</span>→<span>Screens</span>
          <span className="aside">+ Illustrations</span>
        </div>
        <div className="libgrid">
          {LIBRARY_INFO.map((lib) => {
            const list = entriesOf(lib.key);
            return (
              <a key={lib.key} className="libcard" href={`#/library/${lib.key}`}>
                <div className="libcardhead">
                  <h3>{lib.label}</h3>
                  <span className="muted">
                    {list.length} items · {fileCount(list)} files
                  </span>
                </div>
                <p className="tagline">{lib.tagline}</p>
                <p>{lib.about}</p>
                <p className="examples">
                  {list
                    .slice(0, 5)
                    .map((e) => e.name)
                    .join(" · ")}
                  {list.length > 5 && " …"}
                </p>
                <span className="go">Browse {lib.label} →</span>
              </a>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="cathead">Standard and Clean</h2>
        <p className="intro">
          Every component comes in two styles, picked with its <code>look</code> prop: <code>"standard"</code> (the default) or <code>"clean"</code>.
          They are two design languages, not two weights of one theme: pick one per product. Props and behaviour are the same.
          Blocks, Screens, Illustrations and Motion come in a single style.
        </p>
        <table className="compare">
          <thead>
            <tr>
              <th />
              <th>Standard</th>
              <th>Clean</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Feel</th>
              <td>Tactile and branded – solid outlines, gradient fills on dark buttons, a subtle shine</td>
              <td>Flat and quiet, in the style of Linear or Vercel – hairline shadows instead of borders</td>
            </tr>
            <tr>
              <th>Surfaces</th>
              <td>Cards often sit in a gray tray</td>
              <td>One white card, 0.5px dividers</td>
            </tr>
            <tr>
              <th>Colour</th>
              <td>Solid greys and solid accents (e.g. bright red for destructive)</td>
              <td>Translucent greys and soft tints (e.g. an 8% red fill)</td>
            </tr>
            <tr>
              <th>Icons</th>
              <td>1.5–1.6px strokes</td>
              <td>1.1–1.25px strokes</td>
            </tr>
            <tr>
              <th>API</th>
              <td colSpan={2}>
                Same props and behaviour. A few clean files go further: Decision Tree adds follow-up questions, Combobox and Filter Menu fold
                extra chips into “+N”.
              </td>
            </tr>
            <tr>
              <th>Theming</th>
              <td colSpan={2}>
                Both read the shared <code>--tc-</code> design tokens: override one (e.g. <code>--tc-accent</code>) to theme every component,
                or a component token (e.g. <code>--tc-button-radius</code>) for one. Each style carries its own values as fallbacks.
              </td>
            </tr>
            <tr>
              <th>Mixing</th>
              <td colSpan={2}>Each style has its own CSS class prefix, so both can appear on one page without clashing.</td>
            </tr>
          </tbody>
        </table>
        <p className="intro">See the difference live:</p>
        <div className="grid">
          {compare.map((e) => (
            <Card key={e.id} entry={e} mode="both" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="cathead">Using a file</h2>
        <ol className="steps">
          <li>
            Components need <code>tokens/tokens.css</code> on the page – it holds every value they use. While they're ported to Lit, copy{" "}
            <code>src/components/&lt;name&gt;.tsx</code> together with <code>src/internal/</code>.
          </li>
          <li>
            Blocks, Screens, Illustrations and Motion are self-contained: copy the file into your project, e.g. <code>components/ui/</code>, and
            import it from there.
          </li>
          <li>
            If it imports another piece as <code>@/components/ui/&lt;name&gt;</code>, copy that file alongside – Screens build on App Shell,
            Blocks on components like Button and Kpi Chart.
          </li>
          <li>
            The styles are injected by the file itself. Theme it by overriding <code>--tc-</code> tokens in <code>tokens/tokens.css</code> or
            on any ancestor. Dark mode: <code>data-tc-theme="dark"</code> (or{" "}
            <code>.dark</code>) on an ancestor, <code>data-tc-theme="system"</code> to follow the OS. Reduced motion is respected automatically.
          </li>
          <li>Open any item here to see its file name, and use Replay to restart its animations.</li>
        </ol>
      </section>
    </div>
  );
}

/** Pieces that are elements get a design-system page; blocks and screens keep the plain focus view */
const DOCUMENTED = new Set(["components", "illustrations", "motion"]);

function FocusView({ entry, mode, section }: { entry: Entry; mode: Mode; section: string }) {
  const i = ENTRIES.indexOf(entry);
  const prev = ENTRIES[(i - 1 + ENTRIES.length) % ENTRIES.length];
  const next = ENTRIES[(i + 1) % ENTRIES.length];
  const lib = LIBRARY_INFO.find((l) => l.key === entry.library)!;
  useEffect(() => {
    if (!DOCUMENTED.has(entry.library)) window.scrollTo(0, 0);
  }, [entry]);
  if (DOCUMENTED.has(entry.library)) {
    return (
      <div className="focus">
        <div className="focusnav">
          <a href={`#/library/${lib.key}`}>← {lib.label}</a>
          <div className="spacer" />
          <a href={`#/${prev.id}`}>‹ {prev.name}</a>
          <a href={`#/${next.id}`}>{next.name} ›</a>
        </div>
        <DocsPage entry={entry} section={section} example={<Card key={entry.id} entry={entry} mode={mode} large stagesOnly />} />
      </div>
    );
  }
  return (
    <div className="focus">
      <div className="focusnav">
        <a href={`#/library/${lib.key}`}>← {lib.label}</a>
        <div className="spacer" />
        <a href={`#/${prev.id}`}>‹ {prev.name}</a>
        <a href={`#/${next.id}`}>{next.name} ›</a>
      </div>
      <Card key={entry.id} entry={entry} mode={mode} large />
    </div>
  );
}

function Card({ entry, mode, large = false, stagesOnly = false }: { entry: Entry; mode: Mode; large?: boolean; stagesOnly?: boolean }) {
  const [run, setRun] = useState(0);
  const variants = (mode === "both" ? (["standard", "clean"] as Variant[]) : [mode]).map((v) =>
    entry.load[v] ? v : (Object.keys(entry.load)[0] as Variant),
  );
  const shown = [...new Set(variants)];
  const both = shown.length > 1;

  return (
    <article className={`card layout-${entry.layout} ${large ? "large" : ""} ${both ? "wide" : ""} ${stagesOnly ? "stages-only" : ""}`} id={entry.id}>
      {stagesOnly ? (
        <div className="cardhead slim">
          <div className="spacer" />
          <button className="ghost" onClick={() => setRun((n) => n + 1)} title="Remount the component to replay its animations">
            ↻ Replay
          </button>
        </div>
      ) : (
      <div className="cardhead">
        <div className="titles">
          <h3>
            <a href={`#/${entry.id}`}>{entry.name}</a>
          </h3>
          <p>{entry.description}</p>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => setRun((n) => n + 1)} title="Remount the component to replay its animations">
            ↻ Replay
          </button>
          {!large && (
            <a className="ghost" href={`#/${entry.id}`}>
              Open
            </a>
          )}
        </div>
      </div>
      )}
      <div className={both ? "stages two" : "stages"}>
        {shown.map((v) => (
          <div key={v} className="stagewrap">
            <div className="stagelabel">
              <code>{entry.files[v]}</code>
              {!entry.load[mode === "both" ? v : mode] && mode !== "both" && <span className="note">only variant</span>}
            </div>
            <LazyStage key={`${entry.id}-${v}-${run}`} entry={entry} variant={v} eager={large} />
          </div>
        ))}
      </div>
    </article>
  );
}

/** Mounts the live component only while it is near the viewport, so 65 animated components don't all run at once. */
function LazyStage({ entry, variant, eager }: { entry: Entry; variant: Variant; eager: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(eager);
  const [mod, setMod] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eager) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "600px 0px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!near || mod) return;
    entry.load[variant]!().then(setMod, (e) => setError(String(e)));
  }, [near, mod, entry, variant]);

  const Demo = entry.Demo;
  const theme = useContext(ThemeContext);
  return (
    <div className={`stage stage-${entry.layout} ${eager ? "tall" : ""}`} data-tc-theme={theme} ref={ref}>
      {error ? (
        <Failure message={error} />
      ) : !Demo ? (
        <div className="placeholder">No demo written for this component yet.</div>
      ) : near && mod ? (
        <Boundary>
          {/* Lit elements take the stage's look from this provider; React components still load their look's twin */}
          <LookProvider look={variant}>
            <Demo ui={mod} />
          </LookProvider>
        </Boundary>
      ) : (
        <div className="placeholder">Loading…</div>
      )}
    </div>
  );
}

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? <Failure message={this.state.error.message} /> : this.props.children;
  }
}

function Failure({ message }: { message: string }) {
  return (
    <div className="failure">
      <strong>Failed to render</strong>
      <pre>{message}</pre>
    </div>
  );
}
