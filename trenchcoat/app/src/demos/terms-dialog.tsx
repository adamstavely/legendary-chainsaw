import { useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TermsAcceptDetail, TermsChange, TermsConsent, TermsDialogSection } from "../../../src/elements/react";
import { button, caption, surface } from "../demo-kit";

/* Two moments an app asks people to agree. Signing up: the Terms of Service for the first time – read to the end and
   check the required box before Accept unlocks; product updates are optional. Coming back after a policy change: the
   AI acceptable use policy, version 3.0, must be agreed to again before going on (blocking, no Not now) – what changed
   since version 2.1 comes first. Saving the acceptance fails once (the connection drops); Try again records it. */

const TERMS: TermsDialogSection[] = [
  {
    id: "about",
    heading: "About these terms",
    body: "These terms are an agreement between you and Lumen Labs Ltd. They cover your use of the Lumen workspace, its apps and the assistant built into it.\n\nIf you use Lumen for an organisation, you agree on its behalf, and your organisation's agreement with us comes first where the two differ.",
  },
  {
    id: "account",
    heading: "Your account",
    body: "You need an account to use Lumen. Keep your sign-in details to yourself and tell us straight away if you think someone else has used them.\n\n- You must be 16 or older.\n- One person per account – share a workspace, not a login.\n- You're responsible for what happens under your account.",
  },
  {
    id: "content",
    heading: "Your content",
    body: "What you write, upload or create in Lumen stays yours. You give us permission to store, process and display it only so we can run the service for you.\n\nWe don't use your content to train our models unless your workspace turns that on.",
  },
  {
    id: "assistant",
    heading: "Using the assistant",
    body: (
      <>
        <p>
          The assistant can be wrong. Check anything you rely on, especially figures, quotes and advice about health, money or the law. The{" "}
          <a href="https://example.com/legal/ai-policy" target="_blank" rel="noreferrer">AI acceptable use policy</a> says what it may not be used for.
        </p>
        <ul>
          <li>Answers show where they came from when they use your documents.</li>
          <li>You decide what the assistant sends, publishes or changes on your behalf.</li>
        </ul>
      </>
    ),
  },
  {
    id: "payment",
    heading: "Plans and payment",
    body: "Paid plans renew each month or year until you cancel. Prices include tax where the law requires it. If we change a price, we tell you at least 30 days before it applies to you.",
  },
  {
    id: "ending",
    heading: "Ending the agreement",
    body: "You can close your account at any time from Settings. We may suspend or close an account that breaks these terms, and we'll say why unless the law stops us.\n\nAfter an account closes you have 30 days to export your content.",
  },
  {
    id: "liability",
    heading: "Liability",
    body: "Nothing in these terms limits liability that can't be limited by law. Otherwise, our total liability to you is limited to what you paid us in the 12 months before the claim.",
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: "When we change these terms we'll tell you in the app and by email, show what changed, and ask you to agree again before the new version applies to you.",
  },
];

const TERMS_CONSENTS: TermsConsent[] = [
  { id: "terms", label: "I agree to the Terms of Service", required: true },
  { id: "updates", label: "Send me product updates", description: "About once a month. Unsubscribe from any email." },
];

const POLICY: TermsDialogSection[] = [
  {
    id: "purpose",
    heading: "What this policy is for",
    body: "This policy says what you may not use Lumen's assistant and models for. It applies to everyone in your workspace, and to anything built on the Lumen API.",
  },
  {
    id: "never",
    heading: "Never allowed",
    body: "- Content that sexualises minors\n- Planning or encouraging violence against people\n- Creating malware or getting into systems without permission\n- Impersonating a real person to deceive others",
  },
  {
    id: "review",
    heading: "Allowed with human review",
    changed: true,
    body: "Some uses need a person to check the output before it's acted on:\n\n- Decisions about employment, credit, housing or insurance\n- Medical or legal advice given to someone else\n- Messages sent to more than 100 people at once",
  },
  {
    id: "disclosure",
    heading: "Saying when AI was used",
    changed: true,
    body: "When the assistant wrote most of something you publish or send to customers, say so. A short line is enough: “Drafted with AI, reviewed by our team.”",
  },
  {
    id: "data",
    heading: "Personal data in prompts",
    body: "Only include personal data you're allowed to process. Your workspace admin can turn on automatic redaction of names, emails and phone numbers.",
  },
  {
    id: "breaches",
    heading: "If the policy is broken",
    changed: true,
    body: "We may pause the assistant for an account while we look into a report, and we'll tell the workspace admin. Repeated or serious breaches can end access to the assistant.",
  },
];

