import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAccessGrants, type AccessGrant, type AccessGrantDriftReview, type AccessGrantRenew, type AccessGrantRevoke, type AccessGrantsFilter, type AccessGrantsFilterChange } from "../access-grants";
import { h, useControlled } from "./internal";

export type {
  AccessGrant,
  AccessGrantDriftReview,
  AccessGrantLevel,
  AccessGrantRenew,
  AccessGrantRevoke,
  AccessGrantsFilter,
  AccessGrantsFilterChange,
  AccessGrantsLabels,
} from "../access-grants";
export { defaultAccessGrantsLabels } from "../access-grants";

const RawAccessGrants = createComponent({
  tagName: "tc-access-grants",
  elementClass: TcAccessGrants,
  react: React,
  events: {
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<AccessGrantsFilterChange>>,
    onTcRevoke: "tc-revoke" as EventName<CustomEvent<AccessGrantRevoke>>,
    onTcRenew: "tc-renew" as EventName<CustomEvent<AccessGrantRenew>>,
    onTcDriftReview: "tc-drift-review" as EventName<CustomEvent<AccessGrantDriftReview>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAccessGrants>;
type Owned = "heading" | "grants" | "filter" | "onTcFilterChange" | "onTcRevoke" | "onTcRenew" | "onTcDriftReview" | "children";
export type AccessGrantsProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The grants. A revoke or a refused change takes the grant out of the list shown, until `grants` changes */
  grants?: AccessGrant[];
  /** Which grants show – controlled when given */
  filter?: AccessGrantsFilter;
  /** The tab on mount, when `filter` isn't controlled */
  defaultFilter?: AccessGrantsFilter;
  /** A tab was chosen */
  onFilterChange?: (filter: AccessGrantsFilter) => void;
  /** Revoke was confirmed; return false to keep the grant in the list */
  onRevoke?: (grant: AccessGrant) => boolean | void;
  /** Renew was pressed – give the grant a new `expiresAt` */
  onRenew?: (grant: AccessGrant) => void;
  /** A changed grant was reviewed: accepted, or refused (which revokes it); return false to leave it as it is */
  onDriftReview?: (grant: AccessGrant, accepted: boolean) => boolean | void;
};

export function AccessGrants({ title, grants = [], filter, defaultFilter = "all", onFilterChange, onRevoke, onRenew, onDriftReview, ...props }: AccessGrantsProps) {
  const f = useControlled<AccessGrantsFilter>(filter, defaultFilter, onFilterChange);
  // The list shown: the page's grants, less what was revoked here since they last changed
  const [source, setSource] = React.useState(grants);
  const [list, setList] = React.useState(grants);
  if (grants !== source) {
    setSource(grants);
    setList(grants);
  }
  return h(RawAccessGrants, {
    ...props,
    heading: title ?? "Access",
    grants: list,
    filter: f.value,
    onTcFilterChange: (e: CustomEvent<AccessGrantsFilterChange>) => f.handler(e.detail.filter, e),
    onTcRevoke: (e: CustomEvent<AccessGrantRevoke>) => {
      if (onRevoke?.(e.detail.grant) === false) e.preventDefault();
      else setList((l) => l.filter((g) => g.id !== e.detail.grant.id));
    },
    onTcRenew: (e: CustomEvent<AccessGrantRenew>) => onRenew?.(e.detail.grant),
    onTcDriftReview: (e: CustomEvent<AccessGrantDriftReview>) => {
      const { grant, accepted } = e.detail;
      if (onDriftReview?.(grant, accepted) === false) {
        e.preventDefault();
        return;
      }
      setList((l) =>
        accepted
          ? l.map((g) => {
              if (g.id !== grant.id) return g;
              const next = { ...g };
              delete next.changed;
              return next;
            })
          : l.filter((g) => g.id !== grant.id),
      );
    },
  });
}
