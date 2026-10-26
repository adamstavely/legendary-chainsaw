/* useRootRef – the component's own ref and the caller's `ref` prop on one element */
import { useCallback, type Ref } from "react";

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
export function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}
