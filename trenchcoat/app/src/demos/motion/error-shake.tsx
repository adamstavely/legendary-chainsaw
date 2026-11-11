import { useState, type CSSProperties } from "react";
import type * as UI from "../../../../src/elements/react";
import { button, caption, textButton } from "../../demo-kit";

const field: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  height: "var(--tc-control-h-md, 32px)",
  marginTop: 4,
  padding: "0 10px",
  border: "1px solid var(--tc-border-control, light-dark(#d4d4d8, #3f3f46))",
  borderRadius: "var(--tc-control-radius-md, 10px)",
  background: "var(--tc-surface-control, light-dark(#ffffff, #19191b))",
  color: "var(--tc-text-primary, light-dark(#171717, #ededed))",
  font: "inherit",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ErrorShake } = ui;
  const [value, setValue] = useState("FR 2041");
  const [invalid, setInvalid] = useState(false);
  const [tries, setTries] = useState(0);
  const check = () => {
    const bad = !/^FR-\d{4}$/.test(value.trim());
    setInvalid(bad);
    if (bad) setTries(tries + 1);
  };
  return (
    <form
      style={{ display: "grid", gap: 12, width: 280, fontSize: 13, color: "var(--tc-text-primary)" }}
      onSubmit={(e) => {
        e.preventDefault();
        check();
      }}
    >
      <ErrorShake invalid={invalid} shakeKey={tries} message="Enter a case number like FR-2041">
        <label style={{ display: "block" }}>
          Case number
          <input style={field} value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
      </ErrorShake>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button type="submit" style={button}>Open case</button>
        <button type="button" style={textButton} onClick={() => { setValue("FR 2041"); setInvalid(false); }}>Reset</button>
      </div>
      <p style={{ ...caption, margin: 0 }}>Submit as it is to see it shake; submit again to shake again.</p>
    </form>
  );
}
