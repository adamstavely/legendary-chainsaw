import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcInvoiceCredit, type InvoiceIssue, type InvoiceView, type InvoiceViewChange } from "../invoice-credit";
import { h, useControlled } from "./internal";

export type { DocParty, InvoiceIssue, InvoiceIssueHandler, InvoiceLine, InvoiceView, InvoiceViewChange } from "../invoice-credit";
export { defaultInvoiceLines } from "../invoice-credit";

const RawInvoiceCredit = createComponent({
  tagName: "tc-invoice-credit",
  elementClass: TcInvoiceCredit,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<InvoiceViewChange>>,
    onTcIssue: "tc-issue" as EventName<CustomEvent<InvoiceIssue>>,
    onTcPdf: "tc-pdf" as EventName<CustomEvent<null>>,
    onTcPay: "tc-pay" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawInvoiceCredit>;
type Owned = "view" | "onTcViewChange" | "children";
export type InvoiceCreditProps = Omit<RawProps, Owned> & {
  /** The sheet in front (controlled) */
  view?: InvoiceView;
  /** The sheet in front at first, when `view` isn't set – the invoice by default */
  defaultView?: InvoiceView;
  /** Called with the sheet brought forward */
  onViewChange?: (view: InvoiceView) => void;
};

export function InvoiceCredit({ view, defaultView = "invoice", onViewChange, ...props }: InvoiceCreditProps) {
  const v = useControlled<InvoiceView>(view, defaultView, onViewChange);
  return h(RawInvoiceCredit, {
    ...props,
    view: v.value,
    onTcViewChange: (e: CustomEvent<InvoiceViewChange>) => v.handler(e.detail.view, e),
  });
}
