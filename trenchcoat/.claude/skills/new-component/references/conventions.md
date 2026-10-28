# Trenchcoat element conventions

## Contents
1. The element
2. Looks and CSS
3. Interaction and accessibility
4. Events and controlled state
5. The React wrapper
6. The demo
7. The docs page
8. The tests

## 1. The element

```ts
import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-example> – what it shows, in a sentence or two of plain words. Then the behaviour worth knowing: how it
 * scales, what's interactive, the keyboard model.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-example .items=${[…]}></tc-example>
 */

/**
 * One-line summary – this becomes the manifest's description.
 * @tag tc-example
 * @fires tc-selected-change - What happened ({ selected, item }: ExampleSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcExample extends TcElement {
  static override ui = "exm";
  /** The heading */
  @property() accessor heading = "Example";
  /** Every public property gets its own JSDoc line – the docs check reads them */
  @property({ attribute: false }) accessor items: ExampleItem[] = [];
  …
}

if (!customElements.get("tc-example")) customElements.define("tc-example", TcExample);
declare global {
  interface HTMLElementTagNameMap {
    "tc-example": TcExample;
  }
}
```

- **Light DOM, `TcElement`.** `static ui` sets `data-ui` on the host, and `this.emit(name, detail, { cancelable })`
  dispatches bubbling, composed events.
- **Rich data uses `attribute: false`.** Simple values have kebab-case attributes (`@property({ attribute: "unit-one" })`).
- **Times are epoch ms.** A component that shows relative time keeps its own clock unless `now` is given. That
  `Date.now()` is the one allowed clock read; lock it into the ratchet baseline.
- **Pure render.** No layout reads, no clock reads and no state writes during `render()`.
- **Labels the page can rename.** For example `statusLabels` merged over exported defaults (`defaultExampleLabels`),
  plus a `locale` for `Intl` formatting.
- **Export the types** the page needs: data shapes, event details, defaults.

## 2. Looks and CSS

`static override css = /* css */ \`…\`` holds the element's styles, scoped by `[data-ui="exm"]` and BEM-ish classes
`ui-exm__part`.

- **Standard:** `:where([data-look="standard"], [data-look="standard"] *)[data-ui="exm"]` is a gray tray
  (`--tc-tray-inset`, `--tc-tray-radius`, `--tc-surface-tray`) holding a white card (`--tc-card-radius`,
  `--tc-surface-on-tray`, `--tc-card-shadow`).
- **Clean:** one white card (`--tc-surface-raised`, `--tc-card-shadow`), with the header as its first row.
- **Tokens only.** Use `var(--tc-…)` for every colour, space, radius, duration, easing, weight and line height. A
  value the tokens lack becomes a component token defined once on the host (`--tc-exm-gap: 3px`), not a literal at
  each use. `CONTRIBUTING.md` has the table of which token to use for which pattern.
- **Colour rules.** Use `light-dark()` for colours, never rules scoped to `.dark`.
- **Colour is never the only cue.** Status gets a mark and a word as well as a tone.
- **Queries.**
  - **Container queries** (`container-type: inline-size` on the host) for narrow layouts.
  - **`prefers-reduced-motion`** turns animations off.
  - **`forced-colors`** gives drawn marks a system colour.
- **Header.** `cardHead({ icon, title, subtitle, id, aside })` draws it: the icon is Lucide-style SVG paths (credit
  Lucide in a comment), and the aside holds a count, a total or the legend.

## 3. Interaction and accessibility

- **One tab stop per collection** (roving tabindex), with the right role:
  - `grid` with rows and gridcells for 2-D layouts;
  - `listbox` and `option` for single selection;
  - `tablist` and `tab`;
  - `radiogroup`;
  - otherwise a list of buttons.

  Arrow keys move, Home/End go to the ends, Enter or Space acts, Escape closes or clears. Move focus with
  `updateComplete.then(() => el.focus())`.
- **Detail panels.** A panel that opens below is controlled by its trigger (`aria-controls`, `aria-expanded`). Its
  Close button returns focus to the trigger.
- **Announcements.** Use a visually hidden `role="status"` span for polite announcements ("Selected Gate 5"), and a
  hidden description of the keys, referenced by `aria-describedby`.
