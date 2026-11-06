/*
 * Breakpoints as Loupe and Breakpoint Overlay read them: which apply at a width, which one is in force, how to say a
 * range, the media query, and each one's tone.
 */

/** A breakpoint: min-width only, max-width only, or a range between them, in px */
export type ViewBreakpoint = { id: string; label?: string; min?: number; max?: number };

/** Tailwind's breakpoints */
export const defaultBreakpoints: ViewBreakpoint[] = [
  { id: "sm", label: "Small", min: 640 },
  { id: "md", label: "Medium", min: 768 },
  { id: "lg", label: "Large", min: 1024 },
  { id: "xl", label: "Extra large", min: 1280 },
  { id: "2xl", label: "2× large", min: 1536 },
];

/** Whether a breakpoint applies at this width */
export const breakpointApplies = (bp: ViewBreakpoint, width: number) =>
  (bp.min === undefined || width >= bp.min) && (bp.max === undefined || width <= bp.max) && (bp.min !== undefined || bp.max !== undefined);

/** A breakpoint's range in words: "≥ 640 px", "≤ 767 px", "640–1023 px" */
export const breakpointRange = (bp: ViewBreakpoint) =>
  bp.min !== undefined && bp.max !== undefined ? `${bp.min}–${bp.max} px` : bp.min !== undefined ? `≥ ${bp.min} px` : bp.max !== undefined ? `≤ ${bp.max} px` : "All widths";

/** The media query for a breakpoint: "(min-width: 768px) and (max-width: 1023px)" */
export const breakpointQuery = (bp: ViewBreakpoint) =>
  [bp.min !== undefined ? `(min-width: ${bp.min}px)` : "", bp.max !== undefined ? `(max-width: ${bp.max}px)` : ""].filter(Boolean).join(" and ") || "all";

/** The one in force at this width: of those that apply, the one with the largest min (min-width lists stack up) */
export const currentBreakpoint = (bps: ViewBreakpoint[], width: number): ViewBreakpoint | null => {
  const on = bps.filter((b) => breakpointApplies(b, width));
  if (!on.length) return null;
  return on.reduce((a, b) => ((b.min ?? 0) > (a.min ?? 0) ? b : a));
};

const TONES = ["violet", "info", "pink", "amber", "teal", "success", "rose"];
/** A breakpoint's colour, from the theme's tones in list order */
export const breakpointTone = (bps: ViewBreakpoint[], id: string) => {
  const i = bps.findIndex((b) => b.id === id);
  const t = TONES[(i < 0 ? 0 : i) % TONES.length];
  return t === "info" || t === "success" ? `var(--tc-status-${t}-solid)` : `var(--tc-tone-${t}-solid)`;
};
