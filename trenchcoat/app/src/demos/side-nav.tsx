import { useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SideNavItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The main navigation of a fictional research institute's portfolio app. Clicks are routed by the demo (tc-navigate,
   prevented) instead of following the links; a footer card of the page's own sits at the bottom. All the data is
   made up. */

/** Lucide (ISC, lucide.dev) paths */
const PATHS: Record<string, string[]> = {
  home: ["M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  portfolio: ["M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", "M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"],
  flask: ["M10 2v7.31", "M14 9.3V1.99", "M8.5 2h7", "M14 9.3a6.5 6.5 0 1 1-4 0", "M5.52 16h12.96"],
  review: ["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
  report: ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4", "M10 9H8", "M16 13H8", "M16 17H8"],
  people: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  billing: ["M2 7h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z", "M2 11h20"],
  logo: ["M12 2 3 7v10l9 5 9-5V7Z", "M12 22V12", "M3 7l9 5 9-5"],
};

function lucide(paths: string[]) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.75");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  for (const d of paths) {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    svg.append(p);
  }
  return svg;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SideNav, Button } = ui;
  const [current, setCurrent] = useState("portfolio");
  const [collapsed, setCollapsed] = useState(false);
  const logo = useMemo(() => lucide(PATHS.logo), []);
  const items = useMemo<SideNavItem[]>(
    () => [
      { id: "home", label: "Overview", href: "#home", icon: lucide(PATHS.home) },
      { id: "portfolio", label: "Portfolio", href: "#portfolio", icon: lucide(PATHS.portfolio), badge: 12 },
      { id: "studies", label: "Studies", href: "#studies", icon: lucide(PATHS.flask) },
      { id: "reviews", label: "Reviews", href: "#reviews", icon: lucide(PATHS.review), badge: "New" },
      { id: "reports", label: "Reports", href: "#reports", icon: lucide(PATHS.report) },
      { id: "team", label: "Team", href: "#team", icon: lucide(PATHS.people), section: "Institute" },
      { id: "billing", label: "Grants & billing", href: "#billing", icon: lucide(PATHS.billing), section: "Institute", disabled: true },
    ],
    [],
  );
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 640 }}>
      <div style={{ display: "flex", height: 520, borderRadius: 12, overflow: "hidden", border: "1px solid var(--tc-border-subtle)" }}>
        <SideNav
          brand="Halden Institute"
          brandIcon={logo}
          brandHref="#home"
          items={items}
          current={current}
          collapsible
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onNavigate={(id, _href, e) => {
            e.preventDefault();
            setCurrent(id);
          }}
        >
          <div style={{ display: "grid", gap: 8, padding: 12, borderRadius: 10, background: "var(--tc-surface-raised)", boxShadow: "var(--tc-card-shadow)", fontSize: 13, color: "var(--tc-text-secondary)" }}>
            <strong style={{ color: "var(--tc-text-primary)", fontWeight: 600 }}>Portfolio review in 6 days</strong>
            <span>Three studies still need a status note.</span>
            <Button size="sm">Prep brief</Button>
          </div>
        </SideNav>
        <div style={{ flex: 1, padding: 24, background: "var(--tc-surface-raised)", color: "var(--tc-text-secondary)", fontSize: 14 }}>
          {items.find((i) => i.id === current)?.label}
        </div>
      </div>
      <p style={caption}>
        Fold the bar into a rail with the button by the name.{" "}
        <button type="button" style={textButton} onClick={() => setCurrent("home")}>
          Back to Overview
        </button>
      </p>
    </div>
  );
}
