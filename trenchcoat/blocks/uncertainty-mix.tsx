"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import { UncertaintyMix as TcUncertaintyMix, defaultUncertaintyKinds, type Look, type UncertaintyKind, type UncertaintySource } from "trenchcoat/react";

/*
 * Uncertainty Mix – where an answer's uncertainty comes from. Not all uncertainty is the same: some would shrink with
 * more information, some can't be known yet, some is past what the model knows – and each asks for something
 * different. A reading card (the whole answer's mix, what each kind means and what to do) beside the library's
 * Breakdown Chart of the same mix per part of the answer – hide a kind in the chart's legend and the reading follows.
 * The block is the <tc-uncertainty-mix> element through `trenchcoat/react` – the same component Angular, Vue and
 * plain HTML get – kept here with its original props. The look follows the nearest <LookProvider>, or the `look` prop.
 */

export type { UncertaintyKind, UncertaintySource } from "trenchcoat/react";

type OwnProps = {
  sources: UncertaintySource[];
  /** The kinds, in display order – missing information, inherent uncertainty and model limits by default */
  kinds?: UncertaintyKind[];
  /** The parts in display order – by first appearance in `sources` by default */
  parts?: string[];
  /** What a part is called, e.g. "Section" or "Claim" – "Part of the answer" by default */
  partLabel?: string;
  /** Keys of the kinds hidden from the chart and the reading (controlled) */
  hidden?: string[];
  /** Hidden at first when uncontrolled */
  defaultHidden?: string[];
  /** Called when the chart's legend hides or shows kinds */
  onHiddenChange?: (keys: string[]) => void;
  /** The reading card's heading – "Uncertainty mix" by default */
  title?: string;
  /** The line under it, e.g. "Current session" */
  subtitle?: string;
  /** The chart's heading – "By part of the answer" by default */
  chartTitle?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element – the <tc-uncertainty-mix> element */
  ref?: Ref<HTMLDivElement>;
};

export type UncertaintyMixProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export const DEFAULT_KINDS: UncertaintyKind[] = defaultUncertaintyKinds;

export function UncertaintyMix({
  sources,
  kinds = DEFAULT_KINDS,
  parts,
  partLabel = "Part of the answer",
  hidden,
  defaultHidden,
  onHiddenChange,
  title,
  subtitle,
  chartTitle = "By part of the answer",
  look,
  className,
  ref,
  ...rest
}: UncertaintyMixProps) {
  return (
    <TcUncertaintyMix
      // The block's DOM props land on the element, its root
      {...(rest as object)}
      ref={ref as Ref<never>}
      className={["ui-umix", className].filter(Boolean).join(" ")}
      look={look}
      sources={sources}
      kinds={kinds}
      parts={parts}
      partLabel={partLabel}
      hidden={hidden}
      defaultHidden={defaultHidden}
      onHiddenChange={onHiddenChange}
      title={title}
      subtitle={subtitle}
      chartTitle={chartTitle}
    />
  );
}