- **Accessible names.** A control's name must include its visible words (axe's label-in-name rule). Add
  screen-reader-only text instead of an `aria-label` that differs. Drawn parts that repeat what the text says are
  `aria-hidden`.
- **Hit targets.** Clickable rows need at least `--tc-control-h-sm` of height (WCAG 2.5.8).

## 4. Events and controlled state

- **State the page may own** (selected, filter, sort, expanded, value) is a property plus a cancelable
  `tc-<prop>-change`. The detail carries the new value under the property's own name, e.g.
  `{ selected, item }` for `tc-selected-change`; the docs' controlled examples and the Angular type check depend on
  it. If the listener calls `preventDefault()`, the element keeps its value.
- **One-off actions** use `tc-open`, `tc-action { id }`, `tc-copy`, `tc-retry` and similar, cancelable when the
  element would otherwise do something itself.

## 5. The React wrapper

```ts
const RawExample = createComponent({ tagName: "tc-example", elementClass: TcExample, react: React,
  events: { onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ExampleSelectedChange>> } });
export type ExampleProps = Omit<React.ComponentProps<typeof RawExample>, "heading" | "selected" | "onTcSelectedChange" | "children"> & {
  /** The heading */ title?: string;
  /** Controlled when given */ selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (selected: string | null, item?: ExampleItem) => void;
};
export function Example({ title, selected, defaultSelected = null, onSelectedChange, ...props }: ExampleProps) {
  const s = useControlled(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, …) : undefined);
  return h(RawExample, { ...props, heading: title ?? "Example", selected: s.value,
    onTcSelectedChange: (e) => s.handler(e.detail.selected, e) });
}
```

- **The heading prop is `title`.** On the element it's `heading`, because `title` is a tooltip there.
- **Re-export the types** the page needs from the wrapper module.
- **Name callbacks apart from React's DOM props.** Avoid `onSelect`, `onCopy`, `onChange`.

## 6. The demo

`app/src/demos/<slug>.tsx` exports `default function Demo({ ui }: { ui: typeof UI })` and renders the wrapper with
fictional data:
- **Deterministic data.** Use a seeded `noise()` instead of `Math.random`, so the thumbnail is stable.
- **Show it working.** Starting in an interesting state (selected, open, partly filled) makes a better thumbnail.
- **A caption under it** (`caption` from `../demo-kit`) says what to try, with one `textButton` that changes the data
  ("Clear gate 5", "Show next week").

## 7. The docs page

`app/src/docs/<slug>.md` starts with frontmatter:

```yaml
---
pattern: grid        # the ARIA pattern: grid, listbox, list, tabs, disclosure, button, radio, form, combobox, toolbar, none
status: new
related: a-slug, b-slug, c-slug, d-slug   # existing components, or siblings added in the same change
---
```

Then these sections, in order:
1. **Overview:** what it shows, in plain words.
2. **When to use / When not to use:** the "not" items point at the component to use instead.
3. **Anatomy:** numbered **Part** `.ui-exm__part` – what it is. Each selector must be a class the element renders.
4. **Looks:** Standard versus Clean, and any component tokens a page can override.
5. **Keyboard:** a table.
6. **Screen readers:** roles, names, announcements.
7. **Content:** writing guidance for the data.
8. **Do / Don't.**
9. **Example:** an `html` block, then a `tsx` block using `trenchcoat/react`. The tsx is type-checked against the
   wrappers.

The per-framework sections (Vue, Angular, Svelte) are generated; don't write them by hand.

## 8. The tests

`tests/elements/<slug>.test.ts` runs in real browsers (Chromium, Firefox, WebKit) via `fixture`, `settle`, `finish`
and `cleanup` from `./helpers`.

Cover:
1. **Per look:** the host's `data-ui` and `data-look`, roles and names, and one tab stop.
2. **What it computes:** levels, counts, totals, formatting, defaults, renamed labels.
3. **Interaction:** click and keyboard, events with their detail, and `preventDefault()` keeping the state.
4. **Edge cases:** empty data, data that disappears while selected, narrow width.
5. **React:** an uncontrolled selection survives parent re-renders, and a controlled one stays until the parent
   changes it.
6. **Accessibility:** axe in both looks and both themes, after `await finish(wrap)`.

Wait on conditions with `expect.poll`, never fixed timeouts; WebKit runners are slow. For ⌘/Ctrl shortcuts, send
both modifiers.
