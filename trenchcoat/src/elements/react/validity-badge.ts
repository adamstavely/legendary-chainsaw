import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcValidityBadge, type ValidityLocateDetail } from "../validity-badge";
import { h } from "./internal";

export type { ValidityBand, ValidityInfo, ValidityLocateDetail, ValidityProfile, ValidityProfileName, ValidityTime } from "../validity-badge";
export { VALIDITY_BANDS, VALIDITY_PROFILES, validityAge, validityBand, validityTime } from "../validity-badge";

const RawValidityBadge = createComponent({
  tagName: "tc-validity-badge",
  elementClass: TcValidityBadge,
  react: React,
  events: {
    onTcLocate: "tc-locate" as EventName<CustomEvent<ValidityLocateDetail>>,
  },
});
type RawValidityBadgeProps = React.ComponentProps<typeof RawValidityBadge>;
export type ValidityBadgeProps = Omit<RawValidityBadgeProps, "for" | "onTcLocate"> & {
  /** Strip: the id of the document whose paragraphs the bars line up with (the element's `for`) */
  htmlFor?: string;
  /** Strip: called when a bar is clicked or activated from the keyboard, with the paragraph it stands for */
  onLocate?: (detail: ValidityLocateDetail) => void;
};

export function ValidityBadge({ htmlFor, onLocate, ...props }: ValidityBadgeProps) {
  return h(RawValidityBadge, {
    ...props,
    for: htmlFor ?? "",
    onTcLocate: (e: CustomEvent<ValidityLocateDetail>) => onLocate?.(e.detail),
  });
}
