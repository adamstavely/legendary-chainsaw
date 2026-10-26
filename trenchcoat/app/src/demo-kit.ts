import type { CSSProperties } from "react";

/**
 * Shared styles for the gallery demos' own chrome (captions, reset buttons, sample cards around a component).
 * The gallery doesn't load tokens.css, so every value is a token with its light-dark() fallback – the demo chrome
 * follows the stage's theme and, where a page does load tokens.css, the look's values.
 * Buttons copy the library Button's secondary and ghost styles (the pattern tokens), so they read like the components.
 */

/** Notes, logs and status lines under a demo */
export const caption: CSSProperties = {
  fontSize: "var(--tc-font-size-sm, 12px)",
  lineHeight: 1.45,
  color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))",
};

/** Secondary button, md – like <Button variant="secondary"> */
export const button: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "var(--tc-control-h-md, 32px)",
  padding: "0 var(--tc-control-px-md, 12px)",
  borderRadius: "var(--tc-control-radius-md, 10px)",
  border: 0,
  background: "var(--tc-action-secondary-bg, light-dark(#ffffff, #232326))",
  boxShadow: "var(--tc-action-secondary-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)))",
  color: "var(--tc-action-secondary-fg, light-dark(#171717, #ededed))",
  font: "inherit",
  fontSize: "var(--tc-control-font-size, 13px)",
  fontWeight: "var(--tc-control-font-weight, 500)" as CSSProperties["fontWeight"],
  whiteSpace: "nowrap",
  cursor: "pointer",
};

/** Secondary button, sm – like <Button variant="secondary" size="sm"> */
export const buttonSm: CSSProperties = {
  ...button,
  height: "var(--tc-control-h-sm, 28px)",
  padding: "0 var(--tc-control-px-sm, 10px)",
  borderRadius: "var(--tc-control-radius-sm, 8px)",
  flexShrink: 0,
};

/** Inline text action inside a caption ("Reset", "Show again") */
export const textButton: CSSProperties = {
  border: 0,
  background: "none",
  padding: 0,
  font: "inherit",
  color: "var(--tc-accent-text, light-dark(#2456d6, #8ab4ff))",
  textDecoration: "underline",
  textUnderlineOffset: 2,
  cursor: "pointer",
};

/** A sample card or post the component sits in */
export const surface: CSSProperties = {
  background: "var(--tc-surface-raised, light-dark(#ffffff, #19191b))",
  border: "1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e))",
  color: "var(--tc-text-primary, light-dark(#171717, #ededed))",
};

/** A user's chat bubble */
export const bubble: CSSProperties = {
  background: "var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))",
  color: "var(--tc-text-primary, light-dark(#171717, #ededed))",
};
