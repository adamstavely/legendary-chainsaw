---
pattern: form
status: beta
related: model-picker
---

## Overview

A native keyboard-operated single choice.

## When to use

Use this component to a native keyboard-operated single choice in an AI product's settings or setup workflow.

## When not to use

Use existing read-only run and output components when users only need to inspect results. Application callbacks are required for external operations.

## Keyboard

Tab enters the radio group once; arrow keys move between native radio inputs.

## Screen readers

Visible labels name native controls. Form panels group their controls under a heading and announce action results through a status region. Standard and Clean use the same semantics.

## Content

Give the control a visible label and a short description where the meaning needs explanation. Use name for form submission. A secret field masks display, but its value remains available to the host application.

## Do

Keep values application-owned with value/onChange, or use defaultValue for local editing. Use disabled while settings cannot be changed. For long operations, honor the provided AbortSignal and reject failed operations so the component offers a retry.

## Don't

Don't treat client-side validation or policy previews as backend enforcement. Don't store credentials in exported configuration; reference application-managed credentials instead.

## Example

```html
<tc-radio-group id="mode" label="Review mode"></tc-radio-group>

<script type="module">
  import "@adamstavely/trenchcoat/radio-group";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#mode");
  el.options = [
    { value: "ask", label: "Ask first" },
    { value: "auto", label: "Automatic" },
  ];
  el.value = "ask";
  el.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { RadioGroup } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";
export function Example() { return <RadioGroup label="Review mode" defaultValue="ask" options={[{ value: "ask", label: "Ask first" }, { value: "auto", label: "Automatic" }]} />; }
```
