import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcIntegrationPicker, integrationPickerDefaults, type IntegrationPickerItem } from "../integration-picker";
import { h, isNode, useControlled, useStaged } from "./internal";

/** An integration; its icon may be a React node */
export type Integration = Omit<IntegrationPickerItem, "icon"> & { icon?: React.ReactNode };

/** Sample services – company marks from Simple Icons (CC0) */
export const defaultIntegrations: Integration[] = integrationPickerDefaults as Integration[];

const RawIntegrationPicker = createComponent({
  tagName: "tc-integration-picker",
  elementClass: TcIntegrationPicker,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<{ selected: string }>>,
    onTcConnectedChange: "tc-connected-change" as EventName<CustomEvent<{ connected: string[] }>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<{ query: string }>>,
    onTcExplore: "tc-explore" as EventName<CustomEvent<{ id: string }>>,
    onTcBack: "tc-back" as EventName<CustomEvent<object>>,
    onTcClose: "tc-close" as EventName<CustomEvent<object>>,
  },
});
type RawIntegrationPickerProps = React.ComponentProps<typeof RawIntegrationPicker>;

export type IntegrationPickerOwnProps = {
  /** The services to list – the sample services by default */
  integrations?: Integration[];
  /** Your product's name in the details, e.g. "Trenchcoat + Linear" */
  appName?: string;
  /** Your product's mark on the black tile – the Trenchcoat mark by default */
  appIcon?: React.ReactNode;
  /** Id of the picked integration. Controlled when defined; otherwise starts at `defaultSelected` */
  selected?: string;
  /** Id of the integration that is picked first */
  defaultSelected?: string;
  /** Called with the id of the integration picked by click or arrow key */
  onSelectedChange?: (id: string) => void;
  /** Ids of the connected integrations. Controlled when defined; otherwise starts at `defaultConnected`, or at the
   *  integrations marked `connected` (and follows those flags when they change) */
  connected?: string[];
  /** The connected ids on mount when `connected` isn't controlled */
  defaultConnected?: string[];
  /** Called with every connected id after an integration is switched on or off */
  onConnectedChange?: (ids: string[]) => void;
  /** The search text. Controlled when defined; otherwise starts at `defaultQuery` */
  query?: string;
  /** The search text on mount when `query` isn't controlled */
  defaultQuery?: string;
  /** Called with the search text as it's typed or cleared */
  onQueryChange?: (query: string) => void;
  /** Called with the id and the new state when an integration is switched on or off. May return a promise (the
   *  real connect): the switch shows that it's working and flips when it resolves; a rejection leaves it as it was
   *  and says so, to try again. The signal aborts when the picker unmounts */
  onToggle?: (id: string, connected: boolean, options: { signal: AbortSignal }) => void | Promise<unknown>;
  /** Window shortcut that jumps into the search: "mod+/" (⌘/ on Apple devices, Ctrl / elsewhere) by default, any
   *  other combination, or false for none */
  hotkey?: string | false;
  /** Runs with the picked integration's id when "Explore integration" is pressed */
  onExplore?: (id: string) => void;
  /** Shows the back button and runs on ← in an empty search */
  onBack?: () => void;
  /** Runs on Esc in an empty search */
  onClose?: () => void;
};
export type IntegrationPickerProps = Omit<
  RawIntegrationPickerProps,
  keyof IntegrationPickerOwnProps | "back" | "onTcSelectedChange" | "onTcConnectedChange" | "onTcQueryChange" | "onTcExplore" | "onTcBack" | "onTcClose"
> &
  IntegrationPickerOwnProps;

/** useControlled, plus the element's own value while uncontrolled – @lit/react sets every prop on each render */
function useValue<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const c = useControlled(value, defaultValue, onChange);
  const own = React.useRef(defaultValue);
  return {
    value: c.controlled ? c.value : own.current,
    controlled: c.controlled,
    handler: (next: T, e: Event) => {
      c.handler(next, e);
      if (!c.controlled) own.current = next;
    },
  };
}

export function IntegrationPicker({
  integrations = defaultIntegrations,
  appName = "Trenchcoat",
  appIcon,
  selected,
  defaultSelected,
  onSelectedChange,
  connected,
  defaultConnected,
  onConnectedChange,
  query,
  defaultQuery = "",
  onQueryChange,
  onToggle,
  hotkey = "mod+/",
  onExplore,
  onBack,
  onClose,
  ...props
}: IntegrationPickerProps) {
  const nodes: [string, React.ReactNode][] = [];
  if (isNode(appIcon)) nodes.push(["app", appIcon]);
  integrations.forEach((it) => isNode(it.icon) && nodes.push([`icon:${it.id}`, it.icon]));
  const { stage, els } = useStaged(nodes);
  const items = React.useMemo(
    () => integrations.map((it) => (it.icon === undefined ? it : { ...it, icon: isNode(it.icon) ? els[`icon:${it.id}`] : it.icon })) as IntegrationPickerItem[],
    [integrations, els],
  );
  const s = useValue<string | undefined>(selected, defaultSelected ?? integrations[0]?.id, onSelectedChange as ((id: string | undefined) => void) | undefined);
  const q = useValue(query, defaultQuery, onQueryChange);
  // Connected: controlled; or kept by the wrapper from defaultConnected; or (neither) left to the element, which
  // follows the integrations' flags
  const c = useValue<string[] | undefined>(connected, defaultConnected, onConnectedChange as ((ids: string[] | undefined) => void) | undefined);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawIntegrationPicker, {
      ...props,
      integrations: items,
      appName,
      appIcon: isNode(appIcon) ? els.app : (appIcon as Element | undefined),
      selected: s.value,
      query: q.value,
      connected: c.value,
      onToggle,
      hotkey,
      back: !!onBack,
      onTcSelectedChange: (e: CustomEvent<{ selected: string }>) => s.handler(e.detail.selected, e),
      onTcQueryChange: (e: CustomEvent<{ query: string }>) => q.handler(e.detail.query, e),
      onTcConnectedChange: (e: CustomEvent<{ connected: string[] }>) => {
        if (c.controlled || defaultConnected !== undefined) c.handler(e.detail.connected, e);
        else onConnectedChange?.(e.detail.connected);
      },
      onTcExplore: (e: CustomEvent<{ id: string }>) => onExplore?.(e.detail.id),
      onTcBack: () => onBack?.(),
      onTcClose: () => onClose?.(),
    }),
  );
}
