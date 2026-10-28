"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import { InvoiceCredit as InvoiceCreditElement } from "trenchcoat/react";

/*
 * Invoice & Credit Note – two billing documents in one block. The invoice and its credit note sit on top of each other
 * like sheets of paper; switch between them, or press “Credit invoice” to bring the credit note forward. Pick which
 * lines to credit, adjust the amounts, and the subtotal, tax and adjustment update as you type; then issue it.
 * Built on the Trenchcoat element <tc-invoice-credit> through `trenchcoat/react` (install `trenchcoat` and import its
 * tokens.css); this file keeps the block's React API: `view` / `defaultView` / `onViewChange`, `onIssue`,
 * `className`, DOM props and a `ref` on the root.
 */

export type DocParty = { name: string; lines: string[] };
export type InvoiceLine = { id: string; name: string; qty: number; rate: number; tax: number; group?: string };

export type InvoiceView = "invoice" | "credit";

type OwnProps = {
  seller?: DocParty;
  buyer?: DocParty;
  invoiceNo?: string;
  creditNo?: string;
  invoiceDate?: string;
  dueDate?: string;
  period?: string;
  lines?: InvoiceLine[];
  currency?: string;
  /** The sheet in front (controlled) – pass `onViewChange` with it. Leave undefined to start at `defaultView` */
  view?: InvoiceView;
  defaultView?: InvoiceView;
  onViewChange?: (view: InvoiceView) => void;
  /**
   * Called when the credit note is issued, with the credited amount per line (before tax). Return a promise to show
   * Issuing… until it settles; a rejection keeps the note editable and shows the error so it can be issued again
   */
  onIssue?: (credits: Record<string, number>, total: number) => void | Promise<unknown>;
  className?: string;
  /** The root element, <tc-invoice-credit> */
  ref?: Ref<HTMLElement>;
};

export type InvoiceCreditProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

export function InvoiceCredit({ className, ref, ...props }: InvoiceCreditProps) {
  return <InvoiceCreditElement {...(props as Record<string, unknown>)} ref={ref as Ref<never>} className={["ui-iv", className].filter(Boolean).join(" ")} />;
}
