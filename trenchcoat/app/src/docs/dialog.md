---
pattern: dialog
status: beta
related: model-picker
---

## Overview

A native modal with interactive content and restored focus.

## When to use

Use this component to a native modal with interactive content and restored focus in an AI product's settings or setup workflow.

## When not to use

Use existing read-only run and output components when users only need to inspect results. Application callbacks are required for external operations.

## Keyboard

Tab and Shift+Tab stay inside the native modal. Escape requests closing. Focus returns to the opener when the modal closes.

## Screen readers

Visible labels name native controls. Form panels group their controls under a heading and announce action results through a status region. Standard and Clean use the same semantics.

## Content

Give the control a visible label and a short description where the meaning needs explanation. Use name for form submission. A secret field masks display, but its value remains available to the host application.

## Do

Keep values application-owned with value/onChange, or use defaultValue for local editing. Use disabled while settings cannot be changed. For long operations, honor the provided AbortSignal and reject failed operations so the component offers a retry.

## Don't

Don't treat client-side validation or policy previews as backend enforcement. Don't store credentials in exported configuration; reference application-managed credentials instead.

## Example

```tsx
import { useState } from "react";
import { Button, Dialog } from "trenchcoat/react";
import "trenchcoat/tokens.css";
export function Example() {
  const [open, setOpen] = useState(false);
  return <><Button label="Open" onClick={() => setOpen(true)} /><Dialog label="Settings" open={open} onOpenChange={setOpen}><p>Review your settings.</p></Dialog></>;
}
```
