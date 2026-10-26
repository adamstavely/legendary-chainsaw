/* useHotkey – window shortcuts with one listener per combination, however many components (and published files) use it */
import { useEffect, useRef } from "react";

type Combo = { key: string; mod: boolean; ctrl: boolean; meta: boolean; shift: boolean; alt: boolean };
/** "mod+k", "ctrl+shift+p", "F8" – mod is ⌘ on Apple devices and Ctrl elsewhere */
const parseCombo = (combo: string): Combo => {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const key = parts.pop() || "+";
  const has = (m: string) => parts.includes(m);
  return { key, mod: has("mod"), ctrl: has("ctrl") || has("control"), meta: has("meta") || has("cmd"), shift: has("shift"), alt: has("alt") || has("option") };
};
const comboMatches = (e: globalThis.KeyboardEvent, c: Combo) => {
  if (e.key.toLowerCase() !== c.key && e.code.toLowerCase() !== c.key) return false;
  if (c.mod ? !(e.metaKey || e.ctrlKey) : (c.ctrl && !e.ctrlKey) || (c.meta && !e.metaKey)) return false;
  if (!c.mod && !c.ctrl && !c.meta && (e.ctrlKey || e.metaKey)) return false;
  return (!c.shift || e.shiftKey) && (!c.alt || e.altKey);
};

/** A handler may return false to say it didn't act – the next one (older instance) gets a turn */
type Handler = () => boolean | void;
type Entry = { handlers: Handler[]; listener: (e: globalThis.KeyboardEvent) => void };
// Kept on globalThis so every published file shares it: two menus from two files still mean one listener
const registry = ((globalThis as { [k: symbol]: Map<string, Entry> })[Symbol.for("trenchcoat.hotkeys")] ??= new Map<string, Entry>());

/**
 * Runs `run` when `combo` is pressed anywhere on the page. `false` registers nothing and never calls preventDefault.
 * The newest instance wins; IME composition and already-handled events are ignored.
 */
export function useHotkey(combo: string | false | null | undefined, run: Handler) {
  const latest = useRef(run);
  latest.current = run;
  useEffect(() => {
    if (!combo) return;
    const name = combo.toLowerCase().replace(/\s+/g, "");
    let entry = registry.get(name);
    if (!entry) {
      const parsed = parseCombo(name);
      const handlers: Handler[] = [];
      const listener = (e: globalThis.KeyboardEvent) => {
        if (e.defaultPrevented || e.isComposing || !comboMatches(e, parsed)) return;
        for (let i = handlers.length - 1; i >= 0; i--) {
          if (handlers[i]() !== false) {
            e.preventDefault();
            return;
          }
        }
      };
      window.addEventListener("keydown", listener);
      registry.set(name, (entry = { handlers, listener }));
    }
    const own = entry;
    const handler: Handler = () => latest.current();
    own.handlers.push(handler);
    return () => {
      own.handlers.splice(own.handlers.indexOf(handler), 1);
      if (!own.handlers.length) {
        window.removeEventListener("keydown", own.listener);
        registry.delete(name);
      }
    };
  }, [combo]);
}
