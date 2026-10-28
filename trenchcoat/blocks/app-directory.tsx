"use client";

import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { AppDirectory as AppDirectoryElement } from "trenchcoat/react";

/*
 * App Directory – browse, search and connect integrations: categories on the left, a grid of app cards on the right,
 * a search field and a filter menu; connecting shows a short progress state, or waits for the promise `onToggle`
 * returns. Built on the Trenchcoat element <tc-app-directory> through `trenchcoat/react` (install `trenchcoat`
 * and import its tokens.css); this file keeps the block's React API: logos and icons as React nodes, `connected` /
 * `defaultConnected` / `onConnectedChange`, `className`, DOM props and a `ref` on the root.
 */

export type App = {
  id: string;
  name: string;
  /** Who builds the integration, shown under the name */
  vendor: string;
  description: string;
  categories: string[];
  logo: ReactNode;
  /** Brand color behind the logo – leave empty for a white tile with a thin edge */
  tile?: string;
  /** Shown in the Essentials section */
  essential?: boolean;
  /** Connected at the start (when `connected` isn't passed to the directory) */
  connected?: boolean;
};

export type AppCategory = { id: string; label: string; icon: ReactNode };

type OwnProps = {
  title?: string;
  subtitle?: string;
  apps?: App[];
  categories?: AppCategory[];
  /** Ids of the connected apps (controlled) – pass `onConnectedChange` with it. Leave undefined to start from each app's `connected` */
  connected?: string[];
  defaultConnected?: string[];
  /** Called with the new list of connected ids once an app is connected or disconnected */
  onConnectedChange?: (connected: string[]) => void;
  /**
   * Called when a visitor connects or disconnects an app. Return a promise for the real work (e.g. an OAuth round
   * trip): the card shows Connecting… until it settles, and a rejection leaves the app as it was with an error to
   * retry from. Without a promise, connecting shows a short Connecting… state first.
   */
  onToggle?: (app: App, connected: boolean) => void | Promise<unknown>;
  className?: string;
  /** The root element, <tc-app-directory> */
  ref?: Ref<HTMLElement>;
};

export type AppDirectoryProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

export function AppDirectory({ className, onToggle, ...props }: AppDirectoryProps) {
  return (
    <AppDirectoryElement
      {...(props as Record<string, unknown>)}
      onToggle={onToggle as ((app: unknown, on: boolean) => void | Promise<unknown>) | undefined}
      className={["ui-adir", className].filter(Boolean).join(" ")}
    />
  );
}

/* ---------- Icons for categories of your own ---------- */

const line = (d: string, size = 16) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const categoryIcons = {
  essentials: line("m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6Z"),
  all: line("M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z"),
  analytics: line("M2.5 2.5h11v11h-11zM5.5 10.5v-2M8 10.5v-5M10.5 10.5V7"),
  automation: line("M9 1.5 3.5 9H8l-1 5.5L12.5 7H8Z"),
  billing: line("M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM10 5.8C9.6 5.2 8.9 5 8 5c-1.1 0-2 .6-2 1.5S6.9 7.8 8 8s2 .6 2 1.5S9.1 11 8 11c-.9 0-1.7-.3-2.1-1M8 3.8V5M8 11v1.2"),
  communication: line("M2.5 3.5h11v7.5H7l-3 2.5V11H2.5Z"),
  crm: line("M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.5 13.5c.6-2.3 2.3-3.5 4.5-3.5s3.9 1.2 4.5 3.5M10.5 2.7a2.5 2.5 0 0 1 0 4.6M12.5 10.3c1 .6 1.7 1.6 2 3.2"),
  design: line("M10.5 2.5 13.5 5.5 6 13H3v-3ZM9 4l3 3"),
  development: line("M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"),
  docs: line("M4 1.5h5.5l3 3v10H4zM9.5 1.5v3h3M6 8h4.5M6 10.5h4.5"),
  product: line("M2.5 2.5h3v11h-3zM6.5 2.5h3v7h-3zM10.5 2.5h3v4h-3z"),
  scheduling: line("M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 1.5v3M10.5 1.5v3"),
  storage: line("M2.5 4c0-1.1 2.5-2 5.5-2s5.5.9 5.5 2-2.5 2-5.5 2-5.5-.9-5.5-2ZM2.5 4v8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V4M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2"),
};