const POLICY_CHANGES: TermsChange[] = [
  { text: "Messages sent to more than 100 people now need a person to review them first.", section: "review" },
  { text: "New: say when AI wrote most of something you publish.", section: "disclosure" },
  { text: "Workspace admins are told when the assistant is paused for an account.", section: "breaches" },
];

type Flow = "signup" | "policy" | null;
const later = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Demo({ ui }: { ui: typeof UI }) {
  const [flow, setFlow] = useState<Flow>(null);
  const [log, setLog] = useState("Nothing agreed yet in this session.");
  const [agreed, setAgreed] = useState<Record<string, string>>({});
  const tries = useRef(0);

  // The app records the acceptance; the first try fails as a dropped connection would
  const record = async () => {
    await later(900);
    if (tries.current++ === 0) throw new Error("offline");
  };
  const done = (what: string, key: string) => (detail: TermsAcceptDetail) => {
    setAgreed((a) => ({ ...a, [key]: detail.version }));
    const extra = Object.entries(detail.consents)
      .filter(([id]) => id === "updates")
      .map(([, on]) => ` · product updates ${on ? "on" : "off"}`)
      .join("");
    setLog(`Recorded: ${what} ${detail.version}${extra}.`);
  };

  const open = (f: Flow) => {
    tries.current = 0;
    setFlow(f);
  };

  const row = (name: string, state: string, action: string, f: Flow, first = false) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--tc-space-3, 12px)", padding: "var(--tc-space-3, 12px) 0", borderTop: first ? 0 : "1px solid var(--tc-divider, light-dark(#ececec, #2a2a2e))" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--tc-font-size-md, 13px)", fontWeight: "var(--tc-font-weight-medium, 500)" as never }}>{name}</div>
        <div style={caption}>{state}</div>
      </div>
      <button type="button" style={button} onClick={() => open(f)}>
        {action}
      </button>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: "var(--tc-space-3, 12px)", justifyItems: "start" }}>
      <div style={{ ...surface, borderRadius: "var(--tc-radius-xl, 12px)", display: "grid", padding: "var(--tc-space-1, 4px) var(--tc-space-4, 16px) var(--tc-space-3, 12px)", width: "min(100%, 440px)" }}>
        {row("Terms of Service", agreed.terms ? `You agreed to ${agreed.terms}` : "Version 4.0 · new account, not agreed yet", "Create an account", "signup", true)}
        {row("AI acceptable use policy", agreed.policy ? `You agreed to ${agreed.policy}` : "You agreed to 2.1 · version 3.0 waiting", "Sign in", "policy")}
        <p style={{ ...caption, paddingTop: "var(--tc-space-2, 8px)", borderTop: "1px solid var(--tc-divider, light-dark(#ececec, #2a2a2e))" }} role="status">
          {log}
        </p>
      </div>

      <ui.TermsDialog
        open={flow === "signup"}
        onOpenChange={(o: boolean) => !o && setFlow(null)}
        heading="Terms of Service"
        version="4.0"
        effectiveDate="1 November 2026"
        sections={TERMS}
        consents={TERMS_CONSENTS}
        requireScroll
        printable
        downloadable
        declineLabel="Cancel"
        recordAcceptance={record}
        onAccept={done("Terms of Service", "terms")}
        onDecline={() => setLog("Sign-up cancelled – nothing was recorded.")}
        onPrint={() => setLog("Print asked for – the app opens its print view.")}
        onDownload={() => setLog("Download asked for – the app serves terms-4.0.pdf.")}
      />

      <ui.TermsDialog
        open={flow === "policy"}
        onOpenChange={(o: boolean) => !o && setFlow(null)}
        heading="AI acceptable use policy"
        version="3.0"
        effectiveDate="1 December 2026"
        previousVersion="2.1"
        previousDate="12 March 2026"
        changes={POLICY_CHANGES}
        sections={POLICY}
        consents={[{ id: "policy", label: "I agree to the AI acceptable use policy", required: true }]}
        blocking
        canDecline={false}
        acceptLabel="Agree and continue"
        downloadable
        recordAcceptance={record}
        onAccept={done("AI acceptable use policy", "policy")}
        onDownload={() => setLog("Download asked for – the app serves ai-policy-3.0.pdf.")}
      />
    </div>
  );
}
