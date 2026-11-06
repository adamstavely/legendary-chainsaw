/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/core/i18n.ts. */
/*
 * The words the charts write themselves (tooltip names, screen-reader sentences, buttons) that every chart shares.
 * Words only one chart uses live in that chart's file.
 */

/** English plurals: plural(3, "item") → "3 items" */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** The words every chart uses */
export const en = {
  /** aria-roledescription */
  chart: "chart",
  /** The screen-reader table's caption */
  table: (label: string) => `${label} data`,
  /** The last row when the table is cut short */
  more: (n: number) => `and ${n} more`,
  /** The value's name in the tooltip */
  value: "Value",
  /** The screen-reader description when there's no data */
  empty: "No data.",
};

export type ChartMessages = typeof en;
