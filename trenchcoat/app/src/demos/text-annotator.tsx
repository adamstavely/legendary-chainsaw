import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TextAnnotation } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A team reviews a short post-mortem before it's shared. Maya and Ravi have already marked it up; a moment after the
   page opens, Ravi highlights one more sentence and leaves a comment. Select any text to add your own (you're Jo):
   a colour, a comment, or copy. Resolve, edit or remove notes in the margin, and filter by colour or person. */

const TEXT = `Why the welcome emails stopped

For nine days in March, new customers didn't get their welcome email. Nobody noticed until support saw a run of tickets asking how to sign in. The cause was small: a template variable was renamed in the email service, and the old name quietly rendered as an empty string.

The send job didn't fail. It reported every email as delivered, because from its point of view each one was. Our only alert watched for failed sends, so nothing fired.

We've added a check that renders each template against sample data before a deploy and fails on any empty field. We're also alerting when sign-ups and first sign-ins drift apart for more than a day – that gap is what customers actually felt.`;

const span = (phrase: string) => {
  const start = TEXT.indexOf(phrase);
  return { start, end: start + phrase.length };
};

const START: TextAnnotation[] = [
  { id: "n1", ...span("For nine days in March"), color: "yellow", author: "Maya Chen", at: "2026-10-26T09:12:00Z", comment: "Can we give exact dates? Finance will ask." },
  { id: "n2", ...span("the old name quietly rendered as an empty string"), color: "pink", author: "Ravi Patel", at: "2026-10-26T09:40:00Z", comment: "This is the real lesson – worth its own heading?" },
  { id: "n3", ...span("Our only alert watched for failed sends"), color: "blue", author: "Maya Chen", at: "2026-10-26T10:05:00Z", resolved: true, comment: "Linked the alert config in the appendix." },
  { id: "n4", ...span("renders each template against sample data"), color: "green", author: "Maya Chen", at: "2026-10-26T10:07:00Z" },
];

/** What Ravi adds while you watch */
const LATER: TextAnnotation = {
  id: "n5",
  ...span("that gap is what customers actually felt"),
  color: "purple",
  author: "Ravi Patel",
  at: "2026-10-27T08:30:00Z",
  comment: "Love this framing. Could we chart the gap for the review?",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TextAnnotator } = ui;
  const [value, setValue] = useState<TextAnnotation[]>(START);
  const [scripted, setScripted] = useState(false);
  const [last, setLast] = useState("");

  // Once, a moment after the page opens: someone else adds a highlight with a comment
  useEffect(() => {
    if (scripted) return;
    const t = setTimeout(() => {
      setValue((v) => (v.some((a) => a.id === LATER.id) ? v : [...v, LATER]));
      setLast("Ravi Patel commented on the last paragraph");
      setScripted(true);
    }, 1800);
    return () => clearTimeout(t);
  }, [scripted]);

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <TextAnnotator
        title="Post-mortem review"
        description="Welcome emails · draft 2"
        text={TEXT}
        author="Jo Park"
        timestamp={() => new Date().toISOString()}
        value={value}
        onChange={(next, type, a) => {
          setValue(next);
          setLast(`${type === "add" ? "Added" : type === "edit" ? "Edited" : type === "remove" ? "Removed" : type === "restore" ? "Restored" : type === "resolve" ? "Resolved" : "Reopened"} “${TEXT.slice(a.start, a.end).slice(0, 40)}”`);
        }}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {last || "Select text to highlight it or comment"}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setValue(START);
            setLast("");
            setScripted(false);
          }}
        >
          Reset
        </button>
      </p>
    </div>
  );
}
