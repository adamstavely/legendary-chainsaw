// Importing the element during server rendering, where there's no DOM, mustn't throw. Lit stubs this the same way.
if (typeof HTMLElement === "undefined") {
  (globalThis as { HTMLElement?: unknown }).HTMLElement = class {};
}
