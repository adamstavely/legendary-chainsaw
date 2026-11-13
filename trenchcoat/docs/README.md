<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

# Trenchcoat

A UI kit for AI-native products. Components, illustrations and motion are moving to Lit web components that any framework can use, packaged with one stylesheet, `tokens.css`. Blocks and Screens are single React files you can copy.

- [Components](components/README.md): 367
- [Blocks](blocks/README.md): 23
- [Screens](screens/README.md): 22
- [Illustrations](illustrations/README.md): 46
- [Motion](motion/README.md): 29

## What's inside

The libraries stack: **Motion** primitives add movement, **Components** are the interactive pieces, **Blocks** combine components into sections, and **Screens** are whole pages in an app shell. **Illustrations** sit alongside for empty states and marketing.

Motion → Components → Blocks → Screens, + Illustrations

### [Components](components/README.md)

367 items · 367 files

**Interactive building blocks for AI-native products**

Self-contained UI pieces – agent views, chat and answer UIs, charts, inputs and feedback. Each one ships in a Standard and a Clean style with the same props. Start here when you need a single control or widget.

Agent Create · Agent Cursors · Agent Findings · Agent Fleet · Agent Graph …

### [Blocks](blocks/README.md)

23 items · 23 files

**Ready-made sections built from components**

Larger compositions such as a KPI board, a pricing table, an AI workspace or a task board. They combine several components with layout and sample data – drop one in to get a whole section of a page.

Access Review · Agent Gallery · AI Side Pane · AI Workspace · App Directory …

### [Screens](screens/README.md)

22 items · 22 files

**Complete app pages inside an app shell**

Full screens – analytics, CRM, files, onboarding, settings – plus the App Shell frames (sidebar, workspace panel) they sit in. Use them as starting points for an entire page.

Agent Chat · Agent Run · Analytics · App Shell Flat · App Shell Inset …

### [Illustrations](illustrations/README.md)

46 items · 46 files

**Animated visuals for empty states and marketing**

Decorative, lightly interactive artwork – clouds, folders, orbits, integration diagrams, world maps. Use them in empty states, onboarding and landing pages.

Accessibility Principles · Agent Scene · Agent Team · All Done · Atomic Design …

### [Motion](motion/README.md)

29 items · 29 files

**Low-level animation primitives**

Text and number effects, backgrounds, loaders and tilt – small wrappers that add motion to anything. Other libraries use the same techniques.

Attention Pulse · Badge Pop · Banner Stack · Blur Crossfade · Collapse …

## Standard and Clean

Every component comes in two styles, picked with its `look` prop: `"standard"` (the default) or `"clean"`. They are two design languages, not two weights of one theme: pick one per product. Props and behaviour are the same. Blocks built on the elements follow the nearest look provider, so they come in both; other Blocks, Screens, Illustrations and Motion come in a single style.

|  | Standard | Clean |
| --- | --- | --- |
| Feel | Tactile and branded – solid outlines, gradient fills on dark buttons, a subtle shine | Flat and quiet, in the style of Linear or Vercel – hairline shadows instead of borders |
| Surfaces | Cards often sit in a gray tray | One white card, 0.5px dividers |
| Colour | Solid greys and solid accents (e.g. bright red for destructive) | Translucent greys and soft tints (e.g. an 8% red fill) |
| Icons | 1.5–1.6px strokes | 1.1–1.25px strokes |

- **API:** Same props and behaviour. A few clean files go further: Decision Tree adds follow-up questions, Combobox and Filter Menu fold extra chips into “+N”.
- **Theming:** Both read the shared `--tc-` design tokens: override one (e.g. `--tc-accent`) to theme every component, or a component token (e.g. `--tc-button-radius`) for one. Each style carries its own values as fallbacks.
- **Mixing:** Each style has its own CSS class prefix, so both can appear on one page without clashing.

See the difference live in the gallery: [Button](components/button.md), [Change Summary](components/change-summary.md) and [Segmented Control](components/segmented-control.md).

## Using a file

1. Components need `tokens/tokens.css` on the page – it holds every value they use. While they're ported to Lit, copy `src/components/<name>.tsx` together with `src/internal/`.
2. Blocks, Screens, Illustrations and Motion are self-contained: copy the file into your project, e.g. `components/ui/`, and import it from there.
3. If it imports another piece as `@/components/ui/<name>`, copy that file alongside – Screens build on App Shell, Blocks on components like Button and Kpi Chart.
4. The styles are injected by the file itself. Theme it by overriding `--tc-` tokens in `tokens/tokens.css` or on any ancestor. Dark mode: `data-tc-theme="dark"` (or `.dark`) on an ancestor, `data-tc-theme="system"` to follow the OS. Reduced motion is respected automatically.
5. Open any item here to see its file name, and use Replay to restart its animations.

## Foundations

- [Getting started](foundations/getting-started.md)
- [Looks](foundations/looks.md)
- [Themes](foundations/themes.md)
- [Tokens](foundations/tokens.md)
- [Patterns](foundations/patterns.md)
- [Accessibility](foundations/accessibility.md)
- [Frameworks](foundations/frameworks.md)
- [Generative UI](foundations/generative-ui.md)
- [Spot illustrations](foundations/spot-illustrations.md)
- [Browser support](foundations/browser-support.md)
- [Performance](foundations/performance.md)
- [Changelog](foundations/changelog.md)
