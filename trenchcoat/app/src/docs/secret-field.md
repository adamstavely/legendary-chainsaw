---
pattern: form
status: beta
related: model-picker
---

## Overview

A masked credential input with an explicit reveal control.

## When to use

Use this component to a masked credential input with an explicit reveal control in an AI product's settings or setup workflow.

## When not to use

Use existing read-only run and output components when users only need to inspect results. Application callbacks are required for external operations.

## Keyboard

Tab and Shift+Tab move through fields and actions. Native inputs, selects and buttons keep their standard keyboard behavior. Multiline editors preserve Enter for new lines.

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
import { SecretField } from "trenchcoat/react";
import "trenchcoat/tokens.css";
export function Example() { return <SecretField label="API key" />; }
```
