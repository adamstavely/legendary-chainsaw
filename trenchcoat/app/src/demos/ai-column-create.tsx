import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AiColumnPreviewRow, AiColumnValue } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute adding an AI column to its vendor list: the industry of each vendor, from its name
   and website. "Try on 3 rows" answers after a moment with three made-up results; Create column says what it would
   have run. */

const COLUMNS = [
  { id: "vendor", label: "Vendor" },
  { id: "website", label: "Website" },
  { id: "country", label: "Country" },
];
const MODELS = [
  { id: "fast", label: "Fast model", description: "quick, for short answers" },
  { id: "careful", label: "Careful model", description: "slower, reads more" },
];
const START: AiColumnValue = {
  name: "Industry",
  type: "choice",
  options: ["Software", "Logistics", "Printing", "Consulting", "Other"],
  prompt: "What industry is {{vendor}} ({{website}}) in? Pick the closest choice.",
  model: "fast",
  web: true,
};
const ANSWERS: AiColumnPreviewRow[] = [
  { id: "v1", label: "Northwind Labs", value: "Software" },
  { id: "v2", label: "Cedarfield Logistics", value: "Logistics" },
  { id: "v3", label: "Harborstone Print", value: "Printing" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AiColumnCreate } = ui;
  const [value, setValue] = useState<AiColumnValue>(START);
  const [preview, setPreview] = useState<AiColumnPreviewRow[] | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [said, setSaid] = useState("Insert a column into the prompt, then try it on three rows.");

  useEffect(() => {
    if (!previewing) return;
    const t = setTimeout(() => {
      setPreview(ANSWERS);
      setPreviewing(false);
    }, 900);
    return () => clearTimeout(t);
  }, [previewing]);

  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <AiColumnCreate
        description="Vendor list · 2,000 rows"
        columns={COLUMNS}
        models={MODELS}
        value={value}
        onValueChange={setValue}
        preview={preview}
        previewing={previewing}
        estimate={`2,000 rows · about 3 min · about ${value.model === "careful" ? "$6.20" : "$1.40"}`}
        onPreview={() => {
          setPreview(ANSWERS.map((r) => ({ id: r.id, label: r.label, state: "running" })));
          setPreviewing(true);
        }}
        onCreate={(column) => setSaid(`Would create "${column.name}" (${column.type}) on 2,000 rows with the ${column.model} model.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setValue(START);
            setPreview(null);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
