import { ref, watch, type Ref } from "vue";

// Per-viewer conveniences (layout, theme, where cards were dragged) kept in localStorage. Storage can be missing or
// throw – private windows, blocked site data – so every read and write is guarded and the app works without it.
const KEY = "trenchcoat-canvas:";

function read<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(KEY + key);
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/** A ref that starts from storage and is saved back whenever it changes; `valid` rejects stale or edited values */
export function persisted<T>(key: string, fallback: T, valid: (value: unknown) => value is T): Ref<T> {
  const value = ref(read(key, fallback, valid)) as Ref<T>;
  watch(
    value,
    (next) => {
      try {
        localStorage.setItem(KEY + key, JSON.stringify(next));
      } catch {
        // Not saved; the value still holds for this visit
      }
    },
    { deep: true },
  );
  return value;
}

export const oneOf =
  <T extends string>(...values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (values as readonly string[]).includes(value);
