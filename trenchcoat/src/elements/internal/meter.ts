import { html, type TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

/*
 * What the meters share – Meter Row, Usage Meter and Rate Limit Status: how full a value is against a warning and a
 * danger threshold, and the role="meter" element with its ARIA values. What sits inside the meter, and how it looks,
 * stays each element's own.
 *
 *   const tone = meterTone(used / limit, 0.8, 1);   // "normal" | "warning" | "danger"
 *   meterBar({ cls: "ui-x__meter", labelledBy: id, max: limit, now: used, valueText: "812 of 1,000", content: fill })
 */

export type MeterTone = "normal" | "warning" | "danger";

/** "warning" from `warnAt` and "danger" from `dangerAt` – fractions of the limit; reaching one counts */
export function meterTone(ratio: number, warnAt: number, dangerAt: number): MeterTone {
  if (ratio >= dangerAt) return "danger";
  return ratio >= warnAt ? "warning" : "normal";
}

export type MeterBarOptions = {
  /** The meter element's class */
  cls: string;
  /** "span" where the meter sits in inline content; a "div" otherwise */
  tag?: "div" | "span";
  /** The id of what names the meter; without it, `label` names it */
  labelledBy?: string;
  /** The meter's name, when nothing on the page names it */
  label?: string;
  max: number;
  now: number;
  valueText: string;
  /** What's drawn inside: the fill, and anything else the element shows in the meter */
  content: unknown;
};

/**
 * The role="meter" element, its minimum 0. The role is set through the ARIA-reflecting `role` property, because
 * lit-analyzer's list of roles predates ARIA 1.2's meter.
 */
export function meterBar(o: MeterBarOptions): TemplateResult {
  const name = o.labelledBy ? undefined : o.label;
  return o.tag === "span"
    ? html`<span
        class=${o.cls}
        .role=${"meter"}
        aria-labelledby=${ifDefined(o.labelledBy)}
        aria-label=${ifDefined(name)}
        aria-valuemin="0"
        aria-valuemax=${o.max}
        aria-valuenow=${o.now}
        aria-valuetext=${o.valueText}
        >${o.content}</span
      >`
    : html`<div
        class=${o.cls}
        .role=${"meter"}
        aria-labelledby=${ifDefined(o.labelledBy)}
        aria-label=${ifDefined(name)}
        aria-valuemin="0"
        aria-valuemax=${o.max}
        aria-valuenow=${o.now}
        aria-valuetext=${o.valueText}
      >${o.content}</div>`;
}
