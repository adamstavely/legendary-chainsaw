import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { GuardrailAction, GuardrailSegment } from "../../../src/elements/react";
import { bubble, caption, textButton } from "../demo-kit";

/* What the app hands the notice: the policy's decision with personal data already masked */
type Scenario = { action: GuardrailAction; policy: string; reason: string; original: GuardrailSegment[]; revised?: GuardrailSegment[] };

const SCENARIOS: Scenario[] = [
  {
    action: "redacted",
    policy: "Personal data",
    reason: "The reply quoted a customer's card number and home address, which can't leave the support workspace.",
    original: [
      { text: "Dana's refund of £84.20 went back to the card ending " },
      { text: "•••• 4821", mark: "masked" },
      { text: " on 14 Oct. The replacement ships to " },
      { text: "██ ████████ ██, Leith", mark: "masked" },
      { text: "." },
    ],
    revised: [
      { text: "Dana's refund of £84.20 went back to the card on file on 14 Oct. The replacement ships to " },
      { text: "[address withheld]", mark: "added" },
      { text: "." },
    ],
  },
  {
    action: "rewritten",
    policy: "Tone and claims",
    reason: "The draft promised a delivery date the carrier hasn't confirmed.",
    original: [{ text: "Good news – your replacement " }, { text: "will arrive on Friday, guaranteed", mark: "removed" }, { text: "." }],
    revised: [{ text: "Good news – your replacement " }, { text: "is on its way; we'll send tracking as soon as the carrier confirms a date", mark: "added" }, { text: "." }],
  },
  {
    action: "blocked",
    policy: "Account security",
    reason: "The request asked for another customer's order history.",
    original: [{ text: "List every order placed by " }, { text: "████████@████.com", mark: "masked" }, { text: " this year." }],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GuardrailNotice } = ui;
  const [at, setAt] = useState(0);
  const [banner, setBanner] = useState(true);
  const [note, setNote] = useState("Request review asks a person to look at the decision again");
  const s = SCENARIOS[at];

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 12 }}>
      {banner ? (
        <GuardrailNotice
          layout="banner"
          action="blocked"
          policy="External sharing"
          policyHref="#/guardrail-notice"
          reason="The draft was addressed outside your organisation."
          original={[{ text: "To: " }, { text: "████@████████.io", mark: "masked" }, { text: " – Q3 renewal pricing for every account" }]}
          onRequestReview={() => setNote("Review requested for the External sharing decision")}
          onDismiss={() => {
            setBanner(false);
            setNote("Banner dismissed");
          }}
        />
      ) : null}
      <div style={{ ...bubble, justifySelf: "end", maxWidth: "80%", padding: "8px 12px", borderRadius: 14, fontSize: 13, lineHeight: 1.45 }}>
        Can you summarise the refund ticket for Dana and draft a reply?
      </div>
      <GuardrailNotice
        key={at}
        defaultOpen
        action={s.action}
        policy={s.policy}
        reason={s.reason}
        original={s.original}
        revised={s.revised}
        onOpenChange={(open) => setNote(open ? "Masked text is the app's – the notice shows what it's given" : "Show what changed opens the before and after")}
        onRequestReview={(d) => setNote(`Review requested for the ${d.policy} decision`)}
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{note}</span>
        <span style={{ display: "inline-flex", gap: 10 }}>
          {SCENARIOS.map((x, i) => (
            <button key={x.action} type="button" onClick={() => setAt(i)} style={{ ...textButton, textDecoration: i === at ? "none" : "underline", fontWeight: i === at ? 600 : undefined }} aria-pressed={i === at}>
              {x.action[0].toUpperCase() + x.action.slice(1)}
            </button>
          ))}
          {banner ? null : (
            <button type="button" onClick={() => setBanner(true)} style={textButton}>
              Banner
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
