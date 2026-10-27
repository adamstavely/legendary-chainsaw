---
pattern: disclosure
status: new
related: model-picker, model-routing, integration-settings, secret-field
---

## Overview

One connection to a model provider, read as a path: your app, the endpoint, the credential, the deployment or model.
Each hop says how it fared in the last test – reachable, accepted, available – so when something fails, the hop that
failed is the one that stands out, with what went wrong and when it was checked under it. The models the endpoint
reports sit below as chips. The fields only open while someone edits, from Edit or by clicking a hop. The credential is
always a reference your server resolves, shown masked (“•••• 4f2a”); the key itself never reaches the page.

The element tests nothing itself. Test connection fires `tc-test` with the config and an `AbortSignal`; your app tries
the connection and sets `check` with what it found.

## When to use

- Setting up, or checking on, the connection an AI feature runs on: provider, endpoint, deployment, key.
- An admin page where people need to see quickly whether the connection works, and why not when it doesn't.
- Rotating a credential or moving to a new deployment, then confirming it still works.

## When not to use

- Choosing which already-configured model a conversation uses – use `model-picker`.
- Deciding which of several connections handles a request, with fallbacks – use `model-routing`.
- Connecting a general third-party service with its own settings – use `integration-settings`.
- Entering a secret itself – use `secret-field`, in a flow that stores it server-side.

## Anatomy

1. **Path** `.ui-prv__path` – your app → endpoint → credential → deployment
2. **Hop** `.ui-prv__node` – one stop on the path with its health; opens the fields at that stop
3. **Status** `.ui-prv__pill` – Not tested, Testing, Connected or what failed
4. **Health** `.ui-prv__health` – what the last test found, when, how fast, with Edit and Test
5. **Models** `.ui-prv__chips` – the models the endpoint reports; the one in use is marked

## Looks

Standard is a white card on the gray tray; the hops are tinted tiles, the health sits in a tinted band and the status
is a filled pill. Clean is one white card: the hops are hairline outlines, the health is a quiet row under a divider,
the status is a dot and a word, and the icons are thinner. A failed hop is tinted in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the hops, Edit, Test connection and, while editing, the fields |
| Enter / Space | On a hop, opens the fields and focuses that hop's field; on Edit or Done, opens or closes the fields; on Test connection, runs the test; on Cancel, stops it |
| Enter | In the endpoint or deployment field, saves the field and runs the test |
| Escape | While testing, cancels the test; while editing (with an endpoint set), closes the fields and returns focus to Edit |

The fields are native controls (select, inputs), so their own keys are the browser's.

## Screen readers

The host is a group named by the heading. The path is an ordered list labelled “Connection path”; each hop is a
button read as, for example, “Edit Credential Production key •••• 4f2a: Refused”, with `aria-expanded` showing whether
the fields are open. The status pill reads “Status: Auth failed”. A polite status message says “Testing the
connection…”, then the result – “Authentication failed. The endpoint turned the credential down…” – or “Test
cancelled.” A pasted key is refused with “That looks like a key. Enter the name of its reference instead…”, which is
also announced. The models are a list headed “Models the endpoint reports”.

## Content

- Name the hops as your product does: `providers` sets the provider's name, its endpoint placeholder and whether it
  calls the third hop “Deployment” or “Model”; `originLabel` names the first stop.
- Give credentials a label people recognise (“Production key”) and a masked `hint` of the last characters. Put the
  expiry in `expires` as you'd say it: “Expires 14 Jan”.
- Pass the provider's own words in `check.message` when they help (“401 – the key isn't valid for this resource”);
  otherwise the element says what each state means and what to do next.
- Keep `at` honest: it's when your server checked, not when the page loaded.

## Do

- Run the test on your server, resolve the credential there, and honour the signal – it aborts when someone cancels,
  edits the connection or leaves.
- Set `check` once you have an answer, even when it's a failure – that ends Testing….
- Report which hop failed precisely: `unreachable`, `auth-failed`, `expired` or `model-unavailable`.

## Don't

- Don't put a raw key in `value` or `credentials` – the element only holds references.
- Don't show Connected from a cached result after the config changed; the element marks such a check stale, and so
  should your server.
- Don't test automatically on every edit – testing spends quota and can lock a key out.

## Example

```html
<tc-provider-connection id="conn" description="Support assistant"></tc-provider-connection>

<script type="module">
  import "trenchcoat/provider-connection";
  import "trenchcoat/tokens.css";

  const conn = document.querySelector("#conn");
  conn.providers = [{ id: "azure", label: "Azure OpenAI", deploymentLabel: "Deployment" }];
  conn.credentials = [{ id: "kv/prod", label: "Production key", hint: "4f2a", expires: "Expires 14 Jan" }];
  conn.value = { provider: "azure", endpoint: "https://northwind.openai.azure.com", deployment: "support", credentialRef: "kv/prod" };
  conn.addEventListener("tc-test", async (e) => {
    const res = await fetch("/api/provider/test", { method: "POST", body: JSON.stringify(e.detail.value), signal: e.detail.signal });
    conn.check = await res.json(); // { status, at, latencyMs, models }
  });
</script>
```

```tsx
import { useState } from "react";
import { ProviderConnection, type ProviderConnectionCheck, type ProviderConnectionValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ModelConnection({ start, test }: { start: ProviderConnectionValue; test: (v: ProviderConnectionValue, signal: AbortSignal) => Promise<ProviderConnectionCheck> }) {
  const [value, setValue] = useState(start);
  const [check, setCheck] = useState<ProviderConnectionCheck | null>(null);
  return <ProviderConnection value={value} onChange={setValue} check={check} onTest={(v, signal) => void test(v, signal).then(setCheck, () => {})} />;
}
```
