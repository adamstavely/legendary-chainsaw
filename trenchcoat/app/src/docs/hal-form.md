---
pattern: form
status: new
related: stepper-form, combobox, routine-form, dialog
---

## Overview

A form the server describes. Give it a [HAL-FORMS](https://rwcbook.github.io/hal-forms/) document, or the URL of one, and
it draws the template's properties as controls, checks them by the template's rules, and sends the request the template
asks for. Nothing about the form lives in the page, so an API can add a field, change a rule or move an endpoint without
a release of the app.

## When to use

- An API that already publishes HAL-FORMS templates, such as Spring HATEOAS with `application/prs.hal-forms+json`.
- Actions that differ by resource or by what the person may do, where the server knows which fields apply.
- Admin and back-office screens with many simple forms that would otherwise each be written by hand.

## When not to use

- A long form split into steps – use `stepper-form`.
- A form whose layout needs design, not just a column of fields – write it with the app's own controls.
- An API without HAL-FORMS – there's no document to draw.

## Anatomy

1. **Fields** `.ui-hal__fields` – the template's properties, in order
2. **Field** `.ui-hal__field` – one property, with its `data-kind`
3. **Required** `.ui-hal__req` – the word beside a required field's prompt
4. **Message** `.ui-hal__error` – what's wrong with the field
5. **Choices** `.ui-hal__group` – a property's options
6. **Foot** `.ui-hal__foot` – Submit and `.ui-hal__outcome`, how it went
7. **Notice** `.ui-hal__message` – shown instead of the form while it loads or when it can't be drawn

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
The controls are the same native inputs as Trenchcoat's other form fields, with `tc-combobox` for lists of choices. A
page can set `--tc-hal-swatch`, the width of a colour field.

## Keyboard

The form follows normal tab order, one stop per control.

| Key | What it does |
|---|---|
| Tab | Moves through the fields, then Submit |
| Enter | Submits from a text field; a new line in a text area |
| Space / arrows | Tick a checkbox, move through radios |

After a failed submit, focus goes to the first field with a problem.

## Screen readers

It's a `form` named by the heading. Each control is named by its prompt, says it's required, and is tied to its message
with `aria-invalid` and `aria-describedby`. Radios and checkboxes are a `fieldset` with the prompt as its legend.
`role="status"` announces how many fields need attention and how the request went; a form that won't load is an alert.

## Content

How the spec's terms are read:

| In the template | What happens |
|---|---|
| `type` | `text`, `textarea`, `search`, `tel`, `url`, `email`, `password`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range`, `color`, `checkbox`, `radio`, `hidden`; anything else is a text box. These are the browser's own inputs, so Firefox and Safari show `month` and `week` as text boxes |
| `options` | `type: "radio"` or `"checkbox"` draws radios or checkboxes; otherwise a searchable list. `inline` wins over `link`; `link` may be JSON or CSV, with `promptField` and `valueField` |
| `maxItems` | Without it, only `type: "checkbox"` allows several (the spec's own example of an untyped list is a single choice) |
| `minItems`, `maxItems`, `required`, `regex`, `minLength`, `maxLength`, `min`, `max`, `step` | Checked when a field is left and on submit; a `regex` that can't be read is ignored |
| `readOnly` | Shown and sent, but can't be changed |
| `templated` | `value` and `options.link.href` expand from `variables`: `{var}`, `{+var}`, `{?a,b}` and `{&a,b}`, not the rest of RFC 6570 |
| `method` | Empty or not a method is a GET |
| `contentType` | `application/x-www-form-urlencoded`, else JSON. GET, HEAD and DELETE put the values in the query string, replacing any already on the URL |
| Where it's sent | `_htarget` in `src`, else `target`, else the `self` link, else `src`. With none of them, the form says it has nowhere to go |

In JSON, a single choice is a string and several are an array; numbers and a lone checkbox are a number and a boolean,
and an empty number is `null`. In form encoding, several choices repeat the name.

## Do

- Use `fetcher` to add auth, so the form's own requests and its `options.link` requests are all covered.
- Listen for `tc-response` to go on to the next screen, and set `errors` from a refusal that names fields.
- Prevent `tc-submit` when the app has its own way of sending, such as a queue or an optimistic update.

## Don't

- Don't load documents from a server you don't trust: the document chooses where the values are sent, and `fetcher` sends
  your auth there too. Only http(s) URLs are followed.
- Don't rely on these checks alone. They save a round trip; the server still has to validate.

## Example

```html
<tc-hal-form id="task" src="/rels/create-task"></tc-hal-form>

<script type="module">
  import "trenchcoat/hal-form";
  import "trenchcoat/tokens.css";

  const form = document.querySelector("#task");
  form.fetcher = (url, init) => fetch(url, { ...init, credentials: "include" });
  form.addEventListener("tc-response", (e) => {
    if (e.detail.ok) location.assign("/tasks");
  });
</script>
```

```tsx
import { HalForm, type HalFormsDocument } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const doc: HalFormsDocument = {
  _links: { self: { href: "https://api.example.org/tasks" } },
  _templates: {
    default: {
      title: "New task",
      method: "POST",
      properties: [
        { name: "title", prompt: "Title", required: true },
        { name: "completed", prompt: "Already done", type: "checkbox" },
      ],
    },
  },
};

export function NewTask({ onDone }: { onDone: () => void }) {
  return <HalForm resource={doc} onTcResponse={(e) => e.detail.ok && onDone()} />;
}
```
