# Looks

Every component ships in two looks with the same API.

| | Standard | Clean |
|---|---|---|
| Surfaces | A gray tray around a white card | One white card with hairline shadows |
| Controls | Taller (28 · 32 · 40 px), the primary button a flat ink chip | Compact (24 · 28 · 32 px), a quiet ghost and a minimal red fill |
| Icons and text | Standard weights | Thinner icon strokes, quieter secondary text |
| When it fits | Products with a visible structure – dashboards, consoles | Products that want the UI to recede – writing tools, assistants |

## Choosing a look

The look comes from, in order:

1. the element's own `look` attribute – `<tc-combobox look="clean">`;
2. the nearest `<tc-look-provider look="clean">` around it;
3. otherwise, Standard.

Set it once for a whole app with a provider at the root, and override single components where they need to differ:

```html
<tc-look-provider look="clean">
  <!-- every Trenchcoat element in here is Clean -->
  <tc-button label="Save"></tc-button>
  <tc-button label="Cancel" look="standard"></tc-button>
</tc-look-provider>
```

In React: `<LookProvider look="clean">…</LookProvider>` from `trenchcoat/react`.

Illustrations and motion pieces have one look; they don't change the look of what you put inside them.

The tokens behind both looks are on the [Tokens](#/foundations/tokens) page.
