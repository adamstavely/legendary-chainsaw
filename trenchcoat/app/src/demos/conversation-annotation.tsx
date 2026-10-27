import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AnnotationMessage, ConversationAnnotationValue } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A support conversation being reviewed for the refunds eval set. The assistant got the return window wrong, so one
   span is labelled Incorrect, the rest of the promise Unsupported, the customer's email is redacted and the answer has a
   correction. Select more text (or focus a turn and press Shift + →), press 1–4 or R; Send to dataset reports what went. */

const at = (text: string, part: string) => [text.indexOf(part), text.indexOf(part) + part.length] as const;

const MESSAGES: AnnotationMessage[] = [
  { id: "m1", role: "user", author: "Jordan", text: "Hi – I bought the Trailhead 40L backpack three weeks ago and one strap is already fraying. Can I send it back? My order email is jordan.reyes@fastmail.com." },
  { id: "m2", role: "assistant", text: "Sorry about the strap! You can return any item within 60 days of purchase for a full refund, and we'll cover the return shipping. I've sent a prepaid label to your email." },
  { id: "m3", role: "user", author: "Jordan", text: "Great. Do I need the original box?" },
  { id: "m4", role: "assistant", text: "No box needed – any sturdy packaging works. Drop it at any carrier location within 14 days of getting the label and the refund goes back to your card once it's checked in." },
];

const [e0, e1] = at(MESSAGES[0].text, "jordan.reyes@fastmail.com");
const [w0, w1] = at(MESSAGES[1].text, "60 days");
const [s0, s1] = at(MESSAGES[1].text, "we'll cover the return shipping");

const START: ConversationAnnotationValue = {
  spans: [
    { id: "a1", messageId: "m1", start: e0, end: e1, quote: MESSAGES[0].text.slice(e0, e1), label: "", redacted: true },
    { id: "a2", messageId: "m2", start: w0, end: w1, quote: MESSAGES[1].text.slice(w0, w1), label: "incorrect" },
    { id: "a3", messageId: "m2", start: s0, end: s1, quote: MESSAGES[1].text.slice(s0, s1), label: "unsupported" },
  ],
  ratings: { m2: 1 },
  corrections: {
    m2: "Sorry about the strap! A fraying strap is covered by our one-year warranty, so you can send it back for a repair or replacement. I've sent a prepaid label to your email.",
  },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ConversationAnnotation } = ui;
  const [value, setValue] = useState(START);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("Select text and press 1–4 to label it, or R to redact. Rate the answers, then send the example on.");
  return (
    <div style={{ width: "100%", maxWidth: 960, display: "grid", gap: 8 }}>
      <ConversationAnnotation
        title="Conversation review"
        description="Ticket 48213 · Returns · for the refunds eval set"
        messages={MESSAGES}
        value={value}
        sent={sent}
        onChange={(next) => {
          setValue(next);
          setSent(false);
        }}
        onSend={(example) => {
          const redacted = example.spans.filter((s) => s.redacted).length;
          const n = (k: number, one: string) => `${k} ${k === 1 ? one : `${one}s`}`;
          setSent(true);
          setNote(
            `Sent ${n(example.messages.length, "turn")}, ${n(example.spans.length, "annotation")} (${redacted} redacted), ${n(Object.keys(example.ratings).length, "rating")} and ${n(Object.keys(example.corrections).length, "correction")} to the refunds eval set.`,
          );
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setValue(START);
            setSent(false);
            setNote("Back to the review as it started.");
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
