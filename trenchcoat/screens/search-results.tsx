"use client";

/*
 * Search Results – a full search page: the search box, filters down the side and results grouped by kind, with the
 * Nothing Found illustration when nothing matches. It filters sample data in the browser; replace it with your own
 * search.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; AI Search, Facet Sidebar, Results List and Nothing Found
 * from `trenchcoat/react`.
 */

import { useMemo, useState, type ComponentPropsWithoutRef, type CSSProperties, type Ref } from "react";
import { AiSearch, FacetSidebar, NothingFound, ResultsList, type Facet, type FacetValues, type SearchResult } from "trenchcoat/react";
import { AppShell, type AppShellProps } from "@/components/ui/app-shell";

const RESULTS: SearchResult[] = [
  { id: "1", title: "Trial 12 results", kind: "Document", source: "Research / Trials", date: Date.UTC(2026, 9, 12), snippet: "The 12-week follow-up results support the primary endpoint at all sites.", meta: ["PDF", "38 pages"] },
  { id: "2", title: "Trial 12 sampling plan", kind: "Document", source: "Research / Trials", date: Date.UTC(2026, 5, 3), snippet: "How samples are drawn across each site, and the reading schedule." },
  { id: "3", title: "Noor Haddad", kind: "Person", source: "Directory", snippet: "Principal investigator on Trial 12 and Trial 9." },
  { id: "4", title: "Re: Trial 12 enrolment", kind: "Email", source: "Noor's mailbox", date: Date.UTC(2026, 8, 21), snippet: "Two sites are under target for enrolment; can we extend the window?" },
  { id: "5", title: "Vendor contract 2041", kind: "Document", source: "Legal", date: Date.UTC(2026, 2, 9), snippet: "Supply agreement for lab consumables, including the trial sites." },
];
const FACETS: Facet[] = [
  {
    id: "kind",
    label: "Type",
    type: "checkbox",
    options: [
      { value: "Document", label: "Documents" },
      { value: "Person", label: "People" },
      { value: "Email", label: "Email" },
    ],
  },
];

type SearchResultsOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** What's searched for at first */
  defaultQuery?: string;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type SearchResultsScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof SearchResultsOwnProps | "children"> & SearchResultsOwnProps & { ref?: Ref<HTMLDivElement> };

const layout: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(0, 3fr)", gap: "var(--tc-space-4, 16px)", alignItems: "start", marginTop: "var(--tc-space-4, 16px)" };

export function SearchResultsScreen({ defaultQuery = "trial", onNavigate, workspace, user, ref, ...rest }: SearchResultsScreenProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [filters, setFilters] = useState<FacetValues>({});
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const kinds = (filters.kind as string[] | undefined) ?? [];
    return RESULTS.filter((r) => (!q || `${r.title} ${r.snippet ?? ""} ${r.source ?? ""}`.toLowerCase().includes(q)) && (!kinds.length || kinds.includes(r.kind ?? "")));
  }, [query, filters]);
  return (
    <AppShell {...rest} ref={ref} active="Search" onNavigate={onNavigate} workspace={workspace} user={user}>
      <div className="ui-as-page">
        <h1 className="ui-as-page-title">Search</h1>
        <AiSearch value={query} onQueryChange={setQuery} />
        <div style={layout}>
          <FacetSidebar facets={FACETS} value={filters} onValueChange={(next) => setFilters(next)} />
          {results.length ? (
            <ResultsList query={query} results={results} total={`${results.length} results`} />
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ maxWidth: 280, margin: "0 auto" }}>
                <NothingFound />
              </div>
              <p style={{ margin: 0, color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))" }}>No results. Try different words, or clear the filters.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
