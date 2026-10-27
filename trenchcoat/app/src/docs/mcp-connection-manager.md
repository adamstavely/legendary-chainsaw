---
pattern: disclosure
status: new
related: tool-permissions, tool-configuration, integration-settings, provider-connection
---

## Overview

The MCP servers an app's agents can reach, each on one row that says at a glance whether it's connected and what it
offers: a status, its transport and address, counts of its tools, resources and prompts, and the first few tool names.
Connect, Disconnect, Retry and Cancel sit on the row. Inspect opens the row to list everything the server exposes, in
tabs, and to remove it – which asks first. Add server walks a short form: a name, the transport (stdio, HTTP or SSE),
the URL or command, auth and a credential reference, with Test to try it before it's added.

The element connects to nothing. `tc-connect` and `tc-test` hand your app a server and an `AbortSignal`; your MCP client
does the work and reports back through `connections`.

## When to use

- Settings for an agent workspace where people bring their own MCP servers.
- An admin view of which servers are up, which failed and why, and what each one exposes.
- Onboarding a new server: try it, see what it offers, then keep it.

## When not to use

- Deciding which agents may call which tools – use `tool-permissions`.
- Defining a single tool by hand, with its parameters – use `tool-configuration`.
- Connecting a model provider's endpoint – use `provider-connection`.
- Connecting a general SaaS integration with its own settings – use `integration-settings`.

## Anatomy

1. **Server** `.ui-mcs__server` – one server: status dot, name, transport and address, and its action
2. **At a glance** `.ui-mcs__glance` – counts of tools, resources and prompts, and the first tool names
3. **Inspect** `.ui-mcs__inspect` – opens the row to show everything it exposes
4. **Add server** `.ui-mcs__add` – opens the form to add one
5. **Connected count** `.ui-mcs__pill` – how many of the servers are connected

## Looks

Standard is a white card on the gray tray with Add server and the note on the tray below; the count is a filled pill
and the capability badges are filled. Clean is one white card with Add server in its last row; the count is plain
text, the badges are hairline outlines and the icons are thinner. The remove dialog is the same in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each row's action and Inspect, then Add server |
| Enter / Space | On Connect, Retry, Disconnect or Cancel, does that; on Inspect, opens or closes the row |
| ← / → | In an open row's tabs, moves between Tools, Resources and Prompts |
| Home / End | In the tabs, the first or last tab |

In the add form:

| Key | What it does |
|---|---|
| ← / → | In Transport, picks stdio, HTTP or SSE |
| Enter | In the URL or command field, tests the server |
| Escape | Closes the form; focus returns to Add server |

In the remove dialog, focus starts on Cancel:

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between Cancel and Remove, wrapping inside the dialog |
| Escape | Closes without removing; focus returns to Remove |

After a server is removed, focus moves to the next server's Inspect, or to Add server.

## Screen readers

The host is a group named by the heading, and the servers are a list labelled by it. The count reads “1 of 3
connected, 1 failed”. Each row's buttons are named with the server – “Connect Database”, “Retry Docs”, “Cancel
connecting to Database”, “Inspect GitHub” (with `aria-expanded`). What a server exposes is read as one sentence, “5
tools, 1 resource and 0 prompts”, followed by “Tools: search_issues…”. Inside, the tabs are a tablist and the list a
tabpanel named “Tools”, “Resources” or “Prompts”. Remove opens a modal `alertdialog` named “Remove GitHub?” and
described by what goes with it. A polite status message says “Connecting to Database…”, “Database connected – 1 tool,
0 resources and 0 prompts.”, “Docs failed to connect. 401 – token rejected”, “Linear added.” and “GitHub removed.”

## Content

- Name servers as people know them (“GitHub”, “Analytics database”), not by host.
- Pass the failure in your client's words in `connections[id].message` – the row shows it in place of the counts.
- Offer the transports and auth methods your client supports through `transports` and `authOptions`; their
  descriptions say when to pick each.
- Credentials are references with a masked `hint`; the secret stays on your server.
- `note` beside Add server points to where tool access is set; clear it if your product says that elsewhere.

## Do

- Honour the signal: it aborts when someone cancels, edits a draft under test, removes the server or leaves the page.
- Update `connections` for every answer, failures included – that's what ends Connecting….
- Disconnect in your `tc-value-change` handler when `change.type` is "remove", and when `tc-disconnect` arrives for a
  tested draft that was never added.

## Don't

- Don't start stdio commands from the browser – your app runs them on its own host, after its own checks.
- Don't treat a tool listed here as allowed; access is decided in `tool-permissions`.
- Don't remove a server without the confirmation – its tools disappear from every agent that used them.

## Example

```html
<tc-mcp-connection-manager id="mcp"></tc-mcp-connection-manager>

<script type="module">
  import "trenchcoat/mcp-connection-manager";
  import "trenchcoat/tokens.css";

  const mcp = document.querySelector("#mcp");
  mcp.value = [{ id: "gh", name: "GitHub", transport: "http", target: "https://mcp.example.com/gh", auth: "token", credentialRef: "vault/gh" }];
  mcp.credentials = [{ id: "vault/gh", label: "GitHub token", hint: "9f1c" }];
  mcp.connections = {};
  mcp.addEventListener("tc-connect", async (e) => {
    const res = await fetch(`/api/mcp/${e.detail.server.id}/connect`, { method: "POST", signal: e.detail.signal });
    mcp.connections = { ...mcp.connections, [e.detail.server.id]: await res.json() };
  });
</script>
```

```tsx
import { useState } from "react";
import { McpConnectionManager, type McpConnection, type McpServer } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Servers({ start, connect }: { start: McpServer[]; connect: (s: McpServer, signal: AbortSignal) => Promise<McpConnection> }) {
  const [servers, setServers] = useState(start);
  const [connections, setConnections] = useState<Record<string, McpConnection>>({});
  const run = (s: McpServer, signal: AbortSignal) => void connect(s, signal).then((c) => setConnections((all) => ({ ...all, [s.id]: c })), () => {});
  return <McpConnectionManager value={servers} onChange={setServers} connections={connections} onConnect={run} onTest={run} />;
}
```
