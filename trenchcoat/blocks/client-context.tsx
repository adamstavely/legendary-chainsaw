"use client";

import type { Ref } from "react";
import { ClientContext as ClientContextElement, type ClientContextProps as ElementProps } from "trenchcoat/react";

/*
 * Client Context – one client's numbers, reports and shared context. Switch or create clients, refresh the sync, open
 * a metric, regenerate a report, and keep a timeline of notes and files the whole team writes into: search it, filter
 * it, mention reports with "@" and attach files.
 * Built on the Trenchcoat element <tc-client-context> through `trenchcoat/react` (install `trenchcoat` instead of
 * copying components); it follows the nearest <LookProvider>, or takes a `look` prop. This file keeps the block's
 * props and types, so code written against the React version keeps working.
 *
 * Keyboard: the client and filter popovers take focus, move with the arrow keys and give it back to their button on
 * Esc or a pick; when something under focus goes away (a removed note or file, Clear search, Show everything) focus
 * moves to the nearest stable control. Sync results and mention suggestions are announced in narrow status regions.
 */

export type { ContextClient, ContextEntry, ContextFile, ContextKpi, ContextPerson, ContextReport } from "trenchcoat/react";

export type ClientContextProps = Omit<ElementProps, "ref"> & {
  className?: string;
  /** The root element */
  ref?: Ref<HTMLElement>;
};

export function ClientContext({ ref, ...props }: ClientContextProps) {
  return <ClientContextElement {...props} ref={ref as ElementProps["ref"]} />;
}
