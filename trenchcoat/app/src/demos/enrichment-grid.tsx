import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EnrichmentCell, EnrichmentColumn, EnrichmentRow, EnrichmentSelection } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute enriching its vendor list: 2,000 vendors, and three AI columns a model fills in –
   the industry, whether the vendor holds a security certification, and its headquarters city. The run starts paused
   part of the way through; Resume fills a few rows at a time, and a handful of cells fail or ask for review. */

const COLUMNS: EnrichmentColumn[] = [
  { id: "vendor", label: "Vendor" },
  { id: "website", label: "Website" },
  { id: "country", label: "Country" },
  { id: "industry", label: "Industry", ai: true, prompt: "What industry is {{vendor}} ({{website}}) in? Answer with one or two words." },
  { id: "cert", label: "Has a security certification?", ai: true, prompt: "Does {{vendor}} hold an ISO 27001 or SOC 2 certification? Answer yes or no, with the page that says so." },
  { id: "hq", label: "Headquarters city", ai: true, prompt: "In which city is {{vendor}} headquartered? Use the website's contact or about page." },
];

/* Deterministic noise, so the thumbnail is stable */
const noise = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const A = ["North", "Lumen", "Cedar", "Harbor", "Kestrel", "Atlas", "Quarry", "Willow", "Granite", "Beacon", "Meridian", "Tidal"];
const B = ["wind", "field", "stone", "bridge", "works", "point", "line", "gate", "path", "vale"];
const C = ["Labs", "Systems", "Supply", "Analytics", "Logistics", "Partners", "Software", "Print"];
const COUNTRIES = ["Germany", "Canada", "Portugal", "Japan", "Ireland", "Chile", "Kenya", "Norway"];
const INDUSTRIES = ["Software", "Logistics", "Printing", "Consulting", "Hardware", "Facilities", "Data services"];
const CITIES = ["Hamburg", "Toronto", "Porto", "Osaka", "Cork", "Santiago", "Nairobi", "Bergen"];

const TOTAL = 2000;
const START = 412;

function fill(i: number, col: string): EnrichmentCell {
  const n = noise(i * 7 + col.length);
  if (col === "industry") return { state: "done", value: INDUSTRIES[Math.floor(n * INDUSTRIES.length)], confidence: 0.7 + n * 0.3 };
  if (col === "cert") {
    if (n < 0.04) return { state: "failed", note: "The website didn't load" };
    return n < 0.55
      ? { state: "done", value: "Yes", confidence: 0.82 + n * 0.15, source: "https://example.org/trust" }
      : n < 0.62
        ? { state: "review", value: "Unclear", confidence: 0.41, note: "Two pages disagree" }
        : { state: "done", value: "No", confidence: 0.75 + n * 0.2 };
  }
  return { state: "done", value: CITIES[i % CITIES.length], confidence: 0.6 + n * 0.4, source: "https://example.org/about" };
}

function makeRows(filled: number): EnrichmentRow[] {
  return Array.from({ length: TOTAL }, (_, i) => {
    const name = `${A[i % A.length]}${B[Math.floor(i / A.length) % B.length]} ${C[Math.floor(noise(i) * C.length)]}`;
    const cells: EnrichmentRow["cells"] = {
      vendor: name,
      website: `${name.split(" ")[0].toLowerCase()}.example`,
      country: COUNTRIES[Math.floor(noise(i + 3) * COUNTRIES.length)],
    };
    for (const c of ["industry", "cert", "hq"]) {
      if (i < filled) cells[c] = fill(i, c);
      else if (i < filled + 3) cells[c] = { state: "running" };
    }
    return { id: `v${i + 1}`, cells };
  });
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EnrichmentGrid } = ui;
  const [filled, setFilled] = useState(START);
  const [running, setRunning] = useState(false);
  const [retried, setRetried] = useState(new Set<string>());
  const [picked, setPicked] = useState<EnrichmentSelection | null>(null);
  const [said, setSaid] = useState("Press Resume to watch it fill, or pick a cell.");
  const rows = useMemo(() => {
    const base = makeRows(filled);
    if (!retried.size) return base;
    return base.map((r) => {
      const cert = r.cells.cert;
      return retried.has(r.id) && cert && typeof cert === "object" && cert.state === "failed" ? { ...r, cells: { ...r.cells, cert: { state: "queued" as const } } } : r;
    });
  }, [filled, retried]);

  useEffect(() => {
    if (!running || filled >= TOTAL) return;
    const t = setTimeout(() => setFilled((f) => Math.min(TOTAL, f + 6)), 250);
    return () => clearTimeout(t);
  }, [running, filled]);

  return (
    <div style={{ width: "100%", maxWidth: 860, display: "grid", gap: 8 }}>
      <EnrichmentGrid
        title="Vendor list"
        description="2,000 vendors · 3 AI columns"
        locale="en-GB"
        columns={COLUMNS}
        rows={rows}
        running={running}
        remaining={Math.round(((TOTAL - filled) / 6) * 250)}
        selected={picked}
        onRunChange={setRunning}
        onCellSelect={(selected, cell) => {
          setPicked(selected);
          setSaid(`Picked ${selected.column} for ${selected.row}${cell && typeof cell === "object" && cell.value ? ` – ${cell.value}` : ""}.`);
        }}
        onRetry={(cells) => setRetried((s) => new Set([...s, ...cells.map((c) => c.row)]))}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setRunning(false);
            setRetried(new Set());
            setFilled(START);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
