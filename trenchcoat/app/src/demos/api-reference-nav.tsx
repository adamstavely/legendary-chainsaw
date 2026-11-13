import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ApiNavGroup } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The side navigation of a fictional research institute's internal Records API reference. Clicks are routed by the
   demo (tc-navigate, prevented) instead of following the links. All the data is made up. */

const GROUPS: ApiNavGroup[] = [
  {
    id: "records",
    label: "Records",
    endpoints: [
      { id: "records-list", name: "List records", method: "GET", path: "/v1/records", href: "#records-list" },
      { id: "records-get", name: "Get a record", method: "GET", path: "/v1/records/{id}", href: "#records-get" },
      { id: "records-create", name: "Create a record", method: "POST", path: "/v1/records", href: "#records-create" },
      { id: "records-update", name: "Update a record", method: "PATCH", path: "/v1/records/{id}", href: "#records-update" },
      { id: "records-delete", name: "Delete a record", method: "DELETE", path: "/v1/records/{id}", href: "#records-delete" },
    ],
  },
  {
    id: "search",
    label: "Search",
    endpoints: [
      { id: "search-query", name: "Search records", method: "POST", path: "/v1/search", href: "#search-query" },
      { id: "search-suggest", name: "Suggest terms", method: "GET", path: "/v1/search/suggest", href: "#search-suggest" },
    ],
  },
  {
    id: "exports",
    label: "Exports",
    endpoints: [
      { id: "exports-start", name: "Start an export", method: "POST", path: "/v1/exports", href: "#exports-start" },
      { id: "exports-status", name: "Get export status", method: "GET", path: "/v1/exports/{id}", href: "#exports-status" },
      { id: "exports-csv", name: "Export as CSV", method: "GET", path: "/v1/records.csv", href: "#exports-csv", deprecated: true },
    ],
  },
  {
    id: "retention",
    label: "Retention",
    endpoints: [
      { id: "retention-policy", name: "Get retention policy", method: "GET", path: "/v1/retention", href: "#retention-policy" },
      { id: "retention-hold", name: "Place a legal hold", method: "PUT", path: "/v1/records/{id}/hold", href: "#retention-hold" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ApiReferenceNav } = ui;
  const [current, setCurrent] = useState("records-update");
  const [query, setQuery] = useState("");
  const endpoint = GROUPS.flatMap((g) => g.endpoints).find((e) => e.id === current);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 340 }}>
      <ApiReferenceNav
        title="Records API"
        description="v1 · Halden Institute"
        groups={GROUPS}
        current={current}
        query={query}
        onQueryChange={setQuery}
        onNavigate={(id, _href, e) => {
          e.preventDefault();
          setCurrent(id);
        }}
      />
      <p style={caption}>
        Showing {endpoint ? `${endpoint.method} ${endpoint.path}` : "nothing"}. Filter by name, path or method, or use the arrow keys.{" "}
        <button type="button" style={textButton} onClick={() => setQuery(query ? "" : "post")}>
          {query ? "Clear the filter" : "Filter to POST"}
        </button>
      </p>
    </div>
  );
}
