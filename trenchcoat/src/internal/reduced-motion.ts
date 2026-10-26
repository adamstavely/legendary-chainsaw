/* Whether the user asked for reduced motion – safe to call during SSR */
export const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
