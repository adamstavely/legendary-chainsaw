import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcApiReferenceNav, type ApiNavCollapsedChange, type ApiNavNavigate, type ApiNavQueryChange, type ApiNavShowPathsChange } from "../api-reference-nav";
import { h, useControlled } from "./internal";

export type { ApiEndpoint, ApiMethod, ApiNavCollapsedChange, ApiNavGroup, ApiNavLabels, ApiNavNavigate, ApiNavQueryChange, ApiNavShowPathsChange } from "../api-reference-nav";
export { apiEndpointMatches, apiMethodTone, defaultApiNavLabels } from "../api-reference-nav";

const RawApiReferenceNav = createComponent({
  tagName: "tc-api-reference-nav",
  elementClass: TcApiReferenceNav,
  react: React,
  events: {
    onTcNavigate: "tc-navigate" as EventName<CustomEvent<ApiNavNavigate>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<ApiNavQueryChange>>,
    onTcShowPathsChange: "tc-show-paths-change" as EventName<CustomEvent<ApiNavShowPathsChange>>,
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<ApiNavCollapsedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawApiReferenceNav>;
export type ApiReferenceNavProps = Omit<
  RawProps,
  "heading" | "current" | "query" | "showPaths" | "collapsed" | "onTcNavigate" | "onTcQueryChange" | "onTcShowPathsChange" | "onTcCollapsedChange"
> & {
  /** The header's title */
  title?: string;
  /** The current endpoint's id – controlled when given; your router sets it */
  current?: string | null;
  /** The current endpoint at first, when `current` isn't controlled; then a click moves it */
  defaultCurrent?: string | null;
  /** An endpoint was chosen; call `event.preventDefault()` to route a link yourself instead of following it */
  onNavigate?: (id: string, href: string | undefined, event: CustomEvent<ApiNavNavigate>) => void;
  /** The filter's text – controlled when given */
  query?: string;
  /** The filter's text at first, when `query` isn't controlled */
  defaultQuery?: string;
  /** Called with the filter's new text */
  onQueryChange?: (query: string) => void;
  /** Paths instead of names – controlled when given */
  showPaths?: boolean;
  /** Paths at first, when `showPaths` isn't controlled */
  defaultShowPaths?: boolean;
  /** Called when the Paths switch is pressed */
  onShowPathsChange?: (showPaths: boolean) => void;
  /** The ids of closed groups – controlled when given */
  collapsed?: string[];
  /** The closed groups at first, when `collapsed` isn't controlled */
  defaultCollapsed?: string[];
  /** Called with the closed groups after one is opened or closed */
  onCollapsedChange?: (collapsed: string[]) => void;
};

const NONE: string[] = [];

/** An API reference's side navigation: endpoints grouped by resource, with method badges, a filter and the current page */
export function ApiReferenceNav({
  title,
  current,
  defaultCurrent = null,
  onNavigate,
  query,
  defaultQuery = "",
  onQueryChange,
  showPaths,
  defaultShowPaths = false,
  onShowPathsChange,
  collapsed,
  defaultCollapsed = NONE,
  onCollapsedChange,
  ...props
}: ApiReferenceNavProps) {
  // Not useControlled for current: that prevents the event when controlled, which would also stop a link being followed
  const [own, setOwn] = React.useState(defaultCurrent);
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  const p = useControlled<boolean>(showPaths, defaultShowPaths, onShowPathsChange);
  const c = useControlled<string[]>(collapsed, defaultCollapsed, onCollapsedChange);
  return h(RawApiReferenceNav, {
    ...props,
    heading: title ?? "API reference",
    current: current !== undefined ? current : own,
    query: q.value,
    showPaths: p.value,
    collapsed: c.value,
    onTcNavigate: (e: CustomEvent<ApiNavNavigate>) => {
      onNavigate?.(e.detail.id, e.detail.href, e);
      if (current === undefined && !e.defaultPrevented) setOwn(e.detail.id);
    },
    onTcQueryChange: (e: CustomEvent<ApiNavQueryChange>) => q.handler(e.detail.query, e),
    onTcShowPathsChange: (e: CustomEvent<ApiNavShowPathsChange>) => p.handler(e.detail.showPaths, e),
    onTcCollapsedChange: (e: CustomEvent<ApiNavCollapsedChange>) => c.handler(e.detail.collapsed, e),
  });
}
