import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCopyPageMenu, type CopyPageAssistantOpen, type CopyPageCopy, type CopyPageDownload, type CopyPageOpenChange, type CopyPageView } from "../copy-page-menu";
import { h, useControlled } from "./internal";

export type { CopyPageAssistant, CopyPageAssistantOpen, CopyPageCopy, CopyPageDownload, CopyPageLabels, CopyPageOpenChange, CopyPageView } from "../copy-page-menu";
export { assistantHref, defaultCopyPageLabels, markdownFilename } from "../copy-page-menu";

const RawCopyPageMenu = createComponent({
  tagName: "tc-copy-page-menu",
  elementClass: TcCopyPageMenu,
  react: React,
  events: {
    onTcPageCopy: "tc-page-copy" as EventName<CustomEvent<CopyPageCopy>>,
    onTcPageView: "tc-page-view" as EventName<CustomEvent<CopyPageView>>,
    onTcAssistantOpen: "tc-assistant-open" as EventName<CustomEvent<CopyPageAssistantOpen>>,
    onTcPageDownload: "tc-page-download" as EventName<CustomEvent<CopyPageDownload>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<CopyPageOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCopyPageMenu>;
export type CopyPageMenuProps = Omit<RawProps, "open" | "onTcPageCopy" | "onTcPageView" | "onTcAssistantOpen" | "onTcPageDownload" | "onTcOpenChange"> & {
  /** The menu is open – controlled when given */
  open?: boolean;
  /** Open at first, when `open` isn't controlled */
  defaultOpen?: boolean;
  /** Called when the menu opens or closes */
  onOpenChange?: (open: boolean) => void;
  /** The Markdown or the link is about to be copied; return false to copy it your own way */
  onPageCopy?: (kind: CopyPageCopy["kind"], text: string) => boolean | void;
  /** View as Markdown was chosen; return false to show it your own way */
  onPageView?: (markdown: string) => boolean | void;
  /** An assistant's link was chosen; return false to open it your own way */
  onAssistantOpen?: (id: string, href: string) => boolean | void;
  /** Download .md was chosen; return false to save it your own way */
  onPageDownload?: (filename: string, markdown: string) => boolean | void;
};

/** A docs page's Copy page button: copy it as Markdown for a model, view it, copy its link, open it in an assistant, download it */
export function CopyPageMenu({ open, defaultOpen = false, onOpenChange, onPageCopy, onPageView, onAssistantOpen, onPageDownload, ...props }: CopyPageMenuProps) {
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  return h(RawCopyPageMenu, {
    ...props,
    open: o.value,
    onTcOpenChange: (e: CustomEvent<CopyPageOpenChange>) => o.handler(e.detail.open, e),
    onTcPageCopy: (e: CustomEvent<CopyPageCopy>) => {
      if (onPageCopy?.(e.detail.kind, e.detail.text) === false) e.preventDefault();
    },
    onTcPageView: (e: CustomEvent<CopyPageView>) => {
      if (onPageView?.(e.detail.markdown) === false) e.preventDefault();
    },
    onTcAssistantOpen: (e: CustomEvent<CopyPageAssistantOpen>) => {
      if (onAssistantOpen?.(e.detail.id, e.detail.href) === false) e.preventDefault();
    },
    onTcPageDownload: (e: CustomEvent<CopyPageDownload>) => {
      if (onPageDownload?.(e.detail.filename, e.detail.markdown) === false) e.preventDefault();
    },
  });
}
