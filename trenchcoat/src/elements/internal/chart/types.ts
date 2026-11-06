/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/core/types.ts. */
/** The data and event shapes the charts share – the React-only props are left behind */
import type { EasingName } from "./motion";

/** A field name (dot paths allowed) or a function */
export type Accessor<T, R = unknown> = string | ((d: T, i: number) => R);

/**
 * What to emphasise: an index, a label, a list of them, "max" | "min" | "first" | "last" | "none", or a predicate
 */
export type Highlight<T = unknown> = number | string | ReadonlyArray<number | string> | ((d: T, i: number) => boolean);

export interface ChartEvent<T = unknown> {
  /** The data item; null for a total or other computed item */
  datum: T | null;
  index: number;
  key: string;
  label: string;
  value: number | null;
  series?: string;
  /** The value as shown */
  formatted?: string;
}

export interface TooltipRow {
  label?: string;
  value: string;
  /** Its fill (a CSS colour) */
  color?: string;
  strong?: boolean;
}

export interface TooltipData {
  x: number;
  y: number;
  title: string;
  rows: TooltipRow[];
}

export interface AnimationOptions {
  /** Entrance and transition animation. Default true */
  animate?: boolean;
  /** Length (ms). Default 900 */
  duration?: number;
  /** Default "spring" */
  easing?: EasingName;
  /** Delay between items (ms); the default differs per chart */
  stagger?: number;
  /** Plays again from the start when it changes */
  replayKey?: string | number;
  /** "auto" follows the system's reduced-motion setting; true always off, false always on. Default "auto" */
  reducedMotion?: "auto" | boolean;
  /** Plays when it comes into view; false plays on first render. Default true */
  animateOnView?: boolean;
}

export type Row = Record<string, unknown>;
