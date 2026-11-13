---
pattern: tabs
status: new
related: code-block, endpoint-bar, secret-field, setup-guide
---

## Overview

A first request to an API with the person's key already filled in. Tabs switch between cURL, Python, TypeScript and
Go, and four numbered steps follow: Install, Set your key, Send a request and See the response. The key goes into an
environment variable in step 2, shown masked until Reveal key is pressed; the request in step 3 reads that variable,
so the key never sits in code someone might paste. Each step has Copy, which always copies the real key and says so in
a warning. Run it hands the request to the page, which sends it and passes the response back.

## When to use

- The first page a developer sees after creating an API key.
- A docs page's "try your first call" box, signed in.
- Onboarding for an internal API, where people need one working request before anything else.

## When not to use

- A single code sample with nothing to set up – use `code-block`.
- One endpoint's heading on a reference page – use `endpoint-bar`.
- Entering or storing a secret – use `secret-field`.
- A checklist of setup tasks across a product – use `setup-guide`.

## Anatomy

1. **Tabs** `.ui-qks__tabs` – the languages
2. **Step** `.ui-qks__step` – one numbered step: Install, Set your key, Send a request, See the response
3. **Code** `.ui-qks__pre` – the step's command or request
4. **Copy** `.ui-qks__copy` – copies the step's text, with the real key
5. **Reveal key** `.ui-qks__reveal` – shows or masks the key
6. **Warning** `.ui-qks__warning` – after copying the key, a reminder to keep it private
7. **Run it** `.ui-qks__run` – sends the request through the page
8. **Response** `.ui-qks__response` – the response the page passed back, with its status

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Code sits on the sunken surface in the mono font. The step numbers' size is the component token
`--tc-qks-num`; below 400 px the numbers hide and the steps take the full width.

## Keyboard

The tabs are one tab stop; the panel follows the selected tab.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next language, and shows it |
| Home / End | Moves to the first or last language |
| Tab | Moves into the steps: each code block, Copy, Reveal key, Run it |

## Screen readers

The languages are a `tablist` of `tab`s controlling one `tabpanel`. Each step is a list item with a heading that
includes its number: “Step 2: Set your key”. Code blocks are focusable regions named by their step, so they can be
scrolled from the keyboard. Copy's name is its visible word plus the step: “Copy Set your key”. Reveal key is a toggle
button (`aria-pressed`). Copying, sending and the response arriving are announced politely; copying the key announces
the warning.

## Content

- Use the person's real key, and an environment variable name that matches your docs.
- Pick an endpoint that's safe to call and returns something worth seeing – a search, a status, a list.
- Keep the body small; the snippet is for a first call, not a full integration.

## Do

- Mask the key by default, and keep Reveal for when people need to check it.
- Remember the chosen language with `storage-key`, so a returning developer sees theirs.
- Show the real response, status included, when Run it succeeds.

## Don't

- Don't paste the key into the request itself – the environment variable keeps it out of code.
- Don't send the request from the element; Run it hands it to the page, which knows how to call your API.
- Don't use a real key in demos or screenshots – use a test placeholder.

## Example

```html
<tc-quickstart
  id="quickstart"
  heading="Search records"
  base-url="https://records.example.org"
  api-key="sk-test-0000a1b2c3d4e5f60000"
  env-var="RECORDS_API_KEY"
  storage-key="records-quickstart"
></tc-quickstart>

<script type="module">
  import "@adamstavely/trenchcoat/quickstart";
  import "@adamstavely/trenchcoat/tokens.css";

  const quickstart = document.querySelector("#quickstart");
  quickstart.endpoint = { method: "POST", path: "/v1/records/search", body: { query: "travel policy" } };
  quickstart.addEventListener("tc-run", () => {
    setTimeout(() => {
      quickstart.response = JSON.stringify({ results: [], total: 0 }, null, 2);
      quickstart.responseStatus = "200 OK";
      quickstart.running = false;
    }, 500);
  });
</script>
```

```tsx
import { useState } from "react";
import { Quickstart, type QuickstartRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FirstRequest({ apiKey, send }: { apiKey: string; send: (run: QuickstartRun) => Promise<string> }) {
  const [response, setResponse] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  return (
    <Quickstart
      title="Search records"
      baseUrl="https://records.example.org"
      endpoint={{ method: "POST", path: "/v1/records/search", body: { query: "travel policy" } }}
      apiKey={apiKey}
      envVar="RECORDS_API_KEY"
      storageKey="records-quickstart"
      response={response}
      running={running}
      onRun={(run) => {
        setRunning(true);
        void send(run).then((text) => {
          setResponse(text);
          setRunning(false);
        });
      }}
    />
  );
}
```
