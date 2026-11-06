// Foundations → Spot illustrations: every self-contained SVG in illustrations/spot, by folder, with a search. Each is
// inlined as it ships, so the page also shows that a file follows the page's theme with nothing else loaded.
import { useMemo, useState } from "react";

const files = import.meta.glob<string>("../../../illustrations/spot/*/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

const FOLDERS: [string, string][] = [
  ["foundations", "Foundations and components"],
  ["guidelines", "Accessibility and content guidelines"],
  ["patterns", "Interaction patterns"],
  ["principles", "Design principles"],
  ["laws", "Laws of UX"],
  ["research", "Research and human-centred design"],
  ["ai", "AI and agents"],
  ["tools", "Tools and generators"],
  ["admin", "Admin and governance"],
  ["site", "Site and guides"],
  ["references", "References"],
];

type Spot = { folder: string; slug: string; name: string; svg: string };

const SPOTS: Spot[] = Object.entries(files)
  .map(([path, svg]) => {
    const [folder, file] = path.split("/").slice(-2);
    return {
      folder,
      slug: file.replace(/\.svg$/, ""),
      name: /<title>([^<]*)<\/title>/.exec(svg)?.[1] ?? file,
      svg,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export function SpotIllustrations() {
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? SPOTS.filter((s) =>
          `${s.name} ${s.folder}/${s.slug}`.toLowerCase().includes(q),
        )
      : SPOTS;
  }, [query]);
  return (
    <div className="docs-spots">
      <div className="docs-spots-bar">
        <input
          className="docs-spots-search"
          type="search"
          aria-label="Search the illustrations"
          placeholder={`Search ${SPOTS.length} illustrations`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={dark}
            onChange={(e) => setDark(e.target.checked)}
          />{" "}
          Show on dark
        </label>
      </div>
      <p className="muted" aria-live="polite">
        {shown.length === SPOTS.length
          ? `${SPOTS.length} illustrations`
          : `${shown.length} of ${SPOTS.length}`}
      </p>
      {FOLDERS.map(([folder, title]) => {
        const list = shown.filter((s) => s.folder === folder);
        if (!list.length) return null;
        return (
          <section key={folder}>
            <h2>
              {title} <span className="muted">{list.length}</span>
            </h2>
            <ul
              className="docs-spots-grid"
              data-tc-theme={dark ? "dark" : "light"}
            >
              {list.map((s) => (
                <li key={s.slug}>
                  <div
                    className="docs-spots-art"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: s.svg }}
                  />
                  <span className="docs-spots-name">{s.name}</span>
                  <code>
                    {folder}/{s.slug}.svg
                  </code>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
