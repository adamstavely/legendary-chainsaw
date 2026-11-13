import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DeployChannel } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Where a fictional research institute's "Policy Q&A" agent can be reached. Traffic is fixed, so the thumbnail is stable. */

const CHANNELS: DeployChannel[] = [
  { id: "web", kind: "widget", name: "Intranet widget", detail: "intranet.institute.example/help", status: "live", version: "live", traffic: [182, 204, 197, 221, 176, 64, 51] },
  { id: "chat", kind: "chat", name: "Team chat", detail: "#policy-questions, #new-starters", status: "draft", version: "draft", traffic: [0, 0, 0, 4, 9, 2, 0] },
  { id: "email", kind: "email", name: "Email", detail: "policy-help@institute.example", status: "error", version: "live", traffic: [33, 41, 12, 0, 0, 0, 0], error: "The mailbox password changed – reconnect to keep replying." },
  { id: "api", kind: "api", name: "API", detail: "For the expenses app", status: "live", version: "live", traffic: [512, 498, 530, 541, 502, 120, 98] },
  { id: "sms", kind: "sms", name: "Text messages", status: "not-set-up" },
  { id: "voice", kind: "voice", name: "Phone line", status: "not-set-up" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DeployChannels } = ui;
  const [channels, setChannels] = useState(CHANNELS);
  const [said, setSaid] = useState("Pause the API, or set up text messages.");
  return (
    <div style={{ width: "100%", maxWidth: 860, display: "grid", gap: 8 }}>
      <DeployChannels
        title="Where Policy Q&A answers"
        description="Live channels first; the draft version only answers in draft channels."
        channels={channels}
        onChannelsChange={setChannels}
        onChannelAction={(d) => setSaid(`${d.action} · ${d.channel.name}`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said}{" "}
        <button type="button" style={textButton} onClick={() => setChannels(CHANNELS)}>
          Start over
        </button>
      </div>
    </div>
  );
}
