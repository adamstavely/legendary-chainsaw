import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PartialResultItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A made-up review team asked an agent to summarise 40 case files; 34 finished and 6 didn't. */

const UNFINISHED: PartialResultItem[] = [
  { id: "c07", label: "Case 2041 – bank statements.pdf", status: "failed", reason: "Couldn't open the file", detail: "The PDF is password protected" },
  { id: "c12", label: "Case 2046 – invoices.zip", status: "failed", reason: "Couldn't open the file", detail: "The archive is damaged" },
  { id: "c19", label: "Case 2053 – ledger scan.tiff", status: "failed", reason: "Couldn't open the file", detail: "The scan is 48 MB; the limit is 25 MB" },
  { id: "c23", label: "Case 2057 – emails.mbox", status: "failed", reason: "Couldn't open the file", detail: "Unsupported format" },
  { id: "c31", label: "Case 2065 – interview notes.docx", status: "failed", reason: "Timed out", detail: "No answer after 120 s" },
  { id: "c38", label: "Case 2072 – payroll.xlsx", status: "skipped", reason: "Already summarised last week" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PartialResults } = ui;
  const [items, setItems] = useState(UNFINISHED);
  const [done, setDone] = useState(34);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 12 }}>
      <PartialResults variant="notice" total={40} done={done} items={items} onTcRetry={(e) => e.preventDefault()} />
      <PartialResults
        description="Case file summaries, batch of 40"
        total={40}
        done={done}
        items={items}
        onTcExport={(e) => e.preventDefault()}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        <button
          type="button"
          style={textButton}
          onClick={() => {
            const timedOut = items.find((i) => i.reason === "Timed out");
            if (timedOut) {
              setItems(items.filter((i) => i !== timedOut));
              setDone(done + 1);
            } else {
              setItems(UNFINISHED);
              setDone(34);
            }
          }}
        >
          {items.some((i) => i.reason === "Timed out") ? "Finish the timed-out one" : "Start again"}
        </button>
      </div>
    </div>
  );
}
