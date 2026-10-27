import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { createPortal } from "react-dom";
import { TcDialog } from "../dialog";
import { h, useControlled } from "./internal";
const Raw = createComponent({
  tagName: "tc-dialog",
  elementClass: TcDialog,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<
      CustomEvent<{ open: boolean }>
    >,
  },
});
export type DialogProps = Omit<
  React.ComponentProps<typeof Raw>,
  "open" | "children" | "content" | "actions" | "onTcOpenChange"
> & {
  /** Whether the modal is open when controlled. */
  open?: boolean;
  /** Whether an uncontrolled modal starts open. */
  defaultOpen?: boolean;
  /** Called when the user requests opening or closing. */
  onOpenChange?: (open: boolean) => void;
  /** Interactive React content rendered into the native dialog. */
  children?: React.ReactNode;
  /** The app's footer actions (e.g. a primary Button), rendered after the built-in Close button. */
  actions?: React.ReactNode;
};
export function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  actions,
  closeButton,
  ref,
  ...props
}: DialogProps) {
  const state = useControlled(open, defaultOpen, onOpenChange);
  const [element, setElement] = React.useState<TcDialog | null>(null);
  const [body, setBody] = React.useState<Element | null>(null);
  const [footer, setFooter] = React.useState<Element | null>(null);
  const attach = React.useCallback(
    (node: TcDialog | null) => {
      setElement(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  React.useLayoutEffect(() => {
    let current = true;
    if (element)
      void element.updateComplete.then(() => {
        if (!current) return;
        setBody(element.querySelector(".tc-dialog-body"));
        setFooter(element.querySelector(".tc-dialog-actions"));
      });
    return () => {
      current = false;
    };
  }, [element]);
  return h(
    React.Fragment,
    null,
    h(Raw, {
      ...props,
      ...(children !== undefined ? { text: "" } : {}),
      // The element can't see portalled actions, so "auto" is resolved here: secondary beside actions
      closeButton:
        actions != null && (closeButton ?? "auto") === "auto"
          ? "secondary"
          : (closeButton ?? "auto"),
      ref: attach,
      open: state.value,
      onTcOpenChange: (e: CustomEvent<{ open: boolean }>) =>
        state.handler(e.detail.open, e),
    }),
    body && children !== undefined ? createPortal(children, body) : null,
    footer && actions != null ? createPortal(actions, footer) : null,
  );
}
