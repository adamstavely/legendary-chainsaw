import { useState, type CSSProperties } from "react";
import type * as UI from "../../../../src/elements/react";
import { caption, textButton } from "../../demo-kit";

const field: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  height: "var(--tc-control-h-md, 32px)",
  padding: "0 10px",
  border: "1px solid var(--tc-border-control, light-dark(#d4d4d8, #3f3f46))",
  borderRadius: "var(--tc-control-radius-md, 10px)",
  background: "var(--tc-surface-control, light-dark(#ffffff, #19191b))",
  color: "var(--tc-text-primary, light-dark(#171717, #ededed))",
  font: "inherit",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DissolveClear } = ui;
  const [query, setQuery] = useState("duplicate vendor tax IDs, Q3");
  return (
    <div style={{ display: "grid", gap: 10, width: 300, fontSize: 13, color: "var(--tc-text-primary)" }}>
      <DissolveClear>
        <input type="search" style={field} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search findings" aria-label="Search findings" />
      </DissolveClear>
      <p style={{ ...caption, margin: 0 }}>
        {query ? <>Searching for “{query}”. Press × or Escape.</> : "Nothing to search for. "}
        {!query && <button type="button" style={textButton} onClick={() => setQuery("duplicate vendor tax IDs, Q3")}>Type it again</button>}
      </p>
    </div>
  );
}
