---
pattern: radio
status: new
related: segmented-control, button, billing-schedule, usage-meter
---

## Overview

A pricing section for a landing or upgrade page: a heading, a Monthly / Yearly switch and a card per plan. Each card
shows the plan's name and price per month, its limits, a call to action and collapsible details – the integrations it
syncs and what's included. Switching the period rolls the prices' digits; the details open and close for every card
together, so the rows stay aligned. Three cards sit side by side on wide containers and stack below 860 px.

## When to use

- Comparing two to four plans that share the same limits and features.
- An upgrade page where the billing period changes the price.

## When not to use

- Showing what an account will be charged and when – use `billing-schedule`.
- How much of a plan has been used – use `usage-meter`.
- A single choice between two options anywhere else – use `segmented-control`.

## Anatomy

1. **Heading** `.ui-pp__title` and **subtitle** `.ui-pp__subtitle`
2. **Billing switch** `.ui-pp__switch` – the library's segmented control
3. **Card** `.ui-pp__card` – one per plan; a soft accent ring when it has a badge
4. **Badge** `.ui-pp__badge` – e.g. “Popular”
5. **Price** `.ui-pp__amount` – with rolling digits `.ui-pp__digit` after a switch
6. **Limits** `.ui-pp__limits` – icon, label and value rows
7. **Call to action** `.ui-pp__cta` – a primary button
8. **Details toggle** `.ui-pp__toggle` – Show / Hide details
9. **Details** `.ui-pp__details` – the integrations `.ui-pp__apps` and the features `.ui-pp__features`

## Looks

The section sits on the sunken surface with white cards in both looks; the switch and the buttons follow the look
(Clean's are smaller and flatter). Component tokens on the element: `--tc-pp-max` (the plans' width, 1152 px),
`--tc-pp-pad-top` / `--tc-pp-pad-bottom` and the featured card's `--tc-pp-featured-border` / `--tc-pp-featured-glow`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the billing switch, then through each card's call to action and details toggle |
| ← / → | In the switch, picks Monthly or Yearly |
| Enter / Space | Presses the focused button |

## Screen readers

The switch is a `radiogroup` named “Billing period” (rename it with `billing-label`). A rolling price is read once, as
text (“$29”); the rolling digits are hidden. The details toggle reports `aria-expanded` and controls its region, which
is `inert` while closed. Included and missing features are marked with “(included)” and “(not included)”, and each
integration tile has its name as text.

## Content

- Prices are per month in both periods; a yearly price is the monthly cost when billed yearly.
- Keep limit labels the same across plans so the rows line up.
- Use a badge on at most one plan.
- `cta` defaults to “Start free trial” – say what happens next.

## Do

- Handle `tc-plan-select` to start checkout with the plan and period.
- Default to the period most people should choose.

## Don't

- Don't put more than four plans in one section.
- Don't hide a plan's most important limit in the details.

## Example

```html
<tc-pricing-plans id="pricing" billing="monthly"></tc-pricing-plans>

<script type="module">
  import "trenchcoat/pricing-plans";
  import "trenchcoat/tokens.css";

  const pricing = document.querySelector("#pricing");
  pricing.addEventListener("tc-plan-select", (e) => console.log(e.detail.plan.id, e.detail.billing));
</script>
```

```tsx
import { useState } from "react";
import { PricingPlans, VisitorsIcon, type PricingBilling, type PricingPlan } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const plans: PricingPlan[] = [
  {
    id: "team",
    name: "Team",
    price: { monthly: 49, yearly: 39 },
    limits: [{ icon: <VisitorsIcon />, label: "Monthly visitors", value: "50k" }],
    sync: "Hourly",
    pick: 3,
    features: [{ label: "API access", included: true }],
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<PricingBilling>("yearly");
  return <PricingPlans plans={plans} billing={billing} onBillingChange={setBilling} onPlanSelect={(plan, period) => console.log(plan.id, period)} />;
}
```
