---
pattern: toolbar
status: new
related: agent-cursors, handoff, sandbox-log, agent-steering
---

## Overview

Lets people watch an agent's screen while it browses or uses a computer for them. The stream is the app's – an image
per frame, a video or canvas, or anything slotted in – and the element draws what the agent does on top: one pointer
that glides from action to action, a ring where it clicks, the text it types and the keys it presses on a small flag,
and the direction it scrolls. A caption under the screen says which step it's on. In the header, the state reads
Live, Paused or “You're in control”, with Pause and Take over at hand at every moment.

## When to use

- An agent acting in a browser or on a desktop for someone – booking, filling forms, clicking through a site.
- When people need to see what the agent is doing and step in before it does the wrong thing.
- Handing the screen to a person mid-run, with their clicks forwarded to the agent's browser.

## When not to use

- Showing several people's or agents' pointers on a shared canvas – use `agent-cursors`.
- An agent stopping to hand a decision or a task to a person, without a screen – use `handoff`.
- Command-line work in a sandbox – use `sandbox-log`.
- Redirecting an agent with instructions while it runs – use `agent-steering`.

## Anatomy

1. **State** `.ui-lv__state` – Live, Paused, You're in control, Finished or Connecting
2. **Title** `.ui-lv__title` – what the agent is doing overall
3. **Toolbar** `.ui-lv__tools` – Pause or Resume, and Take over or Hand back
4. **Screen** `.ui-lv__screen` – the stream, in the frame's shape
5. **Pointer** `.ui-lv__ptr` – the agent's pointer, which glides to each action and presses in on a click
6. **Flag** `.ui-lv__flag` – the agent's name, what it types, the keys or the scroll
7. **Caption** `.ui-lv__cap` – “Step 4 of 9” and what the step is

## Looks

Standard sets the header and the caption on a gray tray with the screen on a white card between them; Pause and Take
over are small secondary and primary buttons. Clean has no tray: one white card with the header inside it, the screen
inset with smaller corners, and default-size buttons. In a container under 380px wide both hide the title and show
the buttons as icons only, and the caption stacks under the step number.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the toolbar (one tab stop) and out of it |
| ← / → / ↑ / ↓ | In the toolbar: moves between Pause and Take over, wrapping round |
| Home / End | In the toolbar: moves to the first or last button |
| Enter / Space | Pauses or resumes; takes over or hands back |

While a person has control, clicks on the screen are reported with `tc-screen-click`; the element doesn't forward
keys, so an app that lets people type into the agent's browser handles that itself.

## Screen readers

The screen is a group with the role description “live view”, named “The agent's screen – Book a table for 4”; an
image frame is described by `alt`. The pointer, the flag, the click ring and the on-screen badge are hidden. The
toolbar is named “Live view”. A polite status region reads each new step – “Step 4 of 9: Picking a date” – and each
change of who drives: “Paused.”, “You're in control. The agent waits until you hand back.”, “The agent is working
again.” and, at the end, “Finished.” followed by the last caption.

## Content

- Write `heading` as the task in the person's words: “Book a table for 4 at Lupa, Friday 7 PM”.
- Write each action's `caption` as what the step does, in the present: “Picking a date”, “Taking the 7:00 PM table”.
- Set `agent` to the agent's name if more than one could be acting; the flag then always shows it.
- Give `alt` a description of the frame when you pass `src`: “The reservations page for Lupa Osteria”.

## Do

- Keep `actions` to the last few – the element shows only the latest, and the pointer glides to it.
- Give `frameWidth` and `frameHeight` when the actions' coordinates come from a known viewport; the screen takes that
  shape.
- Stop the agent when `tc-paused-change` or `tc-control-change` says so, and only resume when it changes back.
- Set `ended` when the run finishes, so the toolbar and the pointer go.

## Don't

- Don't send a stream of a different shape from the frame: it's letterboxed, and actions land on the frame, not on the
  picture.
- Don't take control away from someone who pressed Take over without telling them – the state still says it's theirs.
- Don't use it as a recording player; it shows the latest frame and the latest action only.

## Example

```html
<tc-live-view id="live" frame-width="960" frame-height="600" agent="Operator" step="4" steps="8"></tc-live-view>

<script type="module">
  import "trenchcoat/live-view";
  import "trenchcoat/tokens.css";

  const view = document.querySelector("#live");
  view.heading = "Book a table for 4 at Lupa, Friday 7 PM";
  view.src = "/frames/latest.png";
  view.alt = "The reservations page for Lupa Osteria";
  view.actions = [{ id: "a1", kind: "click", x: 210, y: 288, caption: "Picking Friday, October 30" }];
  view.addEventListener("tc-control-change", (e) => console.log(e.detail.control));
</script>
```

```tsx
import { useState } from "react";
import { LiveView, type LiveViewAction, type LiveViewControl } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function AgentScreen({ frame, actions }: { frame: string; actions: LiveViewAction[] }) {
  const [paused, setPaused] = useState(false);
  const [control, setControl] = useState<LiveViewControl>("agent");
  return (
    <LiveView
      title="Book a table for 4 at Lupa, Friday 7 PM"
      agent="Operator"
      src={frame}
      frameWidth={960}
      frameHeight={600}
      actions={actions}
      step={4}
      steps={8}
      paused={paused}
      onPausedChange={setPaused}
      control={control}
      onControlChange={setControl}
      onScreenClick={(point) => console.log(point.x, point.y)}
    />
  );
}
```
