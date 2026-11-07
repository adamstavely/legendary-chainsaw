---
pattern: none
status: new
related: sandbox-log, icon-rail, session-panel, code-block
---

## Overview

A command line for a panel: output in colour above a prompt. Pressing Enter fires `tc-command`, and the page runs the
command and passes a longer `output`, so any shell, sandbox or socket can sit behind it. It keeps a history, follows the
end of the output until the reader scrolls up, and stays fast with long output.

## When to use

- A terminal view in a session or workspace panel, such as behind an Icon Rail button.
- Letting someone run commands in a sandbox the page already has a connection to.

## When not to use

- Reading what an agent already ran, step by step – use `sandbox-log`.
- Full-screen programs such as vim or top. This is line-based and doesn't move the cursor; use a terminal emulator such as xterm.js.

## Anatomy

1. **Output** `.ui-trm__out` – what's been printed, in colour
2. **Line** `.ui-trm__line` – one row of output
3. **Prompt** `.ui-trm__prompt` – the sign, the command and Stop
4. **Input** `.ui-trm__input` – where the command is typed
5. **Stop** `.ui-trm__stop` – shown while a command runs
6. **Tools** `.ui-trm__tools` – Copy and Clear

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A
page can set `--tc-terminal-bg`, the background of the output.

## Keyboard

| Key | What it does |
|---|---|
| Enter | Fires `tc-command` with what's typed |
| ↑ / ↓ | Move through the history |
| Ctrl+C | Fires `tc-interrupt` while running; otherwise empties the prompt. With text selected, it copies |
| Ctrl+L | Fires `tc-clear` |
| Tab | Leaves the terminal, so keyboard users aren't trapped; it doesn't complete commands |

## Screen readers

The output is a `log`, so new lines are announced politely, and can be focused and scrolled with the keyboard. The input is
named by `input-label`. `role="status"` says when a command starts and finishes.

## Content

- Echo the command into `output` yourself, in whatever form your shell does; the terminal only shows what it's given.
- Set `masked` while a program asks for a password. What's typed is hidden and stays out of the history.
  Only the app sets it: generated UI can't, so a model can't put up a password prompt.

## Do

- Set `running` while a command runs, so Enter waits and Stop shows.
- Append to `output` rather than replacing it. Only new lines are parsed.

## Don't

- Don't connect it to a shell with more access than the person should have. It sends what's typed, and the server decides what's allowed.
- Don't rely on it to hide secrets that a program prints. Output is shown as it arrives.

## Example

```html
<tc-terminal id="term" prompt="~/project $"></tc-terminal>

<script type="module">
  import "@adamstavely/trenchcoat/terminal";
  import "@adamstavely/trenchcoat/tokens.css";

  const term = document.querySelector("#term");
  term.addEventListener("tc-command", (e) => {
    term.output += `$ ${e.detail.command}\nDone\n`;
  });
  term.addEventListener("tc-clear", () => {
    term.output = "";
  });
</script>
```

```tsx
import { useState } from "react";
import { Terminal } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Console({ run }: { run: (command: string) => Promise<string> }) {
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  return (
    <Terminal
      output={output}
      running={running}
      onTcCommand={async (e) => {
        setOutput((o) => `${o}$ ${e.detail.command}\n`);
        setRunning(true);
        const printed = await run(e.detail.command);
        setOutput((o) => o + printed);
        setRunning(false);
      }}
      onTcClear={() => setOutput("")}
    />
  );
}
```
