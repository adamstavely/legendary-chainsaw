---
pattern: toolbar
status: new
related: quickstart, code-block, route-map, json-viewer
---

## Overview

One API endpoint on one line, the way a reference page heads it. The method is a badge in its colour and its word –
GET, POST, PUT, PATCH or DELETE. The base URL comes next, or a small select when there are several environments, then
the path with each `{param}` picked out; pointing at or focusing a parameter shows what it is. Copy URL and Try it sit
at the end. Deprecated and Beta show as badges in words, and a short summary can follow the path.

## When to use

- The top of an endpoint's page in API reference docs.
- A list of endpoints in a developer portal, one bar each.
- An API explorer, where Try it opens a request form.

## When not to use

- A first request with code to copy – use `quickstart`.
- A full request or response example – use `code-block` or `json-viewer`.
- An app's own routes, not an API's – use `route-map`.

## Anatomy

1. **Method** `.ui-epb__method` – the HTTP method in its tone and as text
2. **Environment** `.ui-epb__env-select` – which base URL, when there are several
3. **Base URL** `.ui-epb__base` – the base URL in use
4. **Path** `.ui-epb__path` – the path, wrapping when narrow
5. **Parameter** `.ui-epb__param` – one `{param}`, with its description as a tooltip
6. **Badges** `.ui-epb__badge` – Deprecated or Beta
7. **Copy URL** `.ui-epb__copy` – copies the base URL and path
8. **Try it** `.ui-epb__try` – hands the request to the page

## Looks

Standard is a white bar on a gray tray. Clean is one white card. The method's tone is the only colour: GET green, POST
blue, PUT and PATCH amber, DELETE red – always with the method's word. Below 520 px the path wraps and the buttons take
their own line.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the environment select, each parameter, Copy URL and Try it |
| Escape | On a parameter, hides its tooltip until the next hover or focus |
| Enter / Space | Copies the URL, or tries the request |

## Screen readers

Each parameter is a button named “Path parameter {record_id}” and described by its tooltip, so its type and meaning
are read after the name; the tooltip itself is hidden from screen readers. The environment select is labelled
“Environment”. The method, badges and summary are text. Copying the URL is announced politely with the URL.

## Content

- Write the path exactly as the API takes it, with parameters in braces.
- Describe every parameter, with an example value: “The record's ID, e.g. rec_8f2a”.
- Keep the summary to a few words – “Get a record” – and leave the detail to the page.

## Do

- Mark deprecated endpoints, and say what replaces them on the page.
- Give every environment a plain label – Production, Staging.
- Open a request form or console from Try it.

## Don't

- Don't fill the parameters into the path; the braces show what to replace.
- Don't rely on the method's colour – the word is always there.
- Don't put more than one endpoint in a bar.

## Example

```html
<tc-endpoint-bar id="get-record" method="GET" path="/v1/records/{record_id}" summary="Get a record"></tc-endpoint-bar>

<script type="module">
  import "@adamstavely/trenchcoat/endpoint-bar";
  import "@adamstavely/trenchcoat/tokens.css";

  const bar = document.querySelector("#get-record");
  bar.params = [{ name: "record_id", type: "string", description: "The record's ID, e.g. rec_8f2a" }];
  bar.environments = [
    { id: "prod", label: "Production", baseUrl: "https://records.example.org" },
    { id: "staging", label: "Staging", baseUrl: "https://staging.records.example.org" },
  ];
  bar.addEventListener("tc-try", (e) => console.log(e.detail.method, e.detail.url));
</script>
```

```tsx
import { useState } from "react";
import { EndpointBar } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const environments = [
  { id: "prod", label: "Production", baseUrl: "https://records.example.org" },
  { id: "staging", label: "Staging", baseUrl: "https://staging.records.example.org" },
];

export function GetRecord({ openConsole }: { openConsole: (url: string) => void }) {
  const [environment, setEnvironment] = useState("prod");
  return (
    <EndpointBar
      method="GET"
      path="/v1/records/{record_id}"
      params={[{ name: "record_id", type: "string", description: "The record's ID, e.g. rec_8f2a" }]}
      environments={environments}
      environment={environment}
      onEnvironmentChange={setEnvironment}
      summary="Get a record"
      onTry={(request) => openConsole(request.url)}
    />
  );
}
```
