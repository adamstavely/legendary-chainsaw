import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcBibliography,
  type BibliographyCitationStyleChange,
  type BibliographyCopy,
  type BibliographyExport,
  type BibliographySelectedChange,
  type BibliographySort,
  type BibliographySortChange,
  type CitationStyle,
} from "../bibliography";
import { h, useControlled } from "./internal";

export type {
  BibliographyCopy,
  BibliographyExport,
  BibliographyExportFormat,
  BibliographySort,
  CitationStyle,
  Reference,
  ReferenceAuthor,
  ReferenceType,
} from "../bibliography";
export {
  citationStyleNames,
  formatReference,
  toBibTeX,
  toRIS,
} from "../bibliography";

const RawBibliography = createComponent({
  tagName: "tc-bibliography",
  elementClass: TcBibliography,
  react: React,
  events: {
    onTcCitationStyleChange: "tc-citation-style-change" as EventName<
      CustomEvent<BibliographyCitationStyleChange>
    >,
    onTcSelectedChange: "tc-selected-change" as EventName<
      CustomEvent<BibliographySelectedChange>
    >,
    onTcSortChange: "tc-sort-change" as EventName<
      CustomEvent<BibliographySortChange>
    >,
    onTcCopy: "tc-copy" as EventName<CustomEvent<BibliographyCopy>>,
    onTcExport: "tc-export" as EventName<CustomEvent<BibliographyExport>>,
  },
});
type RawProps = React.ComponentProps<typeof RawBibliography>;
type Owned =
  | "heading"
  | "citationStyle"
  | "selected"
  | "sort"
  | "onTcCitationStyleChange"
  | "onTcSelectedChange"
  | "onTcSortChange"
  | "onTcCopy"
  | "onTcExport"
  | "children";
export type BibliographyProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The citation style – controlled when given */
  citationStyle?: CitationStyle;
  /** The style on mount when `citationStyle` isn't controlled */
  defaultCitationStyle?: CitationStyle;
  /** The style changed */
  onCitationStyleChange?: (style: CitationStyle) => void;
  /** The ticked references' ids – controlled when given */
  selected?: string[];
  /** The ticked references on mount when `selected` isn't controlled */
  defaultSelected?: string[];
  /** References were ticked or unticked */
  onSelectedChange?: (selected: string[]) => void;
  /** The order – controlled when given */
  sort?: BibliographySort;
  /** The order on mount when `sort` isn't controlled */
  defaultSort?: BibliographySort;
  /** The order changed */
  onSortChange?: (sort: BibliographySort) => void;
  /** References were copied; `event.preventDefault()` stops the copy */
  onCopyReferences?: (
    detail: BibliographyCopy,
    event: CustomEvent<BibliographyCopy>,
  ) => void;
  /** Export was chosen; `event.preventDefault()` to save it your own way */
  onExport?: (
    detail: BibliographyExport,
    event: CustomEvent<BibliographyExport>,
  ) => void;
};

const NONE: string[] = [];

export function Bibliography({
  title,
  citationStyle,
  defaultCitationStyle = "apa",
  onCitationStyleChange,
  selected,
  defaultSelected = NONE,
  onSelectedChange,
  sort,
  defaultSort = "author",
  onSortChange,
  onCopyReferences,
  onExport,
  ...props
}: BibliographyProps) {
  const st = useControlled<CitationStyle>(
    citationStyle,
    defaultCitationStyle,
    onCitationStyleChange,
  );
  const sel = useControlled<string[]>(
    selected,
    defaultSelected,
    onSelectedChange,
  );
  const so = useControlled<BibliographySort>(sort, defaultSort, onSortChange);
  return h(RawBibliography, {
    ...props,
    heading: title ?? "Bibliography",
    citationStyle: st.value,
    selected: sel.value,
    sort: so.value,
    onTcCitationStyleChange: (
      e: CustomEvent<BibliographyCitationStyleChange>,
    ) => st.handler(e.detail.citationStyle, e),
    onTcSelectedChange: (e: CustomEvent<BibliographySelectedChange>) =>
      sel.handler(e.detail.selected, e),
    onTcSortChange: (e: CustomEvent<BibliographySortChange>) =>
      so.handler(e.detail.sort, e),
    onTcCopy: (e: CustomEvent<BibliographyCopy>) =>
      onCopyReferences?.(e.detail, e),
    onTcExport: (e: CustomEvent<BibliographyExport>) => onExport?.(e.detail, e),
  });
}
