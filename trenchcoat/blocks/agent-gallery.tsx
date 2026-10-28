"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import { AgentGallery as AgentGalleryElement } from "trenchcoat/react";

/*
 * Agent Gallery – a showcase block: slim vertical panels side by side, each with the same soft gradient artwork in
 * its own colours. The panel in the middle is open and shows a product screen; pick a side panel (or use the arrows)
 * and it glides open in the middle while the current one folds into a slim panel at the side.
 * Built on the Trenchcoat element <tc-agent-gallery> through `trenchcoat/react` (install `trenchcoat` and import its
 * tokens.css); this file keeps the block's React API: `index` / `defaultIndex` / `onIndexChange`, `className`, DOM
 * props and a `ref` on the root.
 */

export type GalleryItem = {
  id: string;
  name: string;
  description: string;
  /** Two colors for the gradient artwork – strong, then soft */
  colors: [string, string];
  /** What the agent reacts to */
  trigger: string;
  /** Steps shown under Instructions */
  steps: string[];
  /** Skills shown as chips */
  skills: string[];
  /** A rule shown under Guardrails */
  guardrail: string;
};

type OwnProps = {
  title?: string;
  subtitle?: string;
  items?: GalleryItem[];
  /** The open item (controlled) – the gallery glides there the short way round */
  index?: number;
  /** Item to open first when `index` isn't passed – by default the middle one */
  defaultIndex?: number;
  /** Called with the item a visitor picks (a panel, an arrow button or an arrow key) */
  onIndexChange?: (index: number) => void;
  className?: string;
  /** The root element, <tc-agent-gallery> */
  ref?: Ref<HTMLElement>;
};

export type AgentGalleryProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

export function AgentGallery({ className, ref, ...props }: AgentGalleryProps) {
  return <AgentGalleryElement {...(props as Record<string, unknown>)} ref={ref as Ref<never>} className={["ui-ag", className].filter(Boolean).join(" ")} />;
}
