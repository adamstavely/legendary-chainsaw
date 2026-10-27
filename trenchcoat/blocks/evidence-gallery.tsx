"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type Ref,
} from "react";
import { DataTable, ImageGrid, SegmentedControl, type DataRow, type ImageGridBadgeTone, type ImageGridTile, type Look } from "trenchcoat/react";
import { lookContext } from "trenchcoat/look-provider";

/*
 * Evidence Gallery – the images behind a set of claims, with whether each is attested and how many claims lean on
 * it, in one self-contained file:
 *   · a filter by attestation – All, Attested, Unverified, Failed – with a count on each
 *   · the library's Image Grid: the images, their alt text, Compare (a wipe between two) and Download
 *   · the library's Data Table, read only and in the same order: each item's kind, attestation, linked claims and
 *     source – sortable, so "most-cited" or "failed first" is a click
 * Built on the Trenchcoat elements through `trenchcoat/react` (SegmentedControl, ImageGrid, DataTable). The look
 * follows the nearest <LookProvider> – the same one the elements read – or the `look` prop. The styles are injected
 * below and use only the shared tokens.
 */

export type Attestation = "attested" | "unverified" | "failed";

export type EvidenceItem = {
  id: string;
  /** What it is, e.g. "Loading bay camera, 06:12" */
  title: string;
  /** e.g. "Photo", "Scan", "Map" */
  kind: string;
  /** The image (or a still of it) – a data: URL works too */
  src: string;
  /** What the image shows, for people who can't see it */
  alt: string;
  attestation: Attestation;
  /** How many claims cite it */
  claims: number;
  /** Where it came from, e.g. "Site camera 2" */
  source?: string;
};

export type EvidenceFilter = "all" | Attestation;

type OwnProps = {
  items: EvidenceItem[];
  /** Which items show (controlled) */
  filter?: EvidenceFilter;
  /** The filter at first when uncontrolled – "all" by default */
  defaultFilter?: EvidenceFilter;
  /** Called when another filter is picked */
  onFilterChange?: (filter: EvidenceFilter) => void;
  /** An alt text was edited in the grid: the item with its new alt text */
  onAltChange?: (item: EvidenceItem, alt: string) => void;
  /** Words for the attestation states – "Attested", "Unverified", "Failed" by default */
  attestationLabels?: Partial<Record<Attestation, string>>;
  /** The grid's heading – "Evidence" by default */
  title?: string;
  /** A line under the grid's heading, e.g. the case or report it belongs to */
  subtitle?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type EvidenceGalleryProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

const LABELS: Record<Attestation, string> = { attested: "Attested", unverified: "Unverified", failed: "Failed" };
const TONES = { attested: "green", unverified: "amber", failed: "pink" } as const;
/** The same states on the image tiles' badges */
const BADGE_TONES: Record<Attestation, ImageGridBadgeTone> = { attested: "success", unverified: "warning", failed: "danger" };
const ORDER: Attestation[] = ["attested", "unverified", "failed"];
const ACTIONS = ["compare", "download"] as const;

export function EvidenceGallery({
  items,
  filter: filterProp,
  defaultFilter = "all",
  onFilterChange,
  onAltChange,
  attestationLabels,
  title = "Evidence",
  subtitle,
  look: lookProp,
  className,
  ref,
  ...rest
}: EvidenceGalleryProps) {
  const [look, setLookNode] = useLook(lookProp);
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      setLookNode(el);
      setNode(el);
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = el;
    },
    [ref, setLookNode],
  );
  const [filter, setFilter] = useControllable(filterProp, defaultFilter, onFilterChange, "filter");
  const labels = useMemo(() => ({ ...LABELS, ...attestationLabels }), [attestationLabels]);
  const label = (a: Attestation) => labels[a];
  const shown = useMemo(() => items.filter((i) => filter === "all" || i.attestation === filter), [items, filter]);

  // Alt text edited in the grid is kept here until the items change, and reported
  const [alts, setAlts] = useState<Record<string, string>>({});
  useEffect(() => setAlts({}), [items]);
  // Each tile carries its attestation as a badge and its linked claims as a note
  const tiles: ImageGridTile[] = useMemo(
    () =>
      shown.map((i) => ({
        id: i.id,
        src: i.src,
        alt: alts[i.id] ?? i.alt,
        label: i.title,
        badge: labels[i.attestation],
        badgeTone: BADGE_TONES[i.attestation],
        meta: `${i.claims} ${i.claims === 1 ? "claim" : "claims"}`,
      })),
    [shown, alts, labels],
  );
  const onTiles = (next: ImageGridTile[]) => {
    for (const t of next) {
      const item = items.find((i) => i.id === t.id);
      if (item && t.alt !== (alts[t.id] ?? item.alt)) {
        setAlts((a) => ({ ...a, [t.id]: t.alt }));
        onAltChange?.(item, t.alt);
      }
    }
  };

  // The grid's columns follow the block's width
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);
  const columns = width && width < 440 ? 1 : 2;

  const rows: DataRow[] = useMemo(
    () => shown.map((i) => ({ id: i.id, title: `${i.title} · ${i.kind}`, attestation: labels[i.attestation], claims: i.claims, source: i.source ?? "" })),
    [shown, labels],
  );
  const tagTones = useMemo(() => Object.fromEntries(ORDER.map((a) => [labels[a], TONES[a]])), [labels]);

  const count = (f: EvidenceFilter) => (f === "all" ? items.length : items.filter((i) => i.attestation === f).length);
  const claims = shown.reduce((n, i) => n + i.claims, 0);
  const attested = shown.filter((i) => i.attestation === "attested").length;

  return (
    <div {...rest} ref={setRoot} data-look={look} className={["ui-evg", className].filter(Boolean).join(" ")}>
      <style href="ui-evidence-gallery" precedence="default">
        {css}
      </style>

      <div className="ui-evg__bar">
        <SegmentedControl<EvidenceFilter>
          look={look}
          aria-label="Show"
          value={filter}
          onChange={setFilter}
          options={(["all", ...ORDER] as EvidenceFilter[]).map((f) => ({ value: f, label: f === "all" ? "All" : label(f), badge: String(count(f)) }))}
        />
        <p className="ui-evg__summary" aria-live="polite">
          {shown.length} {shown.length === 1 ? "item" : "items"} · {attested} attested · {claims} linked {claims === 1 ? "claim" : "claims"}
        </p>
      </div>

      <div className="ui-evg__panes">
        <ImageGrid
          look={look}
          title={title}
          prompt={subtitle}
          tiles={tiles}
          onTilesChange={onTiles}
          actions={[...ACTIONS]}
          columns={columns}
          ratio={4 / 3}
          fill
        />
        <DataTable
          look={look}
          title="Attestation"
          editable={false}
          columns={COLUMNS}
          rows={rows}
          onRowsChange={() => {}}
          tagTones={tagTones}
        />
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: "title", label: "Item", type: "text" as const },
  { key: "attestation", label: "Attestation", type: "tag" as const, width: "128px" },
  { key: "claims", label: "Claims", type: "number" as const, width: "96px" },
  { key: "source", label: "Source", type: "text" as const, width: "30%" },
];

