import { useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const Logo = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" />
    <path d="M8 16V8m4 8V11m4 5v-3" style={{ stroke: "var(--tc-surface-raised, light-dark(#ffffff, #19191b))" }} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { HeaderBrand } = ui;
  const [visits, setVisits] = useState(0);
  const bar = (dark: boolean) => ({
    display: "flex",
    alignItems: "center",
    height: 56,
    padding: "0 16px",
    borderRadius: 12,
    background: dark ? "light-dark(#16161a, #0d0d0f)" : "var(--tc-surface-raised, light-dark(#ffffff, #19191b))",
    border: "1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e))",
  });

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 14 }}>
      <div style={bar(false)}>
        <HeaderBrand
          name="Research Institute"
          href="#home"
          icon={<Logo />}
          onNavigate={(_href, e) => {
            e.preventDefault();
            setVisits((n) => n + 1);
          }}
        />
      </div>
      <div style={bar(true)}>
        <HeaderBrand name="Audit desk" href="#home" icon={<Logo />} inverse style={{ "--tc-hb-name-size": "20px", "--tc-hb-logo-size": "28px" } as CSSProperties} onNavigate={(_href, e) => e.preventDefault()} />
      </div>
      <div style={caption}>
        The brand was clicked {visits} {visits === 1 ? "time" : "times"} – the demo routes it instead of following the link.{" "}
        <button type="button" style={textButton} onClick={() => setVisits(0)}>
          Reset
        </button>
      </div>
    </div>
  );
}
