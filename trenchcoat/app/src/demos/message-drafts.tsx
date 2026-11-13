import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { MessageVariant } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's audit lead asks the assistant to tell a colleague the review meeting has moved. Three drafts
   in different tones – edit one, copy it or send it. */

const VARIANTS: MessageVariant[] = [
  { id: "friendly", tone: "Friendly", text: "Hi Sam! Quick heads-up – we've moved the audit review to Thursday at 2pm, same room. Hope that still works for you?" },
  { id: "brief", tone: "Brief", text: "Audit review moved to Thu 2pm, same room. OK for you?" },
  { id: "formal", tone: "Formal", text: "Hello Sam, the audit review meeting has been rescheduled to Thursday at 14:00 in the same room. Please let me know if this time does not suit you." },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MessageDrafts } = ui;
  const [key, setKey] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <MessageDrafts key={key} recipient="Sam Okafor" to="+1 555 0142" defaultVariants={VARIANTS} defaultSelected="friendly" openLink />
      <div style={{ ...caption, textAlign: "center" }}>
        Pick a tone, edit it, then Copy or Send.{" "}
        <button type="button" style={textButton} onClick={() => setKey((k) => k + 1)}>
          Start over
        </button>
      </div>
    </div>
  );
}
