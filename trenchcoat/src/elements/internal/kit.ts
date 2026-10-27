/*
 * Small pieces several components shared as copies. The CSS is adopted once for every element (base.ts), before any
 * component's own sheet, so a component's rule of the same specificity still adjusts a piece.
 *   · .tc-sr-only – visually hidden, still read (status regions, extra words for a button's name)
 *   · .tc-btn-sm – the small secondary button (--tc-control-h-sm, the secondary action recipe)
 */
export const kitCss = /* css */ `
.tc-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.tc-btn-sm { display: inline-flex; flex: none; align-items: center; justify-content: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.tc-btn-sm:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.tc-btn-sm:active { transform: scale(0.98); }
.tc-btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
.tc-btn-sm:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@media (prefers-reduced-motion: reduce) { .tc-btn-sm { transition: none; } }
@media (forced-colors: active) { .tc-btn-sm { border: 1px solid ButtonText; } }
`;
