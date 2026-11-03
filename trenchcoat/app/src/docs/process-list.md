---
pattern: list
status: new
related: terminal, background-tasks, preview-frame, sandbox-log
---

## Overview

The dev servers and background jobs of a session, as rows: a status mark and word, the name, the command, the port as a
link, how long it has been up, optional CPU and memory meters, and the last line it printed. Each row has Stop or Start,
Restart and View output. A crashed row stands out and says its exit code. Nothing here runs anything: the page passes
plain data, listens for the actions and passes the new statuses.

## When to use

- A side panel listing what a session or an agent has started: dev servers, watchers, workers.
- Anywhere people need to stop, restart or open a long-running process at a glance.

## When not to use

- A process's full output – use `terminal` or `sandbox-log`, opened from View output.
- One-off tasks that finish, with progress – use `background-tasks`.
- Jobs that run on a schedule – use `scheduled-runs`.

## Anatomy

1. **Row** `.ui-rproc__row` – one process, with its `data-status`
2. **Main** `.ui-rproc__main` – the pressable part: name, status, uptime, command and last line; it selects the row
3. **Status** `.ui-rproc__status` – a mark and a word, with the exit code for a crash
4. **Uptime** `.ui-rproc__up` – how long a live process has been running
5. **Command** `.ui-rproc__cmd` – what started it, in mono
6. **Last line** `.ui-rproc__last` – the last thing it printed, escape codes dropped
7. **Port** `.ui-rproc__port` – `localhost:5173`, which fires `tc-open`
8. **Meters** `.ui-rproc__meters` – CPU and memory, when given
9. **Buttons** `.ui-rproc__act` – Stop or Start, Restart and View output
10. **Count** `.ui-rproc__count` – how many are running, beside Stop all in the header

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. A page can set `--tc-rproc-meter`, the CPU meter's width.

Below about 34rem the meters hide and the buttons show only their icons; below about 26rem the command hides too and
the buttons move under the name.

## Keyboard

The rows' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the row above or below, at the same button |
| ← / → | Moves between a row's buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Presses the button: selects the row, opens the port or acts |

## Screen readers

The rows are a list named by the heading. The selected row's main button has `aria-current="true"`. Each status is a
word as well as a colour and a mark. Buttons are named with their process, such as "Stop web", even when only their
icons show. Stop, Start, Restart and Stop all are announced through a polite status.

## Content

- Name processes the way people talk about them: "web", "api", "tests".
- Give `command` as typed, and keep `lastLine` to one line.
- Pass `started` and let the element count the uptime; pass `now` to keep it still, as in a screenshot.

## Do

- Change `status` as the process changes: "starting" right after Start or Restart, then "running".
- Pass `exitCode` with "crashed" and "exited", so people can tell a crash from a clean exit.
- Open the port in a `preview-frame` beside the list.

## Don't

- Don't show secrets from a command line; the command is in the page and its tooltip.
- Don't rely on the element's own clock for many rows on a busy page: pass `now` from one clock instead.

## Example

```html
<tc-process-list id="procs" description="~/institute/sample-tracker"></tc-process-list>

<script type="module">
  import "trenchcoat/process-list";
  import "trenchcoat/tokens.css";

  const el = document.querySelector("#procs");
  el.processes = [
    { id: "web", name: "web", command: "vite --port 5173", status: "running", port: 5173, started: Date.now() - 60000 },
    { id: "docs", name: "docs", status: "crashed", exitCode: 1, lastLine: "Cannot find module" },
  ];
  el.addEventListener("tc-stop", (e) => console.log("stop", e.detail.id));
  el.addEventListener("tc-open", (e) => window.open(e.detail.url));
</script>
```

```tsx
import { ProcessList, type ProcessItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const processes: ProcessItem[] = [
  { id: "web", name: "web", command: "vite --port 5173", status: "running", port: 5173 },
  { id: "api", name: "api", command: "node server.mjs", status: "stopped" },
];

export function Processes({ onStop }: { onStop: (id: string) => void }) {
  return <ProcessList processes={processes} defaultSelected="web" onTcStop={(e) => onStop(e.detail.id)} />;
}
```
