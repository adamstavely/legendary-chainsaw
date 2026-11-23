import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";
import { useState } from "react";

/* A fictional fraud-review workspace: the assistant panel's notice, and marks beside an AI-written case summary, an
   analyst's own note written with help, and a draft the analyst edited. */

const MADE = new Date(2026, 10, 12, 9, 15).getTime();
const LIMITS = ["Good at pulling dates, amounts and names out of statements.", "Can miss handwritten notes and stamps on scans.", "Doesn't know about calls that weren't logged."];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AiDisclosure } = ui;
  const [shown, setShown] = useState(true);
  const row = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, fontSize: 14, color: "var(--tc-text-primary)" };
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 16 }}>
      {shown ? (
        <AiDisclosure variant="notice" contactHref="#contact" learnHref="#how-it-works" onDismiss={() => setShown(false)} />
      ) : null}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={row}>
          <strong>Case summary</strong>
          <AiDisclosure model="Review assistant" madeAt={MADE} limits={LIMITS} reportable />
        </div>
        <div style={row}>
          <strong>Analyst note</strong>
          <AiDisclosure kind="assisted" model="Review assistant" reviewedBy="Priya Shah" />
        </div>
        <div style={row}>
          <strong>Letter to the account holder</strong>
          <AiDisclosure kind="edited" model="Review assistant" madeAt={MADE} reviewedBy="Priya Shah" reportHref="#report" />
        </div>
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Press a mark to see what made it and what it can miss.{" "}
        {shown ? null : (
          <button type="button" style={textButton} onClick={() => setShown(true)}>
            Show the notice again
          </button>
        )}
      </div>
    </div>
  );
}
