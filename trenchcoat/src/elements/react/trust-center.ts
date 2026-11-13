import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTrustCenter, type TrustDocument, type TrustDocumentOpen, type TrustDpa, type TrustDpaSign, type TrustOpenChange, type TrustRequest } from "../trust-center";
import { h, useControlled } from "./internal";

export type {
  TrustCenterLabels,
  TrustCertification,
  TrustCertificationStatus,
  TrustDocument,
  TrustDocumentAccess,
  TrustDocumentOpen,
  TrustDpa,
  TrustDpaSign,
  TrustFaq,
  TrustOpenChange,
  TrustRequest,
} from "../trust-center";
export { defaultTrustCenterLabels } from "../trust-center";

const RawTrustCenter = createComponent({
  tagName: "tc-trust-center",
  elementClass: TcTrustCenter,
  react: React,
  events: {
    onTcRequest: "tc-request" as EventName<CustomEvent<TrustRequest>>,
    onTcDocumentOpen: "tc-document-open" as EventName<CustomEvent<TrustDocumentOpen>>,
    onTcDpaSign: "tc-dpa-sign" as EventName<CustomEvent<TrustDpaSign>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<TrustOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTrustCenter>;
type Owned = "heading" | "open" | "onTcRequest" | "onTcDocumentOpen" | "onTcDpaSign" | "onTcOpenChange" | "children";
export type TrustCenterProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The ids of the open questions – controlled when given */
  open?: string[];
  /** The questions open on mount when `open` isn't controlled */
  defaultOpen?: string[];
  /** A question was opened or closed; `open` is the new list */
  onOpenChange?: (open: string[]) => void;
  /** Request access was pressed; return false to leave the document unmarked */
  onRequest?: (id: string, document: TrustDocument) => boolean | void;
  /** View was pressed on a public or granted document; return false to stop a link being followed */
  onDocumentOpen?: (id: string, href: string | undefined, document: TrustDocument) => boolean | void;
  /** Review and sign was pressed on the DPA */
  onDpaSign?: (dpa: TrustDpa) => void;
};

const NONE: string[] = [];

export function TrustCenter({ title, open, defaultOpen = NONE, onOpenChange, onRequest, onDocumentOpen, onDpaSign, ...props }: TrustCenterProps) {
  const o = useControlled<string[]>(open, defaultOpen, onOpenChange);
  return h(RawTrustCenter, {
    ...props,
    heading: title ?? "Trust center",
    open: o.value,
    onTcOpenChange: (e: CustomEvent<TrustOpenChange>) => o.handler(e.detail.open, e),
    onTcRequest: (e: CustomEvent<TrustRequest>) => {
      if (onRequest?.(e.detail.id, e.detail.document) === false) e.preventDefault();
    },
    onTcDocumentOpen: (e: CustomEvent<TrustDocumentOpen>) => {
      if (onDocumentOpen?.(e.detail.id, e.detail.href, e.detail.document) === false) e.preventDefault();
    },
    onTcDpaSign: (e: CustomEvent<TrustDpaSign>) => onDpaSign?.(e.detail.dpa),
  });
}
