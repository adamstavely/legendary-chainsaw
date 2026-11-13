---
pattern: list
status: new
related: channel-setup, environment-list, integration-settings, configuration-release-control
---

## Overview

Where an agent can be reached, one row per place: a web widget, the API, team chat, email, text messages or a phone line.
Each row says whether the channel is live, a draft, paused, failing or not set up – with a mark and a word – which version
of the agent it answers with, and how many messages it handled in the last 7 days. Its actions follow its status: Set up,
Configure, Pause or Resume. Live channels come first, then the ones that need attention, so the list reads as a status
board.

## When to use

- An agent's settings page, saying where it's reachable and what's wrong.
- Before publishing a new version, to see which channels still serve the draft.

## When not to use

- Connecting one channel step by step – use `channel-setup`.
- A machine, folder or repository a session runs in – use `environment-list`.
- One connected service's settings – use `integration-settings`.
- Moving a configuration between environments with approvals – use `configuration-release-control`.

## Anatomy

1. **Row** `.ui-dpc__row` – one channel, with its `data-status`
2. **Icon** `.ui-dpc__icon` – the kind's, or the page's own `icon`
3. **Name** `.ui-dpc__name` and **Detail** `.ui-dpc__detail` – what people call it, and where it is
4. **Error** `.ui-dpc__error` – what's wrong, for a failing channel
5. **Status** `.ui-dpc__status` – a mark and a word: Live, Error, Paused, Draft or Not set up
6. **Version** `.ui-dpc__version` – Live version or Draft version
7. **Traffic** `.ui-dpc__traffic` – a small line of the week and the total in words
8. **Actions** `.ui-dpc__actions` – Set up, Configure, Pause or Resume
9. **Summary** `.ui-dpc__summary` – in the header: how many are live, and how many need attention

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Component tokens: `--tc-dpc-spark-w` and `--tc-dpc-spark-h` size the traffic line, `--tc-dpc-mark` the status mark and
`--tc-dpc-icon` the row's icon. Below 640 px a row's version, traffic and actions move under its name.

## Keyboard

The rows are information; only their actions take focus, in reading order.

| Key | What it does |
|---|---|
| Tab | Moves through the actions |
| Enter / Space | Presses an action |

After Pause or Resume, focus stays on the button that took its place.

## Screen readers

The rows are a list named by the heading. Each status is a word, never a colour alone, and the traffic line is hidden
because its total is in words beside it. Every action is named with its channel ("Pause API"), and Pause and Resume are
announced ("API paused") in a polite status region.

## Content

- Name channels by what people call them ("Intranet widget"), and put the address or room in `detail`.
- Give a failing channel an `error` that says what to do: "Reconnect to keep replying."
- Pass `traffic` as messages per day, oldest first; leave it out for a channel with nothing yet.

## Do

- Prevent `tc-channel-action` (or `tc-channels-change`) when pausing needs a confirmation first.
- Pass a channel's own `icon` element when the page has a mark for it – no third-party logos are built in.

## Don't

- Don't use the list for settings; Configure should open them elsewhere.
- Don't show a draft as live: set `version` to what the channel actually serves.

## Example

```html
<tc-deploy-channels id="channels" heading="Where Policy Q&amp;A answers"></tc-deploy-channels>

<script type="module">
  import "@adamstavely/trenchcoat/deploy-channels";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#channels");
  el.channels = [
    { id: "web", kind: "widget", name: "Intranet widget", status: "live", version: "live", traffic: [182, 204, 197, 221, 176, 64, 51] },
    { id: "chat", kind: "chat", name: "Team chat", status: "draft", version: "draft" },
    { id: "sms", kind: "sms", name: "Text messages", status: "not-set-up" },
  ];
  el.addEventListener("tc-channel-action", (e) => console.log(e.detail.action, e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { DeployChannels, type DeployChannel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: DeployChannel[] = [
  { id: "web", kind: "widget", name: "Intranet widget", status: "live", version: "live", traffic: [182, 204, 197, 221, 176, 64, 51] },
  { id: "sms", kind: "sms", name: "Text messages", status: "not-set-up" },
];

export function Channels({ onSetUp }: { onSetUp: (id: string) => void }) {
  const [channels, setChannels] = useState(start);
  return (
    <DeployChannels
      title="Where Policy Q&A answers"
      channels={channels}
      onChannelsChange={setChannels}
      onChannelAction={(d) => {
        if (d.action === "setup") onSetUp(d.id);
      }}
    />
  );
}
```
