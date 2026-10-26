---
pattern: none
status: stable
related: button, combobox, data-table
---

## Overview

Sets the default look – Standard or Clean – for every Trenchcoat element inside it, so an app picks its look once
instead of on every element. It renders nothing of its own (it's `display: contents`), so wrapping a subtree doesn't
change the layout. An element's own `look` still wins; elements without one take the nearest provider's, and
Standard when there's none. Changing the provider's `look` restyles everything inside at once.

## When to use

- At the root of an app that uses Clean throughout: wrap it once and leave `look` off the elements.
- Around one part of a page that should differ from the rest – a settings panel in Clean inside a Standard app.
  Providers nest; the nearest one wins.
- A Standard / Clean switch, like the gallery's: bind the switch to the provider's `look`.

## When not to use

- One element that differs from its neighbours – set `look` on that element.
- Illustrations and motion pieces – they have one look and ignore the provider.
- Light and dark – that's the theme, set with `color-scheme`, `data-tc-theme` or a `.dark` class, not a look.

## Example

```html
<tc-look-provider look="clean">
  <label for="assignees">Assignees</label>
  <tc-combobox id="assignees"></tc-combobox>
  <tc-button label="Save"></tc-button>
  <tc-button label="Cancel" variant="secondary" look="standard"></tc-button>
</tc-look-provider>

<script type="module">
  import "trenchcoat/look-provider";
  import "trenchcoat/combobox";
  import "trenchcoat/button";
  import "trenchcoat/tokens.css";

  // Switch every element inside at once (except the one with its own look)
  document.querySelector("tc-look-provider").look = "standard";
</script>
```

```tsx
import { useState } from "react";
import { Button, LookProvider, type Look } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function App() {
  const [look, setLook] = useState<Look>("clean");
  return (
    <LookProvider look={look}>
      <Button onClick={() => setLook(look === "clean" ? "standard" : "clean")}>Switch look</Button>
    </LookProvider>
  );
}
```
