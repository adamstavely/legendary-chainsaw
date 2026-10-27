import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { createPortal } from "react-dom";
import {
  TcTermsDialog,
  type TermsAcceptDetail,
  type TermsConsentChangeDetail,
  type TermsConsents,
  type TermsDeclineDetail,
  type TermsFileDetail,
  type TermsSection,
} from "../terms-dialog";
import { h, useControlled } from "./internal";

export type {
  TermsAcceptDetail,
  TermsBlocked,
  TermsChange,
  TermsConsent,
  TermsConsentChangeDetail,
  TermsConsents,
  TermsDeclineDetail,
  TermsFileDetail,
  TermsRecorder,
  TermsSection,
} from "../terms-dialog";

const NONE: TermsConsents = {};

const RawTermsDialog = createComponent({
  tagName: "tc-terms-dialog",
  elementClass: TcTermsDialog,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
    onTcAccept: "tc-accept" as EventName<CustomEvent<TermsAcceptDetail>>,
    onTcDecline: "tc-decline" as EventName<CustomEvent<TermsDeclineDetail>>,
    onTcConsentChange: "tc-consent-change" as EventName<CustomEvent<TermsConsentChangeDetail>>,
    onTcPrint: "tc-print" as EventName<CustomEvent<TermsFileDetail>>,
    onTcDownload: "tc-download" as EventName<CustomEvent<TermsFileDetail>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTermsDialog>;

/** A section whose body may be React content (links, lists, components) as well as text or a DOM node */
export type TermsDialogSection = Omit<TermsSection, "body"> & { body?: React.ReactNode | Node };

export type TermsDialogProps = Omit<
  RawProps,
  | "open"
  | "checked"
  | "defaultChecked"
  | "sections"
  | "content"
  | "children"
  | "onTcOpenChange"
  | "onTcAccept"
  | "onTcDecline"
  | "onTcConsentChange"
  | "onTcPrint"
  | "onTcDownload"
> & {
  /** Whether the modal is open – controlled when defined; pair it with `onOpenChange` */
  open?: boolean;
  /** Whether an uncontrolled modal starts open */
  defaultOpen?: boolean;
  /** Called when the dialog asks to open or close (Escape, the close button, Accept, Decline) */
  onOpenChange?: (open: boolean) => void;
  /** Which consents are checked, by id – controlled when defined */
  checked?: TermsConsents;
  /** Which consents start checked, when `checked` isn't controlled */
  defaultChecked?: TermsConsents;
  /** Called with every consent after one is checked or unchecked */
  onCheckedChange?: (consents: TermsConsents) => void;
  /** The text as sections; a body can be text, a DOM node or React content */
  sections?: TermsDialogSection[];
  /** The text as React content, when it isn't in `sections`; its h2 and h3 headings make the jump list */
  children?: React.ReactNode;
  /** Called when Accept is pressed with every requirement met; `event.preventDefault()` keeps the dialog open and records nothing */
  onAccept?: (detail: TermsAcceptDetail, event: CustomEvent<TermsAcceptDetail>) => void;
  /** Called when Decline is pressed; `event.preventDefault()` keeps the dialog open */
  onDecline?: (detail: TermsDeclineDetail, event: CustomEvent<TermsDeclineDetail>) => void;
  /** Called when Print is pressed (shown with `printable`) */
  onPrint?: (detail: TermsFileDetail) => void;
  /** Called when Download is pressed (shown with `downloadable`) */
  onDownload?: (detail: TermsFileDetail) => void;
};

/** React content is portalled into the element; text and DOM nodes go to the element as they are */
const portalled = (b: unknown) => b != null && typeof b !== "string" && !(typeof Node !== "undefined" && b instanceof Node);

export function TermsDialog({
  open,
  defaultOpen = false,
  onOpenChange,
  checked,
  defaultChecked = NONE,
  onCheckedChange,
  sections,
  children,
  onAccept,
  onDecline,
  onPrint,
  onDownload,
  ref,
  ...props
}: TermsDialogProps) {
  const o = useControlled(open, defaultOpen, onOpenChange);
  const c = useControlled(checked, defaultChecked, onCheckedChange);
  const [element, setElement] = React.useState<TcTermsDialog | null>(null);
  const [hosts, setHosts] = React.useState<{ content: Element | null; bodies: Record<string, Element> }>({ content: null, bodies: {} });
  const attach = React.useCallback(
    (node: TcTermsDialog | null) => {
      setElement(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  // The element gets each section without its React body; the body renders into the section's box
  const forElement = React.useMemo(() => sections?.map((s) => (portalled(s.body) ? { ...s, body: undefined } : (s as TermsSection))), [sections]);
  React.useLayoutEffect(() => {
    let current = true;
    if (element)
      void element.updateComplete.then(() => {
        if (!current) return;
        const bodies: Record<string, Element> = {};
        element.querySelectorAll<HTMLElement>(".ui-tdlg__section-body[data-section]").forEach((b) => (bodies[b.dataset.section!] = b));
        setHosts({ content: element.querySelector(".ui-tdlg__content"), bodies });
      });
    return () => {
      current = false;
    };
  }, [element, forElement]);
  return h(
    React.Fragment,
    null,
    h(RawTermsDialog, {
      ...props,
      ref: attach,
      open: o.value,
      checked: c.value,
      sections: forElement ?? [],
      onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
      onTcConsentChange: (e: CustomEvent<TermsConsentChangeDetail>) => c.handler(e.detail.consents, e),
      onTcAccept: (e: CustomEvent<TermsAcceptDetail>) => onAccept?.(e.detail, e),
      onTcDecline: (e: CustomEvent<TermsDeclineDetail>) => onDecline?.(e.detail, e),
      onTcPrint: (e: CustomEvent<TermsFileDetail>) => onPrint?.(e.detail),
      onTcDownload: (e: CustomEvent<TermsFileDetail>) => onDownload?.(e.detail),
    }),
    ...(sections ?? []).map((s) => (portalled(s.body) && hosts.bodies[s.id] ? createPortal(s.body as React.ReactNode, hosts.bodies[s.id], s.id) : null)),
    !sections?.length && children !== undefined && hosts.content ? createPortal(children, hosts.content, "content") : null,
  );
}
