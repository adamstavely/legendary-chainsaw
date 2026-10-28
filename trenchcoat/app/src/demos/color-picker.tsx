import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ColorPickerFormat } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The primary brand colour in a fictional design-system editor, Northwind Tokens: the theme's colours as swatches, the
   saved colour as the previous one. */

const SAVED = "#3a6df0";
const SWATCHES = [
  { value: "#3a6df0", name: "Primary" },
  { value: "#f97316", name: "Accent" },
  { value: "#0f9d76", name: "Success" },
  { value: "#e5484d", name: "Danger" },
  { value: "#f5b301", name: "Warning" },
  { value: "#1f2937", name: "Ink" },
  { value: "#f4f4f5", name: "Paper" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ColorPicker } = ui;
  const [value, setValue] = useState("#5b7ff2");
  const [format, setFormat] = useState<ColorPickerFormat>("hex");
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 8 }}>
      <ColorPicker
        title="Primary colour"
        description="Northwind Tokens · Brand theme"
        value={value}
        onValueChange={setValue}
        format={format}
        onFormatChange={setFormat}
        previous={SAVED}
        swatches={SWATCHES}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Drag the square or type a value; the left half of the chip puts {SAVED} back.{" "}
        <button type="button" style={textButton} onClick={() => setFormat("cmyk")}>
          Show CMYK
        </button>
      </div>
    </div>
  );
}
