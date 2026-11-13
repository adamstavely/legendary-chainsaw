---
pattern: disclosure
status: new
related: check-status, sandbox-log, diff-viewer, terminal
---

## Overview

A test run that shows only what failed. The summary says how it went in words – "3 failed, 212 passed, 4 skipped" –
over a bar of the same shares, with the duration and the command. The failing tests come first, each opening to its
assertion message, expected against received as a small line diff, and the stack trimmed to the project's own frames,
with the file and line as a link. Passed and skipped tests fold into one line each that opens to the list. Re-run failed
asks the page to run them again; while `running`, the counts tick up live.

## When to use

- A tool result after an agent ran a project's tests.
- A CI job's test step, where people only need the failures.
- A run that's still going, with live counts.

## When not to use

- Several checks on a change (lint, build, tests) – use `check-status`.
- The raw output of a command – use `sandbox-log` or `terminal`.
- The changes that made a test fail – use `diff-viewer`.

## Anatomy

1. **Summary** `.ui-trr__summary` – the counts in words, `.ui-trr__bar` and Re-run failed `.ui-trr__rerun`
2. **Failure** `.ui-trr__fail` – one failed test, its `.ui-trr__toggle` and `.ui-trr__panel`
3. **Message** `.ui-trr__message` – the assertion's message
4. **Diff** `.ui-trr__diff` – expected against received, changed lines marked − and +
5. **Stack** `.ui-trr__stack` – the project's own frames
6. **File** `.ui-trr__file` – the file and line, a link
7. **Fold** `.ui-trr__fold` – "212 passed", opening to `.ui-trr__names`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Narrower than 480 px, the diff stacks expected above received and Re-run moves under the bar.

## Keyboard

The failures' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ or K / J | Move between failures |
| Home / End | The first or last failure |
| Enter / Space | Open or close the failure |
| Tab | On into an open failure's file link |

## Screen readers

The failures are a list named "Failed tests"; each is a button with `aria-expanded` that reads the test's suite, name
and "failed". The bar is hidden – the summary says the same in words. In the diff, each changed line is read with
"expected:" or "received:" in front. A re-run and the end of a run ("Run finished: 1 failed, 213 passed") are announced
through `role="status"`. While running, Re-run failed is `aria-disabled`.

## Content

- Name tests for the behaviour they check; `suite` carries the file or describe path.
- Pass `expected` and `received` as the runner printed them, one value per line.
- Leave passed tests out of `tests` for a big suite and give `counts` instead.

## Do

- Run the tests again on `tc-rerun`, set `running`, and update `tests` as results arrive.
- Open the file in the app's editor on `tc-open`.

## Don't

- Don't paste the whole runner output into `message`; that's what `sandbox-log` is for.
- Don't show only the bar: the counts in words are what people read.

## Example

```html
<tc-test-run-result id="run" heading="audit-ledger" command="npx vitest run" duration="12400"></tc-test-run-result>

<script type="module">
  import "@adamstavely/trenchcoat/test-run-result";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#run");
  el.counts = { passed: 212, skipped: 4 };
  el.tests = [
    {
      id: "totals",
      suite: "ledger › totals",
      name: "sums postings in the reporting currency",
      status: "failed",
      message: "expected 1240 to be 1214.5",
      expected: "1214.5",
      received: "1240",
      stack: "AssertionError: expected 1240 to be 1214.5\n    at Object.<anonymous> (src/ledger.test.ts:42:18)",
    },
  ];
  el.addEventListener("tc-rerun", (e) => console.log("Re-run", e.detail.ids));
</script>
```

```tsx
import { TestRunResult, type TestCase } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Run({ tests, running, rerun, openFile }: { tests: TestCase[]; running: boolean; rerun: (ids: string[]) => void; openFile: (file: string, line?: number) => void }) {
  return (
    <TestRunResult
      title="audit-ledger"
      command="npx vitest run"
      tests={tests}
      counts={{ passed: 212, skipped: 4 }}
      running={running}
      onRerun={(ids) => void rerun(ids)}
      onOpenFile={(file, line) => openFile(file, line)}
    />
  );
}
```
