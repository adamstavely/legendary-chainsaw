---
pattern: toolbar
status: new
related: context-window, verification-queue, lineage-graph, attestation-check
---

## Overview

The record of one AI run – everything someone needs to run it again and to judge what came out of it. It lists the
exact model id, the settings, the instruction's name and hash, the sources and corpus the run drew on, the intent the
session started with, and the verification summary: how many claims were verified, couldn't be verified, were
incorrect, dismissed or still wait for review. Long values stay readable – the hash shows shortened and copies in
full – and the whole record copies as JSON or goes to the app for export. The card reads no clock: the time shows as
the app passes it.

## When to use

- At the end of an analysis or report, so anyone reading it can see how it was produced and rerun it.
- Beside an export or a hand-off, where the receiver needs the model, settings and sources with the result.
- In an audit trail or run history, one manifest per run.

## When not to use

- How full the model's context is right now – use `context-window`.
- Working through the claims one by one – use `verification-queue`.
- Tracing each claim back to its sources step by step – use `lineage-graph`.
- Checking that a signed package hasn't changed – use `attestation-check`.

## Anatomy

1. **Header** `.tc-head` – the icon, the title, the run id with its copy button, the time, and the model badge
2. **Hash** `.ui-rmf__hash` – the instruction's hash, shortened, with a copy button for the full value
3. **Sources** `.ui-rmf__sources` – the sources and corpus, the first few with Show all
4. **Intent** `.ui-rmf__intent` – what the session set out to do, in the person's words
5. **Verification** `.ui-rmf__verify-bar` – the reviewed claims by state, with the counts below
6. **Actions** `.ui-rmf__tools` – Copy (the whole record as JSON) and Export

## Looks

Standard sets a white card in the gray tray, with the actions on the tray below; the model badge is set in mono like
context-window's. Clean is one white card with a shadow: the actions sit in its last row under a hairline, the badge
is a plain tag and the icons are finer.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the copy buttons, Show all, and then the actions toolbar as one stop |
| ← / → | In the actions toolbar: moves between Copy and Export, wrapping at the ends |
| Home / End | In the actions toolbar: moves to Copy or to Export |
| Enter / Space | Copies, exports, or shows all sources |

## Screen readers

The card is a `region`, named by its heading; the fields are a description list (“Model”, “Settings”,
“Instruction”…). Each copy button names what it copies (“Copy instruction hash”), and a polite live region confirms
it (“Instruction hash copied.”, or “Couldn't copy the instruction hash.”). The shortened hash is read with a “Hash”
prefix. Show all is a disclosure button with `aria-expanded`. The verification bar is a `meter` named “Claims
reviewed”, with a value such as “15 of 20 claims reviewed: 12 verified, 2 can't verify, 1 incorrect, 5 not
reviewed”. The actions are a `toolbar` named “Manifest actions”.

## Content

- Give the exact model id in `modelId` (a dated version, not a family name), and the friendly name in `model`.
- Pass the time already formatted, with its time zone: “Oct 24, 14:02 UTC”.
- Name sources as people know them, and use `detail` for what makes them reproducible – a count, a version, when they
  were indexed.
- Keep the intent in the person's own words; don't rewrite it into a summary.
- Rename what's verified with `noun` (“findings”) and the states with `stateLabels`.

## Do

- Export the record the event hands you – it is the same data the card shows.
- Show the manifest while claims are still under review; the summary updates as they are reviewed.
- Prevent `tc-copy` when the app has its own clipboard handling, and copy `detail.text`.

## Don't

- Don't leave out the hash or the settings to save space – without them the run can't be repeated.
- Don't put secrets in the settings; everything here is copied and exported.
- Don't use it as a log of everything the run did – keep it to what reproducing the run needs.

## Example

```html
<tc-run-manifest id="manifest" model="Opus 5.5" timestamp="Oct 24, 14:02 UTC"></tc-run-manifest>

<script type="module">
  import "trenchcoat/run-manifest";
  import "trenchcoat/tokens.css";

  const manifest = document.querySelector("#manifest");
  manifest.runId = "run_8f2c41d07a";
  manifest.modelId = "claude-opus-5-5-20261001";
  manifest.settings = [
    { label: "Temperature", value: "0.2" },
    { label: "Seed", value: "118734" },
  ];
  manifest.instructionLabel = "Supplier risk analyst · v4";
  manifest.instructionHash = "sha256:3f9a2c71d0e4b6a85c19f2e7d4a0b3c6e81f5d9a7b2c4e60f1a3d8b5c7e9b81e";
  manifest.sources = [{ id: "contracts", label: "Supplier contracts", detail: "1,204 documents" }];
  manifest.intent = "Which suppliers carry a risk we should act on this quarter?";
  manifest.verification = { verified: 12, unverifiable: 2, pending: 4 };
  manifest.addEventListener("tc-export", (e) => console.log(JSON.stringify(e.detail.manifest)));
</script>
```

```tsx
import { RunManifest, type RunManifestRecord } from "trenchcoat/react";
import "trenchcoat/tokens.css";

function download(record: RunManifestRecord) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${record.runId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RunRecord() {
  return (
    <RunManifest
      runId="run_8f2c41d07a"
      timestamp="Oct 24, 14:02 UTC"
      model="Opus 5.5"
      modelId="claude-opus-5-5-20261001"
      settings={[{ label: "Temperature", value: "0.2" }]}
      instructionHash="sha256:3f9a2c71d0e4b6a85c19f2e7d4a0b3c6e81f5d9a7b2c4e60f1a3d8b5c7e9b81e"
      sources={[{ id: "contracts", label: "Supplier contracts", detail: "1,204 documents" }]}
      intent="Which suppliers carry a risk we should act on this quarter?"
      verification={{ verified: 12, unverifiable: 2, pending: 4 }}
      onExport={download}
    />
  );
}
```
