import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FeedbackRating, FeedbackRubricSubmit } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A reviewer rating a support answer that invented a policy. Two scores and the failure type are in; tone is still
   to score, and the correction is half written. Send shows "Sending…" for a moment while the app saves, then the
   rating locks; "Edit rating" opens it again. One timeout while saving, none at rest. */

const ANSWER =
  "Hi Dana – sorry the blender arrived cracked. Under our 90-day damage policy you can return it to any Brightline store for a full refund, and you'll get a $15 voucher for the trouble.";

const START: FeedbackRating = {
  scores: { accuracy: 2, completeness: 4 },
  failures: ["hallucination"],
  correction:
    "Hi Dana – sorry the blender arrived cracked. I've refunded $89.00 to your card; it should appear within 3–5 business days, and you don't need to send it back.",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FeedbackRubric } = ui;
  const [value, setValue] = useState<FeedbackRating>(START);
  const [sending, setSending] = useState<FeedbackRubricSubmit | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sending) return;
    const id = setTimeout(() => {
      setSending(null);
      setSent(true);
    }, 700);
    return () => clearTimeout(id);
  }, [sending]);

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <FeedbackRubric
        answer={ANSWER}
        meta={{ messageId: "msg_8812_3", model: "claude-sonnet", prompt: "support-v4" }}
        value={value}
        onChange={setValue}
        sending={!!sending}
        sent={sent}
        onSubmit={(rating) => {
          setSending(rating);
          // The app saves first; the rubric locks once it has
          return false;
        }}
        onEdit={() => setSent(false)}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {sent ? "Saved to the eval set as a failing case. " : sending ? "Saving… " : "Score Tone, then send. "}
        {sent && (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setSent(false);
              setValue(START);
            }}
          >
            Start again
          </button>
        )}
      </div>
    </div>
  );
}
