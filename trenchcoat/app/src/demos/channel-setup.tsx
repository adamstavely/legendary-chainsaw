import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ChannelSetupStep, ChannelSetupValue, ChannelTestResult } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's "Policy Q&A" agent going live in its team chat. Starts on When it replies, with an
   account connected and two channels picked, so the thumbnail shows a step in progress. */

const TARGETS = [
  { id: "policy", label: "#policy-questions", detail: "214 members" },
  { id: "starters", label: "#new-starters", detail: "38 members" },
  { id: "travel", label: "#travel-and-expenses", detail: "121 members" },
  { id: "audit", label: "#annual-audit", detail: "17 members · private" },
  { id: "general", label: "#general", detail: "640 members" },
];
const START: ChannelSetupValue = { targets: ["policy", "starters"], replies: "mentions", hours: { from: "09:00", to: "17:30", timeZone: "Europe/London" } };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChannelSetup } = ui;
  const [step, setStep] = useState<ChannelSetupStep>("when");
  const [value, setValue] = useState(START);
  const [account, setAccount] = useState("Research Institute workspace");
  const [connecting, setConnecting] = useState(false);
  const [result, setResult] = useState<ChannelTestResult | null>(null);
  const [run, setRun] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <ChannelSetup
        key={run}
        title="Put Policy Q&A in team chat"
        channel="Team chat"
        agent="Policy Q&A"
        targets={TARGETS}
        step={step}
        onStepChange={setStep}
        value={value}
        onValueChange={setValue}
        account={account}
        connecting={connecting}
        testResult={result}
        onConnect={() => {
          setConnecting(true);
          setTimeout(() => {
            setAccount("Research Institute workspace");
            setConnecting(false);
          }, 600);
        }}
        onTest={() => {
          setResult(null);
          setTimeout(() => setResult({ ok: true, reply: "Hi! I answer questions about the institute's policies – travel, expenses, leave and data handling." }), 700);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Pick business hours, then Next through to Go live.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setStep("connect");
            setValue({ ...START, targets: [] });
            setAccount("");
            setResult(null);
            setRun((n) => n + 1);
          }}
        >
          Start from the beginning
        </button>
      </div>
    </div>
  );
}
