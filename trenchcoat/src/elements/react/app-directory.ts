import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAppDirectory, type DirectoryApp as ElementApp, type DirectoryCategory as ElementCategory, type DirectoryConnectedChange } from "../app-directory";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { DirectoryConnectedChange, DirectoryStatus } from "../app-directory";
export { defaultDirectoryApps, defaultDirectoryCategories, directoryCategoryIcons } from "../app-directory";

/** React nodes in place of elements: logos and category icons */
export type DirectoryApp = Omit<ElementApp, "logo"> & { logo?: React.ReactNode | ElementApp["logo"] };
export type DirectoryCategory = Omit<ElementCategory, "icon"> & { icon?: React.ReactNode | ElementCategory["icon"] };

const RawAppDirectory = createComponent({
  tagName: "tc-app-directory",
  elementClass: TcAppDirectory,
  react: React,
  events: {
    onTcConnectedChange: "tc-connected-change" as EventName<CustomEvent<DirectoryConnectedChange>>,
    onTcLearnMore: "tc-learn-more" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAppDirectory>;
type Owned = "heading" | "apps" | "categories" | "connected" | "onToggle" | "onTcConnectedChange" | "children";
export type AppDirectoryProps = Omit<RawProps, Owned> & {
  /** The heading, and the region's name – "Integrations" by default */
  title?: string;
  /** The apps – logos can be React nodes */
  apps?: DirectoryApp[];
  /** The categories in the side list – icons can be React nodes */
  categories?: DirectoryCategory[];
  /** Ids of the connected apps (controlled). Leave both unset to start from each app's `connected` */
  connected?: string[];
  /** The connected ids at first, when `connected` isn't set */
  defaultConnected?: string[];
  /** Called with the new list once an app is connected or disconnected */
  onConnectedChange?: (connected: string[]) => void;
  /** Called when a visitor connects or disconnects an app; return a promise for the real work (e.g. an OAuth round
   *  trip): the card shows Connecting… until it settles, and a rejection leaves the app as it was with an error */
  onToggle?: (app: DirectoryApp, connected: boolean) => void | Promise<unknown>;
};

export function AppDirectory({ title, apps, categories, connected, defaultConnected, onConnectedChange, onToggle, ...props }: AppDirectoryProps) {
  // Logos and icons given as React nodes render in the staging box; the element gets their DOM nodes
  const nodes: [string, React.ReactNode][] = [];
  for (const a of apps ?? []) if (isNode(a.logo)) nodes.push([`logo:${a.id}`, a.logo as React.ReactNode]);
  for (const c of categories ?? []) if (isNode(c.icon)) nodes.push([`icon:${c.id}`, c.icon as React.ReactNode]);
  const { stage, els } = useStaged(nodes);
  const elApps = React.useMemo(() => apps?.map((a) => (isNode(a.logo) ? { ...a, logo: els[`logo:${a.id}`] } : a)) as ElementApp[] | undefined, [apps, els]);
  const elCategories = React.useMemo(
    () => categories?.map((c) => (isNode(c.icon) ? { ...c, icon: els[`icon:${c.id}`] } : c)) as ElementCategory[] | undefined,
    [categories, els],
  );
  const c = useControlled<string[] | undefined>(connected, defaultConnected, onConnectedChange as ((next: string[] | undefined) => void) | undefined);
  // The handler gets the app back as the page gave it, with its React logo
  const toggle = onToggle ? (app: ElementApp, on: boolean) => onToggle(apps?.find((a) => a.id === app.id) ?? (app as DirectoryApp), on) : undefined;
  return h(
    React.Fragment,
    null,
    h(RawAppDirectory, {
      ...props,
      heading: title ?? "Integrations",
      ...(elApps ? { apps: elApps } : {}),
      ...(elCategories ? { categories: elCategories } : {}),
      connected: c.value,
      onToggle: toggle,
      onTcConnectedChange: (e: CustomEvent<DirectoryConnectedChange>) => c.handler(e.detail.connected, e),
    }),
    stage,
  );
}
