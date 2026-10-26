import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PromptStarter, PromptStarterGroup } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

// Starters for a sales team's assistant, personalised from what's in the workspace
const STARTERS: PromptStarterGroup[] = [
  {
    id: "analyse",
    label: "Analyse",
    icon: "chart",
    tone: "blue",
    items: [
      { id: "pipeline", text: "Which deals in the Q3 pipeline are most at risk, and why?", label: "Which Q3 deals are most at risk?", hint: "From the pipeline you opened today" },
      { id: "churn", text: "Compare churn this quarter with last quarter by plan", hint: "Billing data, updated an hour ago" },
    ],
  },
  {
    id: "write",
    label: "Write",
    icon: "write",
    tone: "violet",
    items: [
      { id: "followup", text: "Draft a follow-up to Northwind about ", label: "Draft a follow-up to Northwind…", hint: "Fills the message for you to finish", mode: "fill" },
      { id: "recap", text: "Write a recap of yesterday's call with Globex for the account team", label: "Recap yesterday's Globex call" },
    ],
  },
  {
    id: "find",
    label: "Find",
    icon: "search",
    tone: "teal",
    items: [{ id: "contract", text: "Find the renewal terms in the Acme contract", label: "Find the Acme renewal terms" }],
  },
];

const FOLLOW_UPS: PromptStarter[] = [
  { id: "f1", text: "What would it take to save the Globex deal?" },
  { id: "f2", text: "Show the same view for Q4" },
  { id: "f3", text: "Who owns each of these deals?" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PromptStarters, ChatComposer, defaultModels } = ui;
  const [message, setMessage] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  // The follow-ups are worked out from the answer – a short wait, then they appear
  useEffect(() => {
    if (!asked) return;
    setThinking(true);
    const t = setTimeout(() => setThinking(false), 900);
    return () => clearTimeout(t);
  }, [asked]);

  const send = (text: string) => {
    setAsked(text);
    setMessage("");
  };

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 12 }}>
      {asked === null ? (
        <PromptStarters title="Start with" groups={STARTERS} onSend={send} onFill={(text) => setMessage(text)} />
      ) : (
        <>
          <div style={{ ...caption, fontSize: "var(--tc-font-size-md, 14px)", color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}>
            <strong>You:</strong> {asked}
            <br />
            <span style={{ color: "var(--tc-text-secondary, light-dark(#525252, #b4b4ba))" }}>
              Three deals are at risk: Globex (no reply in 12 days), Initech (budget cut) and Umbrella (a competitor is in the trial).
            </span>
          </div>
          <PromptStarters variant="follow-ups" title="Ask next" items={FOLLOW_UPS} loading={thinking} onSend={send} onFill={(text) => setMessage(text)} />
        </>
      )}
      <ChatComposer placeholder="Ask about your accounts…" value={message} onValueChange={setMessage} models={defaultModels} onSend={send} />
      <div style={{ ...caption, textAlign: "center" }}>
        {asked === null ? "Enter asks, → or the pencil puts it in the message to edit first. " : ""}
        {asked !== null && (
          <button type="button" style={textButton} onClick={() => setAsked(null)}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
