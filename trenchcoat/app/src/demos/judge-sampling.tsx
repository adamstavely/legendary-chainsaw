import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { JudgeSamplingValue } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* How much of a research institute's Policy Q&A traffic its LLM judge reads. Raise a rate or switch a rule on and
   the estimates move; past the budget, it says so. */

const SEGMENTS = [
  { id: "intranet", label: "Intranet widget", chatsPerDay: 8400 },
  { id: "team-chat", label: "Team chat", chatsPerDay: 2600 },
  { id: "email", label: "Email replies", chatsPerDay: 450 },
];
const RULES = [
  { id: "thumbs", label: "Thumbs-down", description: "Every chat someone rated badly", chatsPerDay: 120 },
  { id: "escalations", label: "Escalations", description: "Chats handed to a person", chatsPerDay: 60 },
  { id: "new-prompt", label: "New prompt version", description: "All chats for 48 hours after a change", chatsPerDay: 900 },
];
const MODELS = [
  { id: "small", label: "Small judge", costPerChat: 0.0015 },
  { id: "large", label: "Large judge", costPerChat: 0.012 },
];
const START: JudgeSamplingValue = { rates: { intranet: 0.05, "team-chat": 0.1, email: 0.2 }, include: { thumbs: true, escalations: true, "new-prompt": false }, model: "small", budget: 150 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { JudgeSampling } = ui;
  const [value, setValue] = useState(START);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <JudgeSampling title="Judge sampling" description="Policy Q&A · production" segments={SEGMENTS} includeRules={RULES} models={MODELS} value={value} onValueChange={setValue} />
      <div style={{ ...caption, textAlign: "center" }}>
        Move a rate or switch a rule on and the estimates follow.{" "}
        <button type="button" style={textButton} onClick={() => setValue({ ...value, model: "large" })}>
          Try the large judge
        </button>
      </div>
    </div>
  );
}
