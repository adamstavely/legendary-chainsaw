"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import { EvidenceGallery as TcEvidenceGallery, type Attestation, type EvidenceFilter, type EvidenceItem, type Look } from "trenchcoat/react";

/*
 * Evidence Gallery – the images behind a set of claims, with whether each is attested and how many claims lean on
 * it: a filter by attestation with a count on each, the library's Image Grid (alt text, Compare and Download) and
 * the library's Data Table, read only and sortable, in the same order.
 * The block is the <tc-evidence-gallery> element through `trenchcoat/react` – the same component Angular, Vue and
 * plain HTML get – kept here with its original props. The look follows the nearest <LookProvider>, or the `look` prop.
 */

export type { Attestation, EvidenceFilter, EvidenceItem } from "trenchcoat/react";

type OwnProps = {
  items: EvidenceItem[];
  /** Which items show (controlled) */
  filter?: EvidenceFilter;
  /** The filter at first when uncontrolled – "all" by default */
  defaultFilter?: EvidenceFilter;
  /** Called when another filter is picked */
  onFilterChange?: (filter: EvidenceFilter) => void;
  /** An alt text was edited in the grid: the item with its new alt text */
  onAltChange?: (item: EvidenceItem, alt: string) => void;
  /** Words for the attestation states – "Attested", "Unverified", "Failed" by default */
  attestationLabels?: Partial<Record<Attestation, string>>;
  /** The grid's heading – "Evidence" by default */
  title?: string;
  /** A line under the grid's heading, e.g. the case or report it belongs to */
  subtitle?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element – the <tc-evidence-gallery> element */
  ref?: Ref<HTMLDivElement>;
};

export type EvidenceGalleryProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export function EvidenceGallery({ items, filter, defaultFilter, onFilterChange, onAltChange, attestationLabels, title, subtitle, look, className, ref, ...rest }: EvidenceGalleryProps) {
  return (
    <TcEvidenceGallery
      // The block's DOM props land on the element, its root
      {...(rest as object)}
      ref={ref as Ref<never>}
      className={["ui-evg", className].filter(Boolean).join(" ")}
      look={look}
      items={items}
      filter={filter}
      defaultFilter={defaultFilter}
      onFilterChange={onFilterChange}
      onAltChange={onAltChange}
      attestationLabels={attestationLabels ?? {}}
      title={title}
      subtitle={subtitle}
    />
  );
}
