import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { MessageReceipt } from "../../../src/elements/react";
import { bubble, caption, textButton } from "../demo-kit";

const STEPS: MessageReceipt[] = ["sending", "sent", "delivered", "read"];
const TEXT = "Can you pull the tide gauge readings for the north jetty from last spring and chart them against the storm log?";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MessageStatus } = ui;
  const [receipt, setReceipt] = useState<MessageReceipt>("read");
  const [sentAt, setSentAt] = useState(() => Date.now() - 20_000);
  const [status, setStatus] = useState("Hover the message to use its controls");
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);

  // Sending → sent → delivered → read, a beat apart
  const send = () => {
    clear();
    setSentAt(Date.now());
    STEPS.forEach((step, i) => timers.current.push(window.setTimeout(() => setReceipt(step), i * 1100)));
  };

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 6 }}>
      <div data-ui-message="" style={{ display: "grid", justifyItems: "end", gap: 4 }}>
        <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: 14, ...bubble, fontSize: 14 }}>{TEXT}</div>
        <MessageStatus
          receipt={receipt}
          time={sentAt}
          text={TEXT}
          onRetry={() =>
            new Promise<void>((done) => {
              setStatus("Sending again…");
              timers.current.push(
                window.setTimeout(() => {
                  done();
                  send();
                  setStatus("Sent again");
                }, 900),
              );
            })
          }
          onCopyText={() => setStatus("Copied to clipboard")}
          onBranch={() => setStatus("A new chat would start from this message")}
        />
      </div>
      <div style={caption}>
        {status} ·{" "}
        <button type="button" style={textButton} onClick={send}>
          Send again
        </button>{" "}
        ·{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            clear();
            setReceipt("failed");
            setStatus("The message didn't go through");
          }}
        >
          Make it fail
        </button>
      </div>
    </div>
  );
}
