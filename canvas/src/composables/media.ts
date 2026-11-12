import { onScopeDispose, ref, type Ref } from "vue";

/** Whether a media query matches, kept current */
export function useMedia(query: string): Ref<boolean> {
  const list = typeof matchMedia === "function" ? matchMedia(query) : null;
  const matches = ref(list?.matches ?? false);
  const on = (e: MediaQueryListEvent) => (matches.value = e.matches);
  list?.addEventListener("change", on);
  onScopeDispose(() => list?.removeEventListener("change", on));
  return matches;
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