/* ---------- Hooks ---------- */

/**
 * The block's look: the `look` prop, else the nearest <LookProvider> (asked through the same context the elements
 * use, and followed when it changes), else the page's data-tc-look. Unset, the page's tokens apply as they are.
 */
function useLook(own: Look | undefined) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inherited, setInherited] = useState<Look | undefined>(undefined);
  useLayoutEffect(() => {
    if (own || !node) return;
    let stop: (() => void) | undefined;
    let answered = false;
    const request = Object.assign(new Event("context-request", { bubbles: true, composed: true }), {
      context: lookContext,
      contextTarget: node,
      subscribe: true,
      callback: (value: Look | undefined, unsubscribe?: () => void) => {
        answered = true;
        stop = unsubscribe;
        setInherited(value);
      },
    });
    node.dispatchEvent(request);
    if (!answered) {
      const page = node.parentElement?.closest("[data-look], [data-tc-look]");
      const value = page?.getAttribute("data-look") ?? page?.getAttribute("data-tc-look");
      setInherited(value === "clean" || value === "standard" ? value : undefined);
    }
    return () => stop?.();
  }, [own, node]);
  return [own ?? inherited, setNode] as const;
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  const warned = useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (controlled && !onChange && !warned.current && env !== "production") {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (Object.is(next, latest.current)) return;
      if (!controlled) setOwn(next);
      latest.current = next;
      report.current?.(next);
    },
    [controlled],
  );
  return [current, set] as const;
}

/* ---------- Styles ---------- */

const css = /* css */ `
.ui-evg {
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  display: grid;
  gap: var(--tc-space-4, 16px);
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-evg *, .ui-evg *::before, .ui-evg *::after { box-sizing: border-box; }
.ui-evg__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2, 8px) var(--tc-space-4, 16px); min-width: 0; }
.ui-evg__bar > tc-segmented-control { max-width: 100%; overflow-x: auto; }
.ui-evg__summary { margin: 0; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); font-variant-numeric: tabular-nums; }
/* The grid and its table side by side when there's room, the table under the grid when not */
.ui-evg__panes { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; gap: var(--tc-space-4, 16px); }
@container (max-width: 980px) { .ui-evg__panes { grid-template-columns: minmax(0, 1fr); } }
`;
