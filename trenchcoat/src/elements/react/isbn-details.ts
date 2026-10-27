import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcIsbnDetails, type IsbnCopyDetail, type IsbnLookupDetail, type IsbnOpenChange } from "../isbn-details";
import { h } from "./internal";

export type { IsbnBook, IsbnCopyDetail, IsbnLookupDetail, IsbnMatch, IsbnParts, IsbnResolver } from "../isbn-details";
export { findIsbns, isValidIsbn, parseIsbn } from "../isbn-details";

const RawIsbnDetails = createComponent({
  tagName: "tc-isbn-details",
  elementClass: TcIsbnDetails,
  react: React,
  events: {
    onTcIsbnLookup: "tc-isbn-lookup" as EventName<CustomEvent<IsbnLookupDetail>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<IsbnCopyDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<IsbnOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawIsbnDetails>;
type Wrapped = "onTcIsbnLookup" | "onTcCopy" | "onTcOpenChange" | "onCopy" | "children";
export type IsbnDetailsProps = Omit<RawProps, Wrapped> & {
  /** Called when a card needs a book's details; call `detail.respondWith(book | promise)` to answer, or use `resolve` instead */
  onLookup?: (detail: IsbnLookupDetail, event: CustomEvent<IsbnLookupDetail>) => void;
  /** Called when Copy is pressed; return false to stop the component writing to the clipboard itself */
  onCopy?: (text: string, form: "isbn13" | "isbn10") => boolean | void;
  /** Called with the ISBN-13 whose card opened, or null when it closed */
  onOpenChange?: (isbn13: string | null) => void;
};

/** ISBN numbers in text, validated and marked: hover or focus one for the book's details */
export function IsbnDetails({ onLookup, onCopy, onOpenChange, ...props }: IsbnDetailsProps) {
  return h(RawIsbnDetails, {
    ...props,
    onTcIsbnLookup: (e: CustomEvent<IsbnLookupDetail>) => onLookup?.(e.detail, e),
    onTcCopy: (e: CustomEvent<IsbnCopyDetail>) => {
      if (onCopy?.(e.detail.text, e.detail.form) === false) e.preventDefault();
    },
    onTcOpenChange: (e: CustomEvent<IsbnOpenChange>) => onOpenChange?.(e.detail.isbn13),
  });
}
