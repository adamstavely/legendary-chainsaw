---
pattern: accordion
status: new
related: tool-call-card, code-block, live-view
---

## Overview

The output of the commands an agent ran in its sandbox, as a terminal shows it. Each step is a block with the
command, its exit code and how long it took; open it for the output in colour, with line numbers. Output streams
in and stays scrolled to the end while you're there, search finds text across every step, and Copy takes a step's
plain text or the whole log. It stays fast with long logs – a step with 50,000 lines renders only the rows near the
view.

## When to use

- Showing what an agent ran to install, build, test or deploy – and why a step failed.
- Live runs, where output arrives line by line and people want to follow along.
- Long logs people need to search and copy from, e.g. to paste a failing test into an issue.

## When not to use

- One tool call with its arguments and result – use `tool-call-card`.
- Code the agent wrote or changed – use `code-block`.
- Watching the agent operate a browser or desktop – use `live-view`.

## Anatomy

1. **Header** `.tc-head` – the icon, the heading and the environment it ran in
2. **Search** `.ui-sbl__search` – finds text across every step, with a match count and Previous / Next
3. **Copy log** `.ui-sbl__copy-all` – copies every command and its output as plain text
4. **Step** `.ui-sbl__toggle` – the status, the command, its label, exit code and time; opens and closes the output
5. **Copy output** `.ui-sbl__head .ui-sbl__copy` – copies one step's output
6. **Output** `.ui-sbl__step[data-open] .ui-sbl__out` – the output in colour, with line numbers, scrolling past `max-height`
7. **Summary** `.ui-sbl__summary` – the step that's running, or how many ran, failed and how long they took

## Looks

Standard sets the log in a white card on a gray tray, with the summary on the tray below and a check mark for a
step that passed. Clean is one white card with the summary as its last row under a hairline, and filled status
icons. Both colour the output from the theme's tokens, so it follows light and dark.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On a step: opens or closes its output |
| ↓ / ↑ | On a step: moves to the next or previous step, wrapping at the ends |
| Home / End | On a step: moves to the first or last step |
| Tab | Moves on – into an open step's output, which scrolls with the arrow keys |
| ⌘F / Ctrl+F | While focus is in the steps: moves to the search and selects its text |
| Enter | In the search: goes to the next match, opening its step |
| Shift+Enter | In the search: goes to the previous match |
| Escape | In the search: clears it |

## Screen readers

The log is a region named by its heading (“Sandbox”) unless the page names it. Each step is a button with
`aria-expanded` and `aria-controls` that reads the command, its label, exit code and time; its output is a focusable
region named “Output of npm test”, and a closed step's output is inert. The search is a search landmark with a field
named “Search output” and “Previous match” / “Next match” buttons. Copy buttons are named “Copy output of npm test”
and “Copy the whole log”. A status region says when a running step finishes (“npm test finished”, “npm test failed
with exit code 1”), how many matches a search found (“12 matches”, “No matches”) and “Copied” after a copy.

## Content

- Show the command exactly as it ran; put the plain-language purpose in `label` – “Run the test suite”.
- Use `environment` for what helps someone reproduce the run: the image, the runtime and the working directory.
- Keep the output as the command printed it, escape codes included – the component colours it and never reads it as HTML.
- Set `status: "queued"` for steps that haven't started, so they don't read as running.

## Do

- Pass a longer `output` as it streams – only the new lines are parsed and searched again.
- Update `duration` while a step runs for a live time, and set `exitCode` when it ends.
- Leave `open` unset to let the log open running and failed steps on its own.

## Don't

- Don't strip colour codes before passing the output – the colour carries the failures.
- Don't split one command's output across several steps; a step is one command.
- Don't set `follow` to false for live runs – people lose the end of the output.

## Example

```html
<tc-sandbox-log id="log" heading="Sandbox" environment="ubuntu-24.04 · node 22.11"></tc-sandbox-log>

<script type="module">
  import "trenchcoat/sandbox-log";
  import "trenchcoat/tokens.css";

  const log = document.querySelector("#log");
  log.steps = [
    { id: "ci", command: "npm ci", label: "Install dependencies", output: "added 812 packages", exitCode: 0, duration: 18400 },
    { id: "test", command: "npm test", label: "Run the test suite", output: "\u001b[31m✗ prorates a mid-cycle upgrade\u001b[0m", exitCode: 1, duration: 9240 },
  ];
  log.addEventListener("tc-copy", (e) => console.log(e.detail.stepId, e.detail.text.length));
</script>
```

```tsx
import { SandboxLog, type SandboxLogStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function RunOutput({ output, exitCode }: { output: string; exitCode?: number }) {
  const steps: SandboxLogStep[] = [
    { id: "ci", command: "npm ci", label: "Install dependencies", output: "added 812 packages", exitCode: 0, duration: 18400 },
    { id: "test", command: "npm test", label: "Run the test suite", output, exitCode },
  ];
  return <SandboxLog title="Sandbox" environment="ubuntu-24.04 · node 22.11" steps={steps} onOpenChange={(open) => console.log(open)} />;
}
```
