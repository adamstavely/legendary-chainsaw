---
pattern: none
status: stable
related: outreach-branches, team-invite, integration-flow
---

## Overview

A short scene for “one prompt sets up a team of agents”. A prompt types itself into a pill and is sent; dashed lines
branch out from it to three agents, who pop in one after another with a portrait, a role and up to two tool logos.
The scene plays three times and then rests on the finished team. It plays only while it is on screen and the tab is
visible, and starts over when it comes back; with reduced motion it shows the finished team straight away.

## When to use

- A landing page or onboarding step that explains multi-agent setup in one picture.
- The empty state of a screen where people create an agent team.

## When not to use

- Showing a real team's live work – use `agent-lanes` or `agent-graph`.
- Inviting people (not agents) to a workspace – use `team-invite`.
- Showing one message fanning out to several channels – use `outreach-branches`.

## Anatomy

1. **Prompt** `.ui-at-prompt` – the pill the prompt types itself into, with the send button
2. **Lines** `.ui-at-lines` – the dashed branches from the prompt to each agent
3. **Agent** `.ui-at-agent` – a portrait with an online dot
4. **Role** `.ui-at-role` – the agent's role and its tool logos

## Keyboard

There is nothing to operate: the scene takes no focus and handles no keys.

## Screen readers

The host is an image (`role="img"`). Its name is `label` when set; otherwise it's built from the prompt and the roles
– “A prompt – “Build a team to work my inbound pipeline” – builds a team of three agents: Researcher, SDR, Ops”. The
typing and the agents themselves are hidden, so the name is read once and the animation adds nothing to it.

## Do

- Give exactly three `members`, left to right; the React wrapper's type asks for three.
- Use square portraits – they are cropped to a circle.
- Keep the prompt to one short line; it doesn't wrap.

## Don't

- Don't give an agent more than two `tools`: only the first two are drawn.
- Don't rely on the animation to say anything the text around it doesn't – most people see it once.

## Example

```html
<tc-agent-team id="team"></tc-agent-team>

<script type="module">
  import "trenchcoat/agent-team";
  import "trenchcoat/tokens.css";

  const team = document.querySelector("#team");
  team.prompt = "Build a team to work my inbound pipeline";
  team.members = [
    { role: "Researcher", avatar: "/avatars/researcher.webp", tools: ["linkedin"] },
    { role: "SDR", avatar: "/avatars/sdr.webp", tools: ["gmail", "hubspot"] },
    { role: "Ops", avatar: "/avatars/ops.webp", tools: ["slack", "salesforce"] },
  ];
</script>
```

```tsx
import { AgentTeam } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function TeamHero() {
  return (
    <div style={{ width: 520 }}>
      <AgentTeam
        prompt="Build a team to work my inbound pipeline"
        members={[
          { role: "Researcher", avatar: "/avatars/researcher.webp", tools: ["linkedin"] },
          { role: "SDR", avatar: "/avatars/sdr.webp", tools: ["gmail", "hubspot"] },
          { role: "Ops", avatar: "/avatars/ops.webp", tools: ["slack", "salesforce"] },
        ]}
      />
    </div>
  );
}
```
