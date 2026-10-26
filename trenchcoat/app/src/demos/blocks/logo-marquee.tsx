import type { ReactNode } from "react";
import type * as UI from "@blocks/logo-marquee";

// Fictional brands with simple geometric marks (fill="currentColor" so they follow the muted colour)
const mark = (children: ReactNode) => (
  <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
    {children}
  </svg>
);

const LOGOS: UI.MarqueeLogo[] = [
  { name: "Northwind", color: "#2f6bff", svg: mark(<path d="M4 26 16 4l12 22h-6l-6-11-6 11z" />) },
  { name: "Lumen", color: "#f59e0b", svg: mark(<><circle cx="16" cy="16" r="7" /><path d="M16 1v5M16 26v5M1 16h5M26 16h5" stroke="currentColor" strokeWidth="3" /></>) },
  { name: "Orbitly", color: "#8b5cf6", svg: mark(<><circle cx="16" cy="16" r="5" /><ellipse cx="16" cy="16" rx="14" ry="6" fill="none" stroke="currentColor" strokeWidth="2.5" /></>) },
  { name: "Fernway", color: "#10b981", svg: mark(<path d="M16 2c8 6 10 16 0 28C6 18 8 8 16 2z" />) },
  { name: "Quanta", color: "#ec4899", svg: mark(<><rect x="3" y="3" width="11" height="11" rx="2" /><rect x="18" y="3" width="11" height="11" rx="5.5" /><rect x="3" y="18" width="11" height="11" rx="5.5" /><rect x="18" y="18" width="11" height="11" rx="2" /></>) },
  { name: "Halcyon", color: "#0ea5e9", svg: mark(<path d="M2 20c4-8 10-8 14 0s10 8 14 0v6H2z" />) },
  { name: "Brightpath", svg: mark(<path d="M6 4h12a7 7 0 0 1 0 14h-6v10H6z" />) },
  { name: "Kestrel", color: "#ef4444", svg: mark(<path d="M2 8l14 6 14-6-6 18-8-8-8 8z" />) },
  { name: "Mosaic", color: "#14b8a6", svg: mark(<path d="M16 2 29 9.5v13L16 30 3 22.5v-13z" />) },
  { name: "Vantage", svg: mark(<path d="M3 5h7l6 14 6-14h7L19 28h-6z" />) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LogoMarquee } = ui;
  return (
    <div style={{ padding: "32px 0", display: "grid", gap: 40 }}>
      <div>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", marginBottom: 20 }}>Trusted by fast-moving teams</p>
        <LogoMarquee logos={LOGOS} labels="beside" label="Customers" />
      </div>
      <LogoMarquee logos={LOGOS} rows={2} speed={30} labels="below" label="More customers" />
    </div>
  );
}
