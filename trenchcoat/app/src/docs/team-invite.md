---
pattern: none
status: stable
related: agent-team, logo-cluster, project-flow
---

## Overview

A small scene about bringing someone onto a team: two teammates are connected, an empty dashed slot waits next to
them, and a cursor drags a third teammate into it. The new avatar lands, the dashed line turns solid and their status
dot lights up – then the scene starts over, and after the third time it stays on the finished team. With reduced
motion it shows a still frame of the waiting team. It gives an invite screen or an empty team page a friendly, wordless picture of what happens next.

## When to use

- An empty state for a team, workspace or project with nobody invited yet.
- Next to an invite form or link, to show what inviting does.
- Onboarding steps and marketing pages about collaboration.

## When not to use

- Showing several AI agents working together – use `agent-team`.
- Showing the tools or companies a product works with – use `logo-cluster`.
- A list of the real people on a team with their roles – show avatars with names, not an illustration.

## Anatomy

1. **Teammate** `.ui-ti-node--a` – one of the two avatars already on the team, with its status dot
2. **Empty slot** `.ui-ti-slot` – the dashed circle with a plus, where the new teammate lands
3. **New teammate** `.ui-ti-node--c` – the third avatar, dragged in by the cursor

## Screen readers

With names on the avatars, or a `label`, the whole scene is one image with a description – “Maya Kim and Jonas Ortiz
are connected; Priya Shah is dragged into the empty slot and joins the team”. Without either it is decorative and
hidden from assistive technology. Nothing in it can be operated.

## Content

- Use square portraits – they are shown in circles; initials on a colour work as well as photos.
- Give `name`s only when they are real people the viewer knows; otherwise leave the scene decorative, or pass a
  `label` that says what it means: “Invite teammates to work with you”.

## Do

- Use the people the viewer will actually invite, or neutral placeholders – not stock photos of strangers.
- Let it sit beside the invite action, so the picture and the button tell the same story.

## Don't

- Don't use the avatars to stand for specific people the page doesn't name elsewhere.
- Don't rely on the scene to explain inviting – say it in words next to it too.

## Example

```html
<tc-team-invite id="invite" label="Invite teammates to work with you"></tc-team-invite>

<script type="module">
  import "trenchcoat/team-invite";

  document.querySelector("#invite").avatars = [
    { src: "/avatars/maya.webp" },
    { src: "/avatars/jonas.webp" },
    { src: "/avatars/priya.webp" },
  ];
</script>
```

```tsx
import { TeamInvite } from "trenchcoat/react";

export function EmptyTeam() {
  return (
    <TeamInvite
      label="Invite teammates to work with you"
      avatars={[
        { src: "/avatars/maya.webp", name: "Maya Kim" },
        { src: "/avatars/jonas.webp", name: "Jonas Ortiz" },
        { src: "/avatars/priya.webp", name: "Priya Shah" },
      ]}
    />
  );
}
```
