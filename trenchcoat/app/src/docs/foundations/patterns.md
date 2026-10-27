# Patterns

How every Trenchcoat element behaves, so learning one teaches you the rest.

## Values and events

A value the person changes (a picked option, an open state, a sort) is a **property** plus a **cancelable event**:
`value` and `tc-value-change`, `open` and `tc-open-change`. The element applies the change unless a listener calls
`preventDefault()`.

- **Uncontrolled:** set the starting value and listen if you want to know.
- **Controlled:** listen, call `preventDefault()`, store the value and pass it back.

```js
combobox.addEventListener("tc-value-change", (e) => {
  e.preventDefault();          // the app owns the value
  state.who = e.detail.value;  // … and sets combobox.value = state.who when it renders
});
```

Actions (approve, send, dismiss) are plain `tc-…` events with the details in `detail`. Callbacks that return
something – a promise to wait for, a cell to draw – are function properties (`renderCell`, `onSend`).

## Content

- **Text is a property**, never text children: `<tc-button label="Save">`. Frameworks overwrite text children.
- **Icons** are your elements, marked with `slot="icon"` – they stay where your framework put them.
- **Icons inside lists and tables** (an option's icon, a column's icon) are elements the component clones.

## Forms

Form controls (combobox, otp-input, segmented-control, dropzone, stepper-form's fields, trigger-builder) are real form
participants: they submit under `name`, honour `required`, reset with the form, follow a disabled `<fieldset>`, and a
page `<label for>` names them.

## React

`trenchcoat/react` wraps each element with React props and callbacks: `value` / `defaultValue` / `onChange` for
controlled and uncontrolled use, `title` for headings, and React nodes for icons and avatars. React nodes passed as
content are rendered once and cloned into the element – they look the same, but event handlers inside them don't
run (stepper-form's steps are the exception: they stay live React). A `ref` is the element itself.

## Server rendering

Not in this version: load the elements on the client (Next.js `dynamic(…, { ssr: false })`, Nuxt `<ClientOnly>`),
behind a placeholder of the right size so nothing shifts.

## Long lists

Lists and tables over a few dozen rows render only the rows in view (data-table, filter-menu, combobox, chat-history,
sandbox-log), so 10,000 rows cost about as much as 60.

## Size

Import elements one by one (`trenchcoat/button`): each pulls in itself and the small shared base. A page with one
button is about 15 KB gzipped, Lit included; Lit (8 KB) is shared by every element on the page.
