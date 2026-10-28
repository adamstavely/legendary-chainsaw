# Generative UI

A model can answer with Trenchcoat components instead of a wall of text, for example a status tracker of release
gates, a coverage ring or an activity calendar. The components are the same ones an app uses directly. Strings
render as text and never as HTML, the model's props are checked before anything is set, and every interaction comes
back to the app as an event.

`trenchcoat/generative` holds what the model and the app need:

- **`catalog` and `catalogPrompt(tags?)`.** One line per component the model can place: its tag, what it's for and
  its events. The whole catalogue is about 5,600 tokens. For a narrow assistant, pass the few tags it needs.
- **`loadSchema(tag)`.** A component's JSON Schema, generated from its TypeScript types and JSDoc. Each schema loads
  only when it's asked for.
- **`toolDefinitions(tags?)`.** One tool per component (`show_status_tracker` …), ready for the Messages API's `tools`.
  `tagOfTool(name)` maps a tool call back to its tag.
- **`checkComponent(tag, props)` and `mountComponent(parent, tag, props)`.** These check a model's props, and render the
  component with what's safe to set.

It works on a server too: `toolDefinitions` and `checkComponent` don't need a DOM.

## Which components a model can place

Every component whose properties a model can write as JSON (about 190 of them). Properties that take functions, DOM
nodes or files are left out of the schemas, and so are fields deeper down that do (an icon element in a list item).
The model can't place components that only make sense under the app's control:

- dialogs and the terms dialog;
- the chat composer and other inputs that own the page's state;
- anything with a global shortcut;
- the look provider;
- page decoration and motion.

`isGeneratable(tag)` says whether a tag is in.

## In the answer: the component block

The model writes `tc-generated-ui`'s JSON spec, and a `component` block places a component:

```json
{ "blocks": [
  { "type": "text", "text": "Two gates are clear; the load test is holding the release." },
  { "type": "component", "tag": "tc-status-tracker", "props": {
      "heading": "Release gates", "noun": "Gate",
      "steps": [
        { "id": "g1", "label": "Security review", "status": "cleared" },
        { "id": "g2", "label": "Load test", "status": "pending", "attention": "p95 is over budget" },
        { "id": "g3", "label": "Launch", "status": "not-reached" }
      ] } }
] }
```

Put `catalogPrompt()` in the system prompt, and pass the model's text to `spec` with `streaming` while it arrives. A
component block appears once its JSON closes, like every other block.

- **Checked props.** Before anything is set, the component's module and schema load and the props are checked
  against the schema. A tag that isn't in the catalogue falls back to text, with the reason.
- **Issues.** Props that don't fit are left out and listed in `tc-spec-check`, with their path:
  `/blocks/1/props/steps/3: needs label – left out`.
- **Events.** The component's events come back as `tc-component-event`, which carries `{ block, tag, event, detail }`.
  Preventing it prevents the component's own event, so the app decides what a click does.

## With tool use: a tool per component

Give the model the components as tools, and render each call. On the server:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { tagOfTool, toolDefinitions } from "trenchcoat/generative";

const client = new Anthropic();
const tools = (await toolDefinitions(["tc-status-tracker", "tc-coverage-ring", "tc-activity-calendar"])) as Anthropic.Beta.BetaTool[];

export async function answer(messages: Anthropic.Beta.BetaMessageParam[]) {
  const ui: { tag: string; props: unknown }[] = [];
  for (;;) {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "medium" },
      // If a request is declined, it's retried server-side on the recommended fallback model
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      tools,
      messages,
    });
    if (response.stop_reason === "refusal") return { text: "I can't help with that one.", ui };
    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason !== "tool_use") {
      const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      return { text, ui };
    }
    // Every call in this turn is answered in one message
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const tag = tagOfTool(block.name);
      if (!tag) {
        results.push({ type: "tool_result", tool_use_id: block.id, content: "No such component.", is_error: true });
        continue;
      }
      ui.push({ tag, props: block.input });
      results.push({ type: "tool_result", tool_use_id: block.id, content: "Shown to the user." });
    }
    messages.push({ role: "user", content: results });
  }
}
```

Then on the client, render the calls as component blocks, so they get the same checks and events:

```ts
generatedUi.spec = { blocks: [{ type: "text", text }, ...ui.map((c) => ({ type: "component", ...c }))] };
```

A few notes:
- **No forced tool choice.** Leave `tool_choice` on `auto`; Claude Opus 5.5 doesn't accept a forced tool choice. If
  the assistant should always show a component, say so in the system prompt.
- **Server-side checks.** To check on the server before anything is sent to the client, run `checkComponent(tag,
  block.input)` and return its issues in the `tool_result`, so the model can correct itself.
- **Keep the tool list short.** Every tool's schema is part of the prompt, so pass only the components the assistant
  needs. For a broad assistant, prefer the component block with `catalogPrompt()`: it costs a line per component, and
  a schema only when you choose to send one.

## Guardrails

These hold whichever way the model reaches a component:

| Check | What happens |
|---|---|
| A tag not in the catalogue | Shown as text, with the reason |
| A property the component doesn't have, or a value of the wrong type | Left out, and listed with its path |
| A list item missing a required field | That item left out; the rest of the list kept |
| A link (`href`, `url`, `src`, `image` …) that isn't http(s), mailto or relative | Left out – `javascript:` and `data:` never reach the page |
| More than 200 items in a list | Cut to 200 |
| A string longer than 4,000 characters | Cut |
| More than 8 levels of nesting, or props over 200 KB | Left out |

Nothing a component does changes the app's own state unless the app listens and decides: events come back to the app,
and the cancelable ones can be prevented.

## Keeping it in step

`scripts/gen-schemas.mjs` writes the schemas, the catalogue and the lazy-loading registry from the elements' types,
and `npm run check:generative` fails in CI when they're out of date. A new component can be placed by a model as soon
as it's in the library, unless it's on the list of app-controlled elements in that script.
