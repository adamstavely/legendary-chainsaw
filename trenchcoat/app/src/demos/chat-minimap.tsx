import { useId, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A long chat with an assistant during a fraud review: the rail beside it has a tick for each question the reviewer
   asked, and follows the chat as it scrolls. Point at a tick to read the question; click to go back to it. */

const ASKED = [
  "Summarise the open alerts on the Halden Logistics account.",
  "Which of those alerts involve payments over €10,000? List them with dates, counterparties and the rule that fired, and say which ones were already reviewed last quarter.",
  "Why was the March 14 transfer flagged?",
  "Compare the counterparty's registered address with the shipping addresses on the last 20 invoices.",
  "Show the timeline.",
  "Draft a note for the case file explaining why the March transfers look consistent with the seasonal pattern we saw in previous years, including the figures from the 2024 and 2025 reviews, the analyst who signed them off, and anything that would change that view if it turned up in the next statement.",
  "What's still missing?",
  "Who approved the vendor in 2023?",
  "Check the invoice numbering for gaps.",
  "List the gaps by month.",
  "Any duplicates?",
  "Write up the findings for the review board, in plain words, with the open questions at the end.",
];
const REPLY = "Here's what the records show. The figures come from the ledger export and the payment system, cross-checked against the vendor file; anything I couldn't confirm is marked as such.";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChatMinimap } = ui;
  const chat = useRef<HTMLDivElement>(null);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  // Each copy of the demo (the gallery can show both looks) points at its own chat's messages
  const prefix = `cmm${useId().replace(/:/g, "")}`;
  const items = ASKED.map((text, i) => ({ id: `ask-${i + 1}`, text, target: `${prefix}-ask-${i + 1}` }));
  const bubble = { padding: "8px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.45, maxWidth: "80%" } as const;
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div
          ref={(el) => {
            chat.current = el;
            setScroller(el);
          }}
          style={{ flex: 1, height: 340, overflowY: "auto", display: "grid", gap: 10, padding: 12, borderRadius: 12, background: "var(--tc-surface-sunken, light-dark(#f6f6f6, #161618))" }}
        >
          {ASKED.map((text, i) => (
            <div key={i} style={{ display: "grid", gap: 10 }}>
              <div id={`${prefix}-ask-${i + 1}`} style={{ ...bubble, justifySelf: "end", background: "var(--tc-surface-raised, light-dark(#fff, #232326))", color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}>
                {text}
              </div>
              <div style={{ ...bubble, color: "var(--tc-text-secondary, light-dark(#4b4b4b, #b4b4b8))" }}>{REPLY}</div>
            </div>
          ))}
        </div>
        <ChatMinimap label="Your questions" items={items} scrollRoot={scroller} current={current} onCurrentChange={setCurrent} style={{ alignSelf: "center" }} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        In view: question {current ? current.replace("ask-", "") : "–"} of {ASKED.length}.{" "}
        <button type="button" style={textButton} onClick={() => chat.current?.scrollTo({ top: chat.current.scrollHeight })}>
          Scroll to the end
        </button>
      </div>
    </div>
  );
}
