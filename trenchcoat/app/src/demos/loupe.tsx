import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { LoupeComponentMeta } from "../../../src/elements/react";
import { caption, surface } from "../demo-kit";

/* A small settings page with the Loupe beside it, looking only at that page: two of the page's own components marked
   with data-ds-component (a header and two stat cards, in a grid), and three of the library's (a switch, a checkbox and
   a button). Inspect it, point at a part for its card, switch on Layouts for the flex and grid containers. The hotkey
   is off here, so the gallery's own keys keep working. The links are made up. */

const META: Record<string, LoupeComponentMeta> = {
  PageHeader: { description: "The title row of every settings page.", docs: "https://design.example/components/page-header", source: "https://code.example/app/src/layout/PageHeader.tsx" },
  StatCard: { description: "One number with its label and change.", docs: "https://design.example/components/stat-card", design: "https://design.example/files/stat-card" },
  Switch: { docs: "https://design.example/components/switch", source: "https://code.example/trenchcoat/src/elements/switch.ts" },
  Checkbox: { docs: "https://design.example/components/checkbox" },
  Button: { docs: "https://design.example/components/button", source: "https://code.example/trenchcoat/src/elements/button.ts" },
};

const stat = (label: string, value: string, change: string) => (
  <div data-ds-component="StatCard" data-ds-path="src/components/StatCard.tsx" style={{ ...surface, padding: 14, display: "grid", gap: 4 }}>
    <span style={{ fontSize: 12, color: "var(--tc-text-muted)" }}>{label}</span>
    <strong style={{ fontSize: 20, color: "var(--tc-text-primary)" }}>{value}</strong>
    <span style={{ fontSize: 12, color: "var(--tc-status-success-fg)" }}>{change}</span>
  </div>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Loupe, Switch, Checkbox, Button } = ui;
  const [page, setPage] = useState<HTMLElement | null>(null);
  return (
    <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
      <div ref={setPage} style={{ ...surface, flex: "1 1 320px", padding: 16, display: "grid", gap: 14 }}>
        <div data-ds-component="PageHeader" data-ds-path="src/layout/PageHeader.tsx" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <strong style={{ fontSize: 16, color: "var(--tc-text-primary)" }}>Workspace settings</strong>
          <Button variant="primary">Save changes</Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {stat("Members", "42", "+3 this month")}
          {stat("Storage", "61 GB", "18% free")}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <Switch label="Share answers with the team" defaultValue />
          <Checkbox label="Email a weekly summary" />
        </div>
      </div>
      <Loupe floating={false} hotkey={false} root={page} components={META} style={{ flex: "0 1 340px" }} />
      <div style={{ ...caption, flexBasis: "100%", textAlign: "center" }}>Inspect the page, point at a part, or switch on Layouts.</div>
    </div>
  );
}
