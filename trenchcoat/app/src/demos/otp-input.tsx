import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { textButton } from "../demo-kit";

const CORRECT = "246810";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { OtpInput } = ui;
  type Status = UI.OtpStatus;
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [resent, setResent] = useState(0);
  const [round, setRound] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const verify = (value: string) => {
    setStatus("verifying");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(value === CORRECT ? "success" : "error"), 1200);
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setCode("");
    setStatus("idle");
    setRound((r) => r + 1);
  };

  return (
    <div style={{ display: "grid", gap: 18, justifyItems: "center", textAlign: "center" }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div id="otp-demo-title" style={{ fontSize: 15, fontWeight: 600, color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}>Check your phone</div>
        <div style={{ fontSize: 13, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
          We sent a 6-digit code to •••• 4821{resent > 0 ? ` (resent ${resent}×)` : ""}
        </div>
      </div>
      <OtpInput
        key={round}
        length={6}
        separator
        value={code}
        onChange={(next) => {
          setCode(next);
          if (status === "error") setStatus("idle");
        }}
        onComplete={verify}
        status={status}
        errorMessage="That code didn't work. Try again."
        successLabel="Phone verified"
        onResend={() => setResent((n) => n + 1)}
        resendIn={20}
        align="center"
        autoFocus={false}
        labelledBy="otp-demo-title"
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
        Hint: <code style={{ fontFamily: "ui-monospace, monospace", color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))" }}>{CORRECT}</code> passes, anything else shakes.
        {status === "success" && (
          <>
            {" "}
            <button
              type="button"
              onClick={reset}
              style={textButton}
            >
              Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}
