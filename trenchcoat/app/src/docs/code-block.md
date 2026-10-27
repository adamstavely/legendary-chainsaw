---
pattern: toolbar
status: new
related: inline-diff, sandbox-log, artifact-panel, ai-answer
---

## Overview

Code an assistant writes, shown as it streams in, coloured with the theme's tokens. A head names the file and the
language and holds the actions: Copy, Apply when the page can apply the code, and Diff when the file as it is now
is known – Diff shows exactly which lines the code would add and remove before anyone applies it. While the code
is still arriving a caret blinks at the end, the head says “Writing”, and Diff and Apply wait until it settles.
Long code can be capped to a height; the body then scrolls and follows the end unless the reader scrolls up.

## When to use

- Code in an AI answer or chat, especially while it streams.
- A suggested change to a real file, where people should see the diff before they press Apply.
- Commands and snippets people will copy – set `language="bash"` and turn off `lineNumbers`.

## When not to use

- Changes to prose rather than code, accepted word by word – use `inline-diff`.
- Output of commands an agent ran, with exit codes and timings – use `sandbox-log`.
- Browsing several files and versions an agent produced – use `artifact-panel`.
- A whole answer with sources, of which code is one part – use `ai-answer` and put the code block inside it.

## Anatomy

1. **File** `.ui-cblk__title` – the file name (its folder is cut first when space is short) and the language
2. **Actions** `.ui-cblk__tools` – Diff with its +/− counts, Copy and Apply
3. **Code** `.ui-cblk__scroll` – the coloured lines, with line numbers in a gutter
4. **Line number** `.ui-cblk__no` – the gutter, two columns (old and new) in the diff

In the diff, long runs of unchanged lines fold behind a “Show N unchanged lines” button.

## Looks

Standard sets the head on the gray tray and the code on a white card below it. Clean is one white card with a
hairline head row above the code. `bare` drops the tray and card in both, for a code block inside another
component's card – the diff counts then move into the head.

## Keyboard

The actions are one tab stop; the arrows move between them.

| Key | What it does |
|---|---|
| Tab | Moves to the actions (the last one used), then to the code |
| → / ↓ | Moves to the next action |
| ← / ↑ | Moves to the previous action |
| Home / End | Moves to the first or last action |
| Enter / Space | Presses the action: toggles Diff, copies, or applies |

Disabled actions – Diff and Apply while streaming, Apply once applied – are skipped. The code area takes focus, so
the browser's own arrow keys scroll long lines and tall code.

## Screen readers

The actions are a `toolbar` named “Code actions”; Diff is a toggle button with `aria-pressed`, and Copy is named
“Copy code”. The code is a focusable `region` named by the file (“src/auth/session.ts”, or “TypeScript code” with
no file name), and “Changes to src/auth/session.ts” in the diff; it's `aria-busy` while streaming. In the diff,
each changed line starts with a hidden “Added:” or “Removed:”, and line numbers and +/− signs are hidden. A polite
status says “Copied”, or “Couldn't copy” if the clipboard refused.

## Content

- Give the file's path from the project root as `filename` (“src/auth/session.ts”) – the folder is cut first when
  there's no room, so the file's own name stays readable.
- Set `language` so the colours are right; unknown languages show as plain text with their name as given.
- Keep `applyLabel` a verb that says where the code goes, if “Apply” isn't clear: “Apply to file”, “Insert”.

## Do

- Pass `current` whenever the code changes an existing file – the diff is how people check it.
- Set `applied` once your page has applied the code; Apply turns into a disabled “Applied”.
- Cap tall blocks with `maxHeight` inside chat, so one answer doesn't push the conversation away.

## Don't

- Don't set `streaming` off before the last chunk has arrived – Diff and Apply would act on half the code.
- Don't use it for code people are meant to edit – it's for reading, copying and applying.
- Don't turn off line numbers for code people will discuss line by line.

## Example

```html
<tc-code-block id="fix" filename="src/auth/session.ts" language="ts" applyable max-height="340"></tc-code-block>

<script type="module">
  import "trenchcoat/code-block";
  import "trenchcoat/tokens.css";

  const block = document.querySelector("#fix");
  block.current = await fetch("/api/files/src/auth/session.ts").then((r) => r.text());
  block.code = 'import { db } from "../db";\n\nexport const TTL_MS = 60 * 60 * 1000;\n';
  block.addEventListener("tc-apply", async (e) => {
    await fetch(`/api/files/${e.detail.filename}`, { method: "PUT", body: e.detail.code });
    block.applied = true;
  });
</script>
```

```tsx
import { useState } from "react";
import { CodeBlock } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SuggestedFix({ code, current, streaming }: { code: string; current: string; streaming: boolean }) {
  const [applied, setApplied] = useState(false);
  return (
    <CodeBlock
      filename="src/auth/session.ts"
      language="ts"
      code={code}
      current={current}
      streaming={streaming}
      applied={applied}
      maxHeight={340}
      onApply={() => setApplied(true)}
    />
  );
}
```
