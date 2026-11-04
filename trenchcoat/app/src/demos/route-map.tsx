import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RouteItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The routes of a research institute's grant portal on staging. A fixed clock keeps "last visited" steady. */

const NOW = Date.UTC(2026, 9, 12, 9, 30);
const min = 60_000;
const ROUTES: RouteItem[] = [
  { id: "home", path: "/", name: "Home", status: "ok", loadMs: 420, lastVisited: NOW - 3 * min },
  {
    id: "grants",
    path: "/grants",
    name: "Grants",
    status: "ok",
    loadMs: 610,
    lastVisited: NOW - 1 * min,
    children: [
      {
        id: "grant",
        path: "/grants/:id",
        name: "Grant details",
        status: "slow",
        loadMs: 2380,
        lastVisited: NOW - 6 * min,
        children: [{ id: "apply", path: "/grants/:id/apply", name: "Application form", status: "error", loadMs: 940, lastVisited: NOW - 12 * min }],
      },
    ],
  },
  { id: "reviewers", path: "/reviewers", name: "Reviewers", status: "ok", loadMs: 530, lastVisited: NOW - 2 * 60 * min },
  { id: "admin", path: "/admin", name: "Admin", status: "unvisited", children: [{ id: "reports", path: "/admin/reports", name: "Reports", status: "unvisited" }] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RouteMap } = ui;
  const [routes, setRoutes] = useState(ROUTES);
  const [said, setSaid] = useState("Open a route, or filter by status.");
  const fix = (rs: RouteItem[]): RouteItem[] => rs.map((r) => ({ ...r, status: r.id === "apply" ? "ok" : r.status, children: r.children && fix(r.children) }));
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <RouteMap description="staging.halden.example" routes={routes} now={NOW} defaultSelected="grant" onTcOpen={(e) => setSaid(`Open ${e.detail.route.path} in the preview`)} />
      <div style={{ ...caption, textAlign: "center" }}>
        {said}{" "}
        <button type="button" style={textButton} onClick={() => setRoutes((rs) => (rs === ROUTES ? fix(rs) : ROUTES))}>
          {routes === ROUTES ? "Fix the application form" : "Reset"}
        </button>
      </div>
    </div>
  );
}
