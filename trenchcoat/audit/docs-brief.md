# Writing a component's docs page – the brief for Part 4.3

Every component, illustration and motion piece gets a design-system page in the gallery (`#/<slug>`). Most of
the page is generated from the code (`app/src/docs/api/<slug>.json`, by `scripts/gen-docs.mjs`); you write the
guidance and complete the code's own documentation. Several people work at once in this checkout, so touch only
your own pieces' files.

## Read first

- The finished reference: `app/src/docs/combobox.md` and its page (`#/combobox`). Match its depth and voice.
- `app/src/docs/guidance.ts` – the file format (front matter, headings, the anatomy line format, the Example).
- Your piece's element (`src/elements/<slug>.ts`), its React wrapper (`src/elements/react/<slug>.ts`), its tests
  (`tests/elements/<slug>.test.ts`), its demo (`app/src/demos/…`) and its README line. **Everything you write
  must be true of the code**: read the key handling before writing the keyboard table, the live-region text before
  describing what screen readers hear, the properties before naming one. Don't describe what you assume.

## Per piece

1. **Complete the code's documentation.**
   - A one-sentence JSDoc on every public property, every `@fires` and every `@slot` of the element(s) in the
     module.
   - The same on every prop of the React wrapper's `…Props` type.
   - JSDoc only – no behaviour changes.
2. **Write `app/src/docs/<slug>.md`**:
   - **Front matter:**
     - `pattern`: the WAI-ARIA pattern it follows, from the keys in `guidance.ts` `PATTERNS`, or `none`;
     - `status`: `stable`, `new` for Part 3's components, or `react-twin` where `src/components/<slug>.tsx` still
       exists;
     - `related`: two to four real slugs.
   - **Overview:** what it is and the problem it solves, in two to five sentences – what it does for the person
     using the product, not how it's built.
   - **When to use / When not to use:** bullets. Every "when not" names the component to use instead, as a
     backticked slug (`` `command-menu` ``) – the page turns it into a link.
   - **Anatomy:** three to seven parts, `1. **Name** \`.ui-x__part\` – what it is`. The selector must match the part
     in the live demo – the page draws numbered pins with it.
   - **Looks:** two or three sentences on what Standard and Clean do differently. Look at both.
   - **Keyboard:** a table, `| Key | What it does |`, exactly what the element handles. For something with nothing
     to operate, one line saying so.
   - **Screen readers:** roles, names, states, live-region messages – quoted as the element says them.
   - **Content:** writing guidance – labels, empty and error text, tone.
   - **Do / Don't:** two to four bullets each, concrete.
   - **Example:**
     - one ```html block: `import "trenchcoat/<slug>"`, the tag, properties set from script, one event;
     - one ```tsx block importing from `trenchcoat/react`. It's type-checked: it must compile.

   Illustrations and motion pieces need Overview, When to use, When not to use and Example; add the others where
   they apply (an interactive illustration has a keyboard).
3. **Check:**
   - `node scripts/gen-docs.mjs <your slugs…>`, then `node scripts/check-docs.mjs <your slugs…>` until it passes.
     The manifest step can collide with another agent's run – if JSON parsing fails, run it again.
   - Look at the page: run your own gallery server (`npx vite --port <your port> --strictPort`), then
     `node scripts/docs-shot.mjs <your port> <slug or id…>` – illustrations and motion use their id,
     `illustrations/<slug>`. Read the PNGs in `.visual/docs/`.
   - Check the anatomy pins land on the right parts – turn on "Show anatomy" in a screenshot of your own or check
     the selectors in the demo – and that nothing in the page reads wrong.
   - `npx tsc -p tsconfig.json --noEmit` and `npx eslint` on the files you changed.

## Voice

The README's: plain, specific, active, British spelling as in the existing docs ("colour"), en dashes with spaces
( – ), no marketing words, no "simply" or "just". Write for a product designer and a front-end developer deciding
whether and how to use the component.

## Rules

- Touch only:
  - `app/src/docs/<slug>.md`;
  - `app/src/docs/api/<slug>.json`, through the script;
  - JSDoc comments in `src/elements/<slug>.ts` and `src/elements/react/<slug>.ts`.
- No behaviour changes.
- No edits to the page code, the scripts or shared files – if the page can't show something your piece needs, say
  so in the report.
- No git commands. Never touch `icon-composer/` or anything outside `trenchcoat/`.

## Report

Per piece: done, check-docs passing; anything in the code you found that contradicts its README line or demo
(report it, don't fix behaviour); anything the page template should add. Short.
