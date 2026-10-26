---
pattern: none
status: stable
related: integration-flow, outreach-branches, agent-team
---

## Overview

An animated illustration of a piece of client work being broken down: a task card (“Task: Web Design”) branches
into its subtasks, the client's notes, the roles assigned to it and the tech stack it uses, and the cards build up
one after another. It shows in one picture how a product turns a request into organised, owned work. The scene
scales to the width of its container and follows the page theme, with a light and a dark version.

## When to use

- A landing page or feature section about project planning, task breakdown or team assignment.
- An empty state or onboarding step that explains what a project workspace will hold.
- Beside copy about turning client requests into tasks.

## When not to use

- Showing tools connecting to one another – use `integration-flow`.
- Showing one message branching into several follow-ups – use `outreach-branches`.
- Showing a team of agents working together – use `agent-team`.
- Showing someone's real project – use `project-card`, which renders your own data; the scene's content is fixed.

## Screen readers

Without `label` the illustration is decorative: the element is `aria-hidden` and screen readers skip it. With
`label` it becomes an image (`role="img"`) named by that text – give it one when the picture carries meaning the
surrounding copy doesn't. With reduced motion the finished scene shows at once; the build-up also waits while the
scene is off screen or the tab is hidden.

## Content

- Write `label` as what the picture shows: “A task with subtasks, client notes, assigned roles and its tech stack”.
- Leave `label` off when the heading and text next to it already say the same thing.

## Do

- Set `--tc-project-flow-fade` to your page's background colour so the scene's edges fade into it.
- Let it follow the page theme; set `theme` only where the scene sits on a surface of the opposite colour.
- Insert a new element to replay the build-up, for example when a carousel slide comes back.

## Don't

- Don't squeeze it into a narrow column – the cards scale with the width and their text gets too small to read.
- Don't present it as a working component; people will try to click the cards.

## Example

```html
<tc-project-flow id="scene"></tc-project-flow>

<script type="module">
  import "trenchcoat/project-flow";
  import "trenchcoat/tokens.css";

  const scene = document.querySelector("#scene");
  scene.label = "A task with subtasks, client notes, assigned roles and its tech stack";
  scene.style.setProperty("--tc-project-flow-fade", "#fafafa");
</script>
```

```tsx
import { ProjectFlow } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PlanningHero() {
  return <ProjectFlow label="A task with subtasks, client notes, assigned roles and its tech stack" />;
}
```
