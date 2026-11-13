---
pattern: form
status: new
related: deploy-channels, stepper-form, integration-settings, trigger-builder
---

## Overview

Connect one channel and set when an agent replies there, in five short steps: **Connect** an account (the page handles
the authorization), pick **Where** it replies from a searchable list, choose **When it replies** – every message, when
mentioned, only in direct messages, or during business hours with a time range and a time zone – send a **Test**
message, then **Go live** from a summary. Next checks each step and says what's missing in words; Back keeps
everything, and earlier steps stay one click away in the step list.

## When to use

- Adding an agent to one channel – team chat, an inbox, a phone number – from its deployment settings.
- Any short connect-pick-test-launch flow where the page owns the authorization and the test.

## When not to use

- Seeing every channel an agent is in – use `deploy-channels`.
- A general multi-step form with your own steps – use `stepper-form`.
- Settings for a service that's already connected – use `integration-settings`.
- Deciding what starts an agent, rather than where it replies – use `trigger-builder`.

## Anatomy

1. **Step list** `.ui-chs__steps` – the five steps, done ones with a check and a button back
2. **Step of** `.ui-chs__step-of` – "Step 2 of 5 · Where", in place of the list when narrow
3. **Panel** `.ui-chs__panel` – the current step, under its **Heading** `.ui-chs__heading`
4. **Connected** `.ui-chs__connected` – "Connected as …" once the page sets `account`
5. **Targets** `.ui-chs__targets` – checkboxes for the places to reply in, under a search field
6. **Replies** `.ui-chs__radios` – when it replies, each with a line of explanation; **Hours** `.ui-chs__hours` for business hours
7. **Test** `.ui-chs__test` and **Result** `.ui-chs__result-card` – the message, Send test and what came back
8. **Summary** `.ui-chs__summary` – what goes live
9. **Error** `.ui-chs__error` – what stops the step, in words
10. **Footer** `.ui-chs__footer` – Back, and Next or Go live
11. **Done** `.ui-chs__done` – "Policy Q&A is live in Team chat"

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Component tokens: `--tc-chs-mark` sizes the step marks and `--tc-chs-glyph` the small icons. Below 480 px the step list
becomes "Step 2 of 5 · Where" and the hours stack.

## Keyboard

Everything is a native control in tab order.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through the step list, the step's controls, Back and Next |
| Space | Ticks a place in Where; picks a reply mode |
| Arrow keys | Move between the reply modes |
| Enter / Space | Presses Connect, Send test, Back, Next or Go live; a done step in the list goes back to it |

When the step changes, focus moves to the new step's heading. When Next finds a problem, focus moves to the control to
fix.

## Screen readers

The step list is a navigation landmark ("Setup steps"); the current step has `aria-current="step"` and done steps say
"done". Each step is a section named by its heading. The places and the reply modes are fieldsets, each mode described by
its line of explanation. An error is linked to its controls with `aria-describedby` and announced, as are Sending… and
going live. The test's result is in a status region.

## Content

- Name `channel` and `agent` as people know them: they appear in the words ("Policy Q&A is live in Team chat").
- Give each target a `detail` that helps choosing: member counts, private or not.
- A failed `testResult` should say what to fix in `message`.

## Do

- Set `account` once authorization succeeds, and `testResult` when the test comes back – the buttons wait until then.
- Control `step` and `value` when the page saves progress as people go.

## Don't

- Don't skip the test: Next won't pass it without a test that got a reply.
- Don't put secrets in `account`; it's shown as written.

## Example

```html
<tc-channel-setup id="setup" heading="Put Policy Q&amp;A in team chat" channel="Team chat" agent="Policy Q&amp;A"></tc-channel-setup>

<script type="module">
  import "@adamstavely/trenchcoat/channel-setup";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#setup");
  el.targets = [
    { id: "policy", label: "#policy-questions", detail: "214 members" },
    { id: "starters", label: "#new-starters", detail: "38 members" },
  ];
  el.addEventListener("tc-connect", () => setTimeout(() => (el.account = "Research Institute workspace"), 500));
  el.addEventListener("tc-test", () => setTimeout(() => (el.testResult = { ok: true, reply: "Hi! Ask me about travel or expenses." }), 500));
  el.addEventListener("tc-go-live", (e) => console.log("live", e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { ChannelSetup, type ChannelSetupStep, type ChannelTestResult } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const targets = [
  { id: "policy", label: "#policy-questions", detail: "214 members" },
  { id: "starters", label: "#new-starters", detail: "38 members" },
];

export function TeamChatSetup({ authorize, sendTest }: { authorize: () => Promise<string>; sendTest: (message: string) => Promise<ChannelTestResult> }) {
  const [step, setStep] = useState<ChannelSetupStep>("connect");
  const [account, setAccount] = useState("");
  const [result, setResult] = useState<ChannelTestResult | null>(null);
  return (
    <ChannelSetup
      title="Put Policy Q&A in team chat"
      channel="Team chat"
      agent="Policy Q&A"
      targets={targets}
      step={step}
      onStepChange={setStep}
      account={account}
      testResult={result}
      onConnect={() => void authorize().then(setAccount)}
      onTest={(message) => void sendTest(message).then(setResult)}
      onGoLive={(value) => console.log("live", value)}
    />
  );
}
```
