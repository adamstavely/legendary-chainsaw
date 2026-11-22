---
pattern: list
status: new
related: api-keys, integration-settings, share-link-manager, audit-trail
---

## Overview

The webhook endpoints a workspace sends events to. Each endpoint shows its address, what it's for, which events it gets as chips, a switch to turn it on and off, and how its deliveries have gone in the last 24 hours, in words: "3 of 48 failed in the last 24 hours", "All 12 delivered in the last 24 hours" or "No deliveries yet".

The health line opens the endpoint's recent deliveries: the time, the event, whether it was delivered, failed or is "Retrying at 14:05", the HTTP status (or "No response"), how long it took and which attempt it was. A failed delivery has Retry (`tc-delivery-retry`). Each endpoint also has Send test event (`tc-endpoint-test`), Edit – a form in place (`tc-endpoint-update`) – and Delete, which asks first (`tc-endpoint-delete`). The switch fires `tc-endpoint-toggle`.

Add endpoint opens the same form at the top: an https address (anything else is refused with "Use an https:// address."), a description and the events, with All events. It fires `tc-endpoint-create`, and the page adds the endpoint. With `secret`, an endpoint's signing secret shows masked, with Show and Copy.

The element only shows and asks: the server sends, signs and retries.

## When to use

- A developer settings page where people point your app's events at their own systems.
- Checking why an integration stopped: which deliveries failed, and retrying them.

## When not to use

- Keys for calling your API – use `api-keys`.
- Connecting a named third-party app with its own settings – use `integration-settings`.
- A record of who changed what – use `audit-trail`.

## Anatomy

1. **Header** `.tc-head` – the title, and Add endpoint `.ui-whe__add`
2. **Endpoint** `.ui-whe__endpoint` – `.ui-whe__url`, `.ui-whe__desc`, the switch `.ui-whe__switch` and the event chips `.ui-whe__events`
3. **Signing secret** `.ui-whe__secret` – masked, with `.ui-whe__show` and `.ui-whe__copy`
4. **Health** `.ui-whe__toggle` – the health line `.ui-whe__health`, which opens the deliveries
5. **Actions** `.ui-whe__actions` – `.ui-whe__test`, `.ui-whe__edit` and `.ui-whe__remove`, with the question `.ui-whe__confirm`
6. **Deliveries** `.ui-whe__deliveries` – each `.ui-whe__delivery` with `.ui-whe__d-result` and `.ui-whe__retry`
7. **Form** `.ui-whe__form` – `.ui-whe__url-input`, the description, `.ui-whe__all-events` and the event checkboxes

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row. The switch uses the switch tokens; delivery results and health use the status colours with a dot and a word. Narrow, an endpoint's switch drops under its address and each delivery stacks into two lines.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Move through Add endpoint and each endpoint's switch, health line, Send test event, Edit and Delete |
| Enter / Space | Press the button with focus; Space flips a switch |
| Escape | Close an open form |

## Screen readers

Endpoints are a list labelled by the heading. Each switch is a `switch` named with its state and address ("Sending, https://hooks.example.com/…"). The health line is a button that says whether the deliveries are open and how many there are. Deliveries are an ordered list; each says delivered, failed or when it retries in words. Buttons are named with their endpoint or delivery. The form's address says why it was refused, and toggling, saving and deleting are announced in a polite status line.

## Content

- Describe what each endpoint feeds: "Keeps the reporting warehouse in step".
- Give event types dotted ids and a sentence each: "case.closed – A case is closed with an outcome".
- Send the newest deliveries first; `max-deliveries` (10 by default) caps how many show.

## Do

- Keep deliveries for at least 24 hours, so the health line has something to count.
- Set `nextRetryAt` while a retry waits, so the row says when.
- Ask for https only – the form refuses anything else.

## Don't

- Don't show the signing secret unmasked by default – leave it to Show.
- Don't hide failed deliveries: Retry is how people recover them.

## Example

```html
<tc-webhooks id="hooks" description="Ledgerline · Fraud review workspace"></tc-webhooks>

<script type="module">
  import "@adamstavely/trenchcoat/webhooks";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#hooks");
  el.eventTypes = [
    { id: "case.created", label: "case.created", description: "A case is opened" },
    { id: "case.closed", label: "case.closed", description: "A case is closed with an outcome" },
  ];
  el.endpoints = [{ id: "e1", url: "https://hooks.example.com/case-sync", events: ["case.created"], enabled: true, deliveries: [] }];
  el.addEventListener("tc-endpoint-create", async (e) => {
    const endpoint = await fetch("/api/webhooks", { method: "POST", body: JSON.stringify(e.detail) }).then((r) => r.json());
    el.endpoints = [...el.endpoints, endpoint];
  });
  el.addEventListener("tc-delivery-retry", (e) => fetch(`/api/webhooks/${e.detail.endpointId}/deliveries/${e.detail.deliveryId}/retry`, { method: "POST" }));
</script>
```

```tsx
import { useState } from "react";
import { Webhooks, type WebhookEndpoint } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function WebhookSettings({ initial, save }: { initial: WebhookEndpoint[]; save: (endpoints: WebhookEndpoint[]) => void }) {
  const [endpoints, setEndpoints] = useState(initial);
  return (
    <Webhooks
      endpoints={endpoints}
      onEndpointsChange={(next) => {
        setEndpoints(next);
        save(next);
      }}
      eventTypes={[{ id: "case.created", label: "case.created" }]}
      onEndpointCreate={({ url, description, events }) => setEndpoints((all) => [...all, { id: crypto.randomUUID(), url, description, events, enabled: true }])}
    />
  );
}
```
