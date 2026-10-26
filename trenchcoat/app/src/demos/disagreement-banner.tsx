import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DisagreementAnswer } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The same question, asked twelve days apart, got two different notice periods. The banner shows only the changes
   with a little context; "Show full answers" opens both. Dismiss it, or open the earlier session. */

const QUESTION = "Can we end the Northwind hosting contract early?";

const EARLIER: DisagreementAnswer = {
  when: "Oct 14",
  sessionId: "session-2291",
  text: "Yes. The agreement runs for twelve months and renews on its own, but either side can end it early with 30 days' written notice. Notice goes to the billing address on the order form. Prepaid months after the end date are refunded, and there is no exit fee after the first year.",
};

const TODAY: DisagreementAnswer = {
  when: "Today, 10:42",
  text: "Yes. The agreement runs for twelve months and renews on its own, but either side can end it early with 60 days' written notice. Notice goes to the billing address on the order form. Prepaid months after the end date are credited to the account, and there is no exit fee after the first year.",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DisagreementBanner } = ui;
  const [shown, setShown] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      {shown && (
        <DisagreementBanner
          question={QUESTION}
          earlier={EARLIER}
          current={TODAY}
          summary="Two details changed: the notice period and what happens to prepaid months."
          onDismiss={() => {
            setShown(false);
            setNote("Dismissed.");
          }}
          onOpenEarlier={(id) => setNote(`Opening ${id} from ${EARLIER.when}…`)}
        />
      )}
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {note ?? "Point at a change to find its counterpart on the other side."}{" "}
        {!shown && (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setShown(true);
              setNote(null);
            }}
          >
            Show it again
          </button>
        )}
      </div>
    </div>
  );
}
