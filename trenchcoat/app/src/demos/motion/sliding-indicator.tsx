import { useState } from "react";
import type * as UI from "../../../../src/elements/react";

const TABS = ["Overview", "Evidence", "History"];

const tab: React.CSSProperties = {
  height: "var(--tc-control-h-sm, 28px)",
  padding: "0 var(--tc-control-px-md, 12px)",
  border: 0,
  borderRadius: "var(--tc-control-radius-sm, 8px)",
  background: "none",
  font: "inherit",
  fontSize: "var(--tc-control-font-size, 13px)",
  fontWeight: "var(--tc-control-font-weight, 500)" as React.CSSProperties["fontWeight"],
  cursor: "pointer",
};

function Tabs({ ui, variant, label }: { ui: typeof UI; variant: "underline" | "pill"; label: string }) {
  const { SlidingIndicator } = ui;
  const [at, setAt] = useState(0);
  const move = (e: React.KeyboardEvent, i: number) => {
    const to = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i - 1 + TABS.length) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setAt(to);
    (e.currentTarget.parentElement?.children[to] as HTMLElement | undefined)?.focus();
  };
  return (
    <SlidingIndicator variant={variant} hoverPreview>
      <div
        role="tablist"
        aria-label={label}
        style={{
          display: "flex",
          gap: 2,
          padding: variant === "pill" ? 3 : "0 0 2px",
          borderRadius: variant === "pill" ? "var(--tc-seg-track-radius, 10px)" : 0,
          background: variant === "pill" ? "var(--tc-seg-track-bg, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))" : "none",
          boxShadow: variant === "underline" ? "inset 0 -1px 0 var(--tc-border-default, light-dark(#ececec, #2a2a2e))" : "none",
        }}
      >
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={i === at}
            tabIndex={i === at ? 0 : -1}
            onClick={() => setAt(i)}
            onKeyDown={(e) => move(e, i)}
            style={{ ...tab, color: i === at ? "var(--tc-text-primary, light-dark(#171717, #ededed))" : "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}
          >
            {t}
          </button>
        ))}
      </div>
    </SlidingIndicator>
  );
}

export default function Demo({ ui }: { ui: typeof UI }) {
  return (
    <div style={{ display: "grid", gap: 24, justifyItems: "start" }}>
      <Tabs ui={ui} variant="underline" label="Finding F-214" />
      <Tabs ui={ui} variant="pill" label="Finding F-215" />
    </div>
  );
}
