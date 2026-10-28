---
pattern: form
status: new
related: trigger-builder, search-history, gate-config, ai-search
---

## Overview

The form that sets up a routine: a saved search or prompt that runs on a schedule and reports back. It asks for a name;
how often it runs – hourly, daily, on weekdays, weekly on a day or monthly on a date – and at what time, in the page's
time zone; whether the first run waits for the schedule or goes right away; when to send an email; and the instructions
each run follows. Under the start time it shows the time zone and works out the next run (“Next run: Thu, Oct 29, 1:45
PM”). Dismiss and Create routine sit at the foot – Save routine when editing one that exists.

## When to use

- Turning a saved search or a research question into something that runs every week.
- Editing a routine's schedule, notifications and instructions in one place.
- Anywhere a person sets up recurring work for an assistant and needs to see when it next runs.

## When not to use

- Automations that start on an event, or that need conditions – use `trigger-builder`.
- Picking from searches someone already ran – use `search-history`, whose Schedule action can open this form.
- Approval rules for an agent – use `gate-config`.

## Anatomy

1. **Header** `.tc-head` – the clock icon, the heading, and the description with the Routines link `.ui-rtn__link`
2. **Row** `.ui-rtn__row` – a label on the left `.ui-rtn__label`, the control on the right `.ui-rtn__control`
3. **Select** `.ui-rtn__select` – frequency, the day, the email setting: a native select drawn as a field
4. **Start time** `.ui-rtn__start` – the day of the week or month beside the time, or the minute for hourly routines
5. **Next run** `.ui-rtn__next` – the next run in the routine's time zone, under the time zone `.ui-rtn__hint`
6. **First run** `.ui-rtn__seg` – At scheduled time or Right away
7. **Instructions** `.ui-rtn__instructions` – what each run does
8. **Error** `.ui-rtn__error` – under a required field that's empty
9. **Foot** `.ui-rtn__foot` – Dismiss `.ui-rtn__dismiss` and the main button `.ui-rtn__submit`

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Below about 520 px the labels move above their controls; below about 340 px the day and the time stack
and the two buttons share the foot. The label column's width is `--tc-rtn-label-w`.

## Keyboard

Every control is a native input, select or button, and First run is a `segmented-control`, so the browser's own keys
work.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the fields, then Dismiss and Create routine |
| ↑ / ↓ on a select | Changes it |
| ← / → on First run | Switches between At scheduled time and Right away |
| Enter in a text field | Creates the routine, as the main button does |

## Screen readers

The form is named by its heading, and each field by its label; the day and time are a group named “Start time”. The
next run is a polite live region, so changing the schedule reads the new time. A required field that's empty is marked
invalid and described by its error. Pressing Create with fields missing announces how many and what they need, and
moves focus to the first. Creating says “Routine created” with the next run.

## Content

- Name the routine for what it watches: “Coral bleaching study updates”, not “Weekly routine”.
- Write instructions as a brief for each run: what to look for, what counts as new, how to report it, and what to say
  when nothing is.
- Set `timeZone` to the person's own zone, so the time they pick is the time it runs.

## Do

- Keep `value` in your store and save it from tc-submit; set `busy` while the save is under way.
- Start from the search: fill the name and instructions from the saved search that opened the form.
- Use `nextRoutineRun()` on the server to schedule the same time the form shows.

## Don't

- Don't hide the time zone – a routine that runs at the wrong hour is worse than none.
- Don't rename the main button to something vague like “OK” – say what happens.

## Example

```html
<tc-routine-form id="routine" time-zone="America/Los_Angeles" routines-href="/routines"></tc-routine-form>

<script type="module">
  import "trenchcoat/routine-form";
  import "trenchcoat/tokens.css";

  const form = document.querySelector("#routine");
  form.value = { ...form.value, name: "Coral bleaching study updates", weekday: 4, time: "13:45" };
  form.addEventListener("tc-submit", (e) => console.log("create", e.detail.value, new Date(e.detail.nextRun)));
  form.addEventListener("tc-dismiss", () => form.remove());
</script>
```

```tsx
import { useState } from "react";
import { RoutineForm, emptyRoutine, type RoutineDraft } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function NewRoutine({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState<RoutineDraft>({ ...emptyRoutine(), name: "Coral bleaching study updates" });
  return (
    <RoutineForm
      value={value}
      onValueChange={setValue}
      timeZone="America/Los_Angeles"
      onCreate={(draft, nextRun) => console.log("create", draft, nextRun)}
      onDismiss={onClose}
    />
  );
}
```
