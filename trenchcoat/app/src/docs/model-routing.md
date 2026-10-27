---
pattern: none
status: new
related: model-picker, model-settings, provider-connection, budget-guard
---

## Overview

Shows how requests are routed between models as a route: rules in order, each with its conditions and the model it
sends to, then the fallback chain a request takes when no rule matches or a target is unavailable. Each target shows
the health and circuit-breaker state the app reports and the region it runs in; with `residency` set, a target
outside the allowed regions is flagged. Test a route asks the app where a request would go and lights up the path
it took – the rules it passed, the one that matched, the targets it skipped and where it ended up – with the app's
reasons. People reorder rules and fallbacks by dragging or with the keyboard. The component routes nothing itself.

## When to use

- An operations or settings view of a model router, so a team can see and change what goes where.
- Checking a routing change before it ships: test a few typical requests and read the path each one takes.
- Showing where a request will land while a provider is degraded or a breaker is open.

## When not to use

- Picking one model for a conversation – use `model-picker`.
- Tuning how one model generates – use `model-settings`.
- Connecting a provider and testing its credentials – use `provider-connection`.

## Anatomy

1. **Header** `.tc-head` – a route icon, the title, rule and fallback counts, the allowed regions and overall health
2. **Rule** `.ui-mrt__rule` – a numbered rule: its conditions, then the target it sends to
3. **Rail** `.ui-mrt__rail` – the line through every step that lights up along a tested route
4. **Target** `.ui-mrt__target` – a model with its region, health, breaker state and note
5. **Fallback chain** `.ui-mrt__otherwise` – the targets tried in order when no rule takes the request
6. **Route test** `.ui-mrt__test` – a request to try and the app's explanation of where it went

## Looks

Standard is a white card on a gray tray: rules sit on gray rows with ink number badges and raised target chips.
Clean is one white card with hairline-outlined rules and targets, outlined numbers and caption-style section labels.
In both, a tested route turns the rail and the taken step to the accent, and the steps it never reached go quiet. In
a narrow container a rule's target drops under its conditions and the health pill is hidden.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each rule's handle and Remove, the chain's handles and Removes, Add a fallback, the test field and Test |
| ↑ / ↓ | On a handle: moves that rule or fallback one place earlier or later |
| ← / → | On a fallback's handle: moves it one place earlier or later |
| Home / End | On a handle: moves it to the start or the end |
| Enter | In the test field: runs the test |
| Space / Enter | On Remove or Test: does it |

Focus stays on the handle after a move. Add a fallback is a native select.

## Screen readers

The host is a group named by the heading. The rules and the chain are ordered lists named “Rules, first match wins”
and “Otherwise, try in order”; each rule reads its conditions, then “send to” and the target with its status and
breaker state. A handle is named “Move Long inputs, position 1 of 3” and described by “Arrow keys move it; Home and
End move it to the start or end.” A status region says where an item went – “Long inputs moved to position 2 of 3”
– and what was removed or added. The test result is a polite status region: “Asking where “…” would go…”, then the
verdict – “Long inputs matched, so it goes to Atlas 2.” – and the app's reasons as a numbered list.

## Content

- Write conditions the way the router checks them: “Input is over 100k tokens”, “Plan is Enterprise”.
- Name rules for their purpose – “Long inputs”, “Quick lookups” – so the test verdict reads well.
- Make each health `note` say why: “Opened 3 min ago after 5 timeouts”, not only “Open”.
- Write `reasons` in the order the router decided, one fact per line.

## Do

- Answer `tc-route-test` from the same router code that serves real requests, so the path shown is the real one.
- Keep `health` live; the breaker state is what people check first during an incident.
- Set `residency` when data must stay in a region, and still enforce it in the router.

## Don't

- Don't compute a route in the page to fill `testResult` – the component shows the app's decision, not its own.
- Don't put more than a handful of targets in the fallback chain; every step adds latency to a failing request.
- Don't hide a target that's down; show its state so people understand why requests went elsewhere.

## Example

```html
<tc-model-routing id="routing"></tc-model-routing>

<script type="module">
  import "trenchcoat/model-routing";
  import "trenchcoat/tokens.css";

  const routing = document.querySelector("#routing");
  routing.targets = [
    { id: "long", label: "Atlas Long", region: "EU" },
    { id: "main", label: "Atlas 2", region: "EU" },
  ];
  routing.value = { rules: [{ id: "r1", name: "Long inputs", conditions: ["Input is over 100k tokens"], target: "long" }], fallbacks: ["main"] };
  routing.health = { long: { status: "down", breaker: "open" }, main: { status: "healthy" } };
  routing.addEventListener("tc-route-test", async (e) => {
    routing.testResult = await fetch("/route-test", { method: "POST", body: e.detail.input }).then((r) => r.json());
  });
</script>
```

```tsx
import { useState } from "react";
import { ModelRouting, type ModelRoutingValue, type RouteTestResult } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const targets = [
  { id: "long", label: "Atlas Long", region: "EU" },
  { id: "main", label: "Atlas 2", region: "EU" },
];

export function Routing() {
  const [value, setValue] = useState<ModelRoutingValue>({ rules: [{ id: "r1", name: "Long inputs", conditions: ["Input is over 100k tokens"], target: "long" }], fallbacks: ["main"] });
  const [result, setResult] = useState<RouteTestResult | null>(null);
  return (
    <ModelRouting
      targets={targets}
      value={value}
      onChange={setValue}
      residency={["EU"]}
      testResult={result}
      onTest={(input, routing) =>
        fetch("/route-test", { method: "POST", body: JSON.stringify({ input, routing }) })
          .then((r) => r.json() as Promise<RouteTestResult>)
          .then(setResult)
      }
    />
  );
}
```
