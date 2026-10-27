---
pattern: dialog
status: new
related: run-compare, eval-scorecard, approval-card, gate-config
---

## Overview

A configuration version – instructions, model, tools and retrieval together – on its way from draft to production.
The pipeline shows every environment with the version it runs and any rollout in progress, and the gate on the edge
into the next environment says what promotion still needs: an evaluation that meets its threshold and enough
approvals. Below it, what changed, the evidence against the version it would replace, and who has reviewed. Promote
and Roll back both ask first and name exactly what moves. The element deploys nothing: it tells the app, which does
the work and sends back the new state.

## When to use

- Releasing a whole AI configuration through environments, where a person signs off on evidence before production.
- A release page that needs promotion and rollback in one place, with the rollback target always visible.
- Showing a staged rollout as it happens, with the stage marked "Requested" until the app reports the move.

## When not to use

- Reviewing the full diff between two versions – use `run-compare`, and open it from Compare.
- Showing evaluation results in detail – use `eval-scorecard`.
- Approving one action an agent is about to take – use `approval-card`.
- Setting when a run pauses for a person – use `gate-config`.

## Anatomy

1. **Stage** `.ui-rls__stage` – an environment, the version it runs and any rollout in progress
2. **Gate** `.ui-rls__gate` – on the edge into the target stage: each requirement, met or not
3. **Promote** `.ui-rls__promote` – unavailable until every requirement is met; asks first
4. **Evidence** `.ui-rls__blocks` – what changed, the evaluation against the current version, the approvals
5. **Compare** `.ui-rls__compare` – asks the app to open the full diff
6. **Rollback target** `.ui-rls__rollback` – the stage and version Roll back returns to

## Looks

Standard is a white card on a gray tray: the stages are filled tiles joined by chevrons, the target outlined, and the
gate a raised tile between them with a coloured rule – amber while blocked, green when ready, blue while moving. Clean
is one white card: the stages sit on a quiet track with dots, the gate is a hairline box on it, and the evidence is
three columns between hairlines, with quieter text and thinner icons. Narrow, the pipeline runs down the card in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Promote, Compare and Roll back |
| Enter / Space | On Promote, opens the confirmation when it's ready (otherwise says what's missing); on Roll back, opens its confirmation; on Compare, asks for the diff |

In a confirmation, focus starts on Cancel:

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between Cancel and the confirm button, wrapping inside the dialog |
| Enter / Space | On the confirm button, confirms; on Cancel, closes |
| Escape | Closes without doing anything |

Closing either way returns focus to the button that opened the dialog.

## Screen readers

The pipeline is a list named “Pipeline”; the gate is an item in it named by its heading, “Gate to Production”. Each
requirement reads its state with it – “Evaluation, met: 93.8% · needs 92%”, “Approvals, not met: 1 of 2 approvals”.
Promote is `aria-disabled` until every requirement is met and is described by the gate's line, for example “To
promote: 1 of 2 approvals.”; pressing it then announces “Can't promote yet: 1 of 2 approvals.” A rollout reads “v14 on
25% of traffic”. The evidence blocks are sections named by their headings, with “– met” or “– not met” after
Evaluation and Approvals. Roll back is named in full: “Roll back Production to v12”. The confirmations are modal
`alertdialog`s named by their question (“Promote v14 to Production?”) and described by the move. A polite status
message confirms “Promotion of v14 to Production requested.”

## Content

- Name versions short (“v14”) and give each a `title` that says what changed for people: “Shorter refund answers”.
- Count changes in units a reviewer understands – edited lines, tools added – and put the detail in `detail`.
- Set `threshold` to the pass rate your release policy needs, and give `baseline` from the same suite, so the
  comparison is fair.
- Use `hold` for a reason that stops every promotion, in a full sentence: “Releases are frozen until Monday.”
- Say what promotion and rollback actually do in `promoteNote` and `rollbackNote` – whether traffic moves at once or in
  steps, and what isn't undone.

## Do

- Enforce the gate on your server too. The element's gate is a guide for people, not access control.
- Answer `tc-promote` and `tc-rollback` with new `stages`; the "Requested" mark stays until the stage changes.
- Call `preventDefault()` on the event when the request can't start, so nothing is marked as requested.
- Keep the rollback target current after every release, so Roll back always names the version it returns to.

## Don't

- Don't show a stage as moved before your deployment reports it.
- Don't embed the full diff here; open `run-compare` from Compare.
- Don't lower the threshold to get a release through – change the policy where it lives.

## Example

```html
<tc-configuration-release-control id="release" candidate="v14" required-approvals="2"></tc-configuration-release-control>

<script type="module">
  import "trenchcoat/configuration-release-control";
  import "trenchcoat/tokens.css";

  const release = document.querySelector("#release");
  release.versions = [
    { id: "v13", label: "v13", title: "Policy-grounded answers" },
    { id: "v14", label: "v14", title: "Shorter refund answers" },
  ];
  release.stages = [
    { id: "staging", label: "Staging", version: "v14" },
    { id: "production", label: "Production", version: "v13" },
  ];
  release.evidence = { passRate: 93.8, baseline: 91.2, threshold: 92, cases: 412 };
  release.approvals = [{ id: "p", name: "Priya Shah", state: "approved" }];
  release.rollback = { stage: "production", version: "v13" };
  release.addEventListener("tc-promote", (e) => {
    fetch("/api/releases", { method: "POST", body: JSON.stringify({ version: e.detail.version.id, stage: e.detail.stage.id }) });
  });
</script>
```

```tsx
import { ConfigurationReleaseControl, type ReleaseStage, type ReleaseVersion } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Release({ stages, versions, promote }: { stages: ReleaseStage[]; versions: ReleaseVersion[]; promote: (version: string, stage: string) => Promise<void> }) {
  return (
    <ConfigurationReleaseControl
      stages={stages}
      versions={versions}
      candidate="v14"
      evidence={{ passRate: 93.8, baseline: 91.2, threshold: 92 }}
      approvals={[{ id: "p", name: "Priya Shah", state: "approved" }]}
      rollback={{ stage: "production", version: "v13" }}
      onPromote={(request) => void promote(request.version.id, request.stage.id)}
    />
  );
}
```
