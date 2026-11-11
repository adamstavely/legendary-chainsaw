import { useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SignaturePoint, SignatureValue } from "../../../src/elements/react";
import type { TcSignaturePad } from "../../../src/elements/signature-pad";
import { caption, textButton } from "../demo-kit";

/* A research institute's data-access agreement: the signer accepts how restricted survey data will be handled. One
   pad holds a stored, drawn signature; one is empty and required, with “Type instead” shown; one was typed; one is
   read-only on the countersigned copy. */

const STATEMENT = "By signing, you agree to handle the restricted survey data as set out in section 4 of this agreement.";
const DATE = Date.UTC(2026, 10, 10, 12);

/** A cursive-like scribble, drawn from a formula so the thumbnail is stable */
function scribble(x0: number, x1: number, loops: number, phase = 0): SignaturePoint[] {
  const n = 90;
  return Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const a = u * Math.PI * 2 * loops + phase;
    const x = x0 + (x1 - x0) * u + 0.025 * Math.sin(a);
    const y = 0.56 - 0.14 * Math.abs(Math.sin(a / 2)) * (1 - 0.4 * u) + 0.04 * Math.cos(a);
    return [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4, i * 12, 0.5];
  });
}
const STORED: SignatureValue = {
  kind: "drawn",
  strokes: [
    { points: scribble(0.1, 0.34, 3) },
    { points: scribble(0.4, 0.82, 5, 1) },
    { points: [[0.12, 0.7, 0, 0.5], [0.45, 0.66, 80, 0.5], [0.86, 0.68, 160, 0.5]] },
  ],
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SignaturePad } = ui;
  const [value, setValue] = useState<SignatureValue | null>(STORED);
  const [svgSize, setSvgSize] = useState("");
  const pad = useRef<TcSignaturePad>(null);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 12 }}>
      <SignaturePad
        ref={pad}
        title="Data-access agreement"
        description="Restricted survey data · Northfield Social Research Institute"
        signer="Noor Haddad, Research fellow"
        date={DATE}
        statement={STATEMENT}
        value={value}
        onValueChange={setValue}
        allowTyped
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {value ? (value.kind === "drawn" ? `Drawn, ${value.strokes.length} strokes. ` : `Typed: ${value.text}. `) : "Not signed. Draw on the pad. "}
        <button type="button" style={textButton} onClick={() => setValue(STORED)}>
          Restore the stored signature
        </button>
        {" · "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            const svg = pad.current?.toSVG();
            setSvgSize(svg ? `Exported ${Math.round(svg.length / 100) / 10} kB of SVG.` : "Nothing to export.");
          }}
        >
          Export SVG
        </button>
        {svgSize ? ` ${svgSize}` : ""}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
        <SignaturePad look="clean" title="Witness" signer="Witness" date={DATE} required invalid allowTyped />
        <SignaturePad look="clean" title="Supervisor" signer="Tomás Ferreira" date={DATE} defaultValue={{ kind: "typed", text: "Tomás Ferreira" }} allowTyped />
        <SignaturePad look="clean" title="Data steward" signer="Ines Okafor" date={DATE} defaultValue={STORED} readonly />
      </div>
    </div>
  );
}
