# Agent Face: plan

Donovan, an expressive, animated face for an AI agent. It shows what the agent is doing (listening, thinking, speaking, stuck)
and reacts when that changes. Reference for the idea: https://jpsullivan.github.io/agent-face/

## Build it from scratch

The reference repo is a reconstruction of minified claude.ai code, with the originals checked in under `original/` and
no license. Its code, shaders, pictograms and character art aren't ours to reuse, so this is an original build:

- Nobody working on this reads or copies the reference's `src/`, `original/` or shaders. Its public page and README are
  enough to set the goal.
- We design Donovan ourselves, with Donovan's own palette and our own names. No terracotta blob, no "tofu" or "clay" naming.
- Only general ideas carry over: spring-driven expressions, blinks, a state that holds for a minimum time.

## Who Donovan is

Donovan is the assistant in the product mocked up in `Donovan (2).html`, a work app for risk, fraud and support teams.
`Donovan AI Docs.html` is unrelated. The character grows out of what that page already has:

- **Shape:** Donovan's real logo, a stylized spear tip that also reads as a letter A. The four-point star in the mockup
  isn't the logo, so nothing here builds on it. The artwork is traced in `src/draw/spear-tip.mjs`, in the logo's own colours.
- **Colour:** the logo's: `#EBA14B` to `#A858A8` on the long stroke, `#2C5C94` to `#19A7D1` on the short one. It should stay readable on the page's
  white and light gray surfaces, and in dark mode.
- **Tone:** calm and professional. Donovan appears beside approvals and fraud decisions, so `error` and `confused` must
  read as serious, and `happy` stays small.
- **Where it sits:** the 26 px mark in the app header, the small tile beside "Donovan's read on your queue", and the chat
  composer. Small sizes are the main case, not the exception.

Hats and sunglasses don't suit that tone, so they move to Phase 5 and stay off by default. Gestures stay, but subtle.

## What we build, and what we leave out

| In the reference | Here |
|---|---|
| Face engine: states, blinks, glances, gestures, hats | **Build**, minus hats until Phase 5: the core of this project |
| Canvas face component with per-state labels | **Build** |
| Playground ("Face lab") | **Build**: our own version |
| Animated line marks chosen by state or held prop | **Later, optional**: own designs, see Phase 5 |
| WebGL clay renderer and glazed tiles | **Skip**: Canvas 2D is enough, and far smaller |
| Task tokens, channel pictograms, icon resolver | **Skip**: claude.ai's icon system, unrelated to the face |

## Design

Three layers, each usable without the one above it:

```
agent-face/
  src/
    engine/      no DOM: state + time -> pose
    draw/        pose + look -> Canvas 2D calls
    element/     <agent-face> custom element: canvas, loop, accessibility
    react/       thin wrapper
  playground/    Vite page for trying everything
  tests/
```

**Engine.** `new FaceEngine({ seed })`, `setState()`, `playGesture()`, `setWearable()`, `step(dtMs)`, `pose()`.

- The pose is plain numbers: eye openness, eye shape, gaze x/y, brow, mouth curve and openness, tilt, squash, hop.
- Each state is a table of target numbers, reached through springs, so any state can blend into any other.
- Life on top of the targets: random blinks, small glances, breathing. Speaking moves the mouth, and takes an optional
  `amplitude` (0–1) so real audio can drive it.
- Each state holds for a minimum time, so quick changes from a chatty agent don't flicker.
- Time and randomness are injected, so a seed plus a list of steps always gives the same pose. That's what makes it testable.

**States:** idle, listening, thinking, speaking, happy, confused, sleeping, error, surprised.
**Gestures:** wave, nod, hop, spin.
**Hands:** floating white cartoon gloves with no arms (outlined, so they show on white), from 27 px up. Under 90 px the
hand is a mitten; from 90 px it has three fingers and a thumb. **Wearables:** none until Phase 5.

**Element.** `<agent-face state="thinking" size="64">`

- One shared animation loop for every face on the page.
- The loop stops when the face is off screen or the tab is hidden. Blinks and breathing also fade out after 30 seconds
  (`rest-after`) unless Donovan is listening, thinking or speaking; the face then settles and the loop stops, so an idle
  page uses no CPU.
- `prefers-reduced-motion`: no idle motion or springs. Each state is drawn as a still, and changes cut straight to it.
- Accessibility: `role="img"` with a label per state, overridable for translation. Announcing changes stays opt-in,
  because a face that talks over the chat is worse than a silent one.
- Canvas scales with device pixel ratio and stays sharp from 16 to 256 px. At the smallest sizes the face simplifies, and below a size set in Phase 1 the logo's own motion carries the state.

## Phases

Each phase ends with something to look at.

1. **Donovan sketches.** Static SVG sheet, three takes on the spear tip: eyes on the logo, a softened version with a small
   face, and no face at all, where only the shape and motion show the state. All nine states at 16, 26, 64 and
   160 px, on light and dark, and shown in place in the app's header and composer.
   *Done when:* you've picked one. Everything after depends on this, so it comes first.
2. **Engine.** Springs, state table, blinks, minimum hold, gestures, with unit tests.
   *Done when:* same seed gives same poses, every state settles on its target, and rapid changes don't flicker.
3. **Drawing and element.** Canvas renderer, `<agent-face>`, shared loop, sleep and wake, reduced motion, accessibility.
   *Done when:* browser tests and axe pass in Chromium, Firefox and WebKit, and an idle face schedules no frames.
4. **Playground and React wrapper.** State, gesture and amplitude controls, a size strip, dark
   mode, reduced motion, plus a "scripted agent" that runs through a realistic session.
   *Done when:* it runs at 60 fps with 20 faces, and the core is under about 15 KB gzipped.
5. **Optional extras.** Hats and sunglasses, original activity marks, held props, and voice input driving `amplitude`.

## Decisions

**Made**

1. **The character is called Donovan.** Examples, docs and the default label use the name; the label stays overridable.
2. **It ends up in both places.** A standalone, framework-free package here, plus a thin `tc-agent-face` wrapper in
   Trenchcoat, built with the `new-component` skill once Phase 4 is done.

3. **Take B, then the real logo.** A small face on the mark. `sketches/sheet.html` records the placeholder it was judged on.
4. **Its own CI.** `.github/workflows/agent-face-ci.yml`, because `trenchcoat-ci.yml` only runs for `trenchcoat/**`.

**Still open**

1. **The logo file.** Not available yet, so Phase 1 uses the placeholder. The chosen take gets rechecked against the real
   artwork when it arrives.
