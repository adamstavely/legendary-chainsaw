---
pattern: form
status: beta
related: model-picker
---

## Overview

A synchronized slider and numeric input.

## When to use

Use this component to a synchronized slider and numeric input in an AI product's settings or setup workflow.

## When not to use

Use existing read-only run and output components when users only need to inspect results. Application callbacks are required for external operations.

## Keyboard

Arrow keys change the slider by one step. The numeric field supports typing and native increment/decrement controls.

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
import { SliderField } from "trenchcoat/react";
import "trenchcoat/tokens.css";
export function Example() { return <SliderField label="Temperature" defaultValue={0.7} min={0} max={2} step={0.01} />; }
```
