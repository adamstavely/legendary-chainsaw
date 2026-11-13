---
pattern: list
status: new
related: email-draft, todo-list, travel-itinerary, structured-output
---

## Overview

A recipe an assistant wrote, laid out to cook from. The header has the recipe's name, a line about it and the prep
and cook times. Under it, a servings stepper scales every quantity, and Metric / Imperial converts weights, volumes
and the oven temperatures in the steps. The ingredients are a checklist to tick off while shopping or measuring; the
method is a numbered list with the current step marked. A step that names a time ("Simmer for 15 minutes") gets a
timer with a live countdown, which is announced when it's done.

Quantities are shown as cooks write them – ½, 1⅓, 250 g – and read as words: "1 and 1/3".

## When to use

- The result of a recipe or meal-planning tool in an assistant.
- Any set of steps with quantities to scale and timers to run.

## When not to use

- A plain list of things to do – use [To-do List](#/todo-list).
- Free-form structured data from a model – use [Structured Output](#/structured-output).
- A draft for someone to review and send – use [Email Draft](#/email-draft).

## Anatomy

1. **Times** `.ui-rcpe__times` – prep and cook time, beside the heading
2. **Servings** `.ui-rcpe__servings` – the stepper; quantities scale to it
3. **Units** `.ui-rcpe__units` – Metric or Imperial
4. **Ingredient** `.ui-rcpe__ingredient` – a check box, the scaled quantity, the name and a note
5. **Step** `.ui-rcpe__step` – its number (pick it to make it current) and its words
6. **Timer** `.ui-rcpe__timer` – Start, Pause or Resume, the countdown and Reset

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first
row. Wide, the ingredients sit beside the method; narrow, above it. The current step has a tinted background with an
accent edge and a filled number. Ticked ingredients are struck through in a muted colour.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the stepper, the units, the ingredients, the steps' numbers and timers |
| Space on an ingredient | Ticks it off, or back |
| ← / → on the units | Metric or Imperial |
| Enter / Space on a step's number | Makes it the current step |
| Enter / Space on a timer | Starts, pauses or resumes it |

## Screen readers

- The servings stepper is a group named "Servings"; its buttons say "Fewer servings" and "More servings", and the new
  count is announced.
- Each quantity is read in words ("1 and 1/3 cups"), not as a fraction glyph.
- The current step carries `aria-current="step"`; each number is a toggle button, "Step 2".
- A running countdown is a `timer` (not read aloud each second). Starting, pausing, resetting and finishing a timer
  are announced in a polite status line: "Timer done: step 4, Simmer for 15 minutes".

## Content

- Give quantities for `base-servings` and let the stepper do the maths; leave `quantity` out for "to taste".
- Use the units the card converts – g, kg, ml, l, oz, lb, fl oz, cup – for weights and volumes; tsp, tbsp and counts
  stay as they are.
- Write times into the steps in words ("for 15 minutes", "25–30 minutes") and temperatures as "200°C"; give a step's
  `timer` in seconds when its words name no time or another one.
- One action per step, starting with a verb.

## Do

- Start on the servings the person asked for (`servings`) and keep the recipe's own in `base-servings`.
- Keep `units` with the person's other preferences.

## Don't

- Round quantities yourself – the card rounds for the units shown.
- Put several timed actions in one step; each step gets one timer.

## Example

```html
<tc-recipe-card heading="Squash and chickpea curry" prep-minutes="15" cook-minutes="40" base-servings="4"></tc-recipe-card>
<script type="module">
  const card = document.querySelector("tc-recipe-card");
  card.ingredients = [
    { quantity: 500, unit: "g", name: "butternut squash", note: "in 2 cm cubes" },
    { quantity: 400, unit: "ml", name: "coconut milk" },
    { name: "salt and pepper" },
  ];
  card.steps = ["Roast the squash at 200°C for 25 minutes.", "Simmer everything for 15 minutes, then season."];
</script>
```

```tsx
import { useState } from "react";
import { RecipeCard, type RecipeUnits } from "@adamstavely/trenchcoat/react";

export function Lunch() {
  const [units, setUnits] = useState<RecipeUnits>("metric");
  return (
    <RecipeCard
      title="Squash and chickpea curry"
      baseServings={4}
      defaultServings={6}
      units={units}
      onUnitsChange={setUnits}
      ingredients={[{ quantity: 400, unit: "ml", name: "coconut milk" }]}
      steps={["Simmer for 15 minutes."]}
      onTimerDone={(step) => console.log(`Step ${step + 1} is done`)}
    />
  );
}
```
