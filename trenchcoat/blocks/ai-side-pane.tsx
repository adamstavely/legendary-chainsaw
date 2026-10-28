"use client";

import { AiSidePane as AiSidePaneElement, type AiSidePaneProps as ElementProps, type SidePaneMessage } from "trenchcoat/react";

/*
 * AI Side Pane – an assistant docked beside a page, holding a conversation about what's on it: ai-answer and
 * claim-answer for the answers, message-actions under every finished answer, prompt-starters before the first message,
 * chat-history in a panel, reflection-gate for answers the app marks high-stakes, and the chat-composer with its full
 * toolbar – model, settings, prompts, page context – and the disclaimer under it. "Connect apps", "Select a project"
 * and "Request approval" show only when their handler (`onConnectApps`, `onSelectProject`, `onRequestApproval`) is
 * passed.
 *
 * Built on the <tc-ai-side-pane> element through `trenchcoat/react` (install `trenchcoat` and import its tokens.css):
 * the element holds the layout, focus handling, resizing and shortcut, so the same pane is available to Angular, Vue
 * and plain HTML. It follows the nearest <LookProvider>, or takes a `look` prop.
 *
 * The app owns the conversation: it passes `messages`, appends to them in `onSend`, and streams an answer by growing
 * its `text` while `streaming` is set. The pane owns only its own chrome – open, collapsed to a rail, its width – each
 * of which a parent may control (`open` / `defaultOpen` / `onOpenChange`, and so on) to remember it.
 *
 * Layout: the host page is the children; the pane docks beside it. Drag its edge (or focus the edge and use the arrow
 * keys) to resize it, collapse it to a narrow rail, or press the shortcut (⌘. / Ctrl+. by default) to open it. Below
 * `breakpoint` (the block's own width) it becomes an overlay sheet with a scrim.
 */

export type { SidePaneMessage };

export type AiSidePaneProps = ElementProps & {
  /** Below this width of the block, in px, the pane is an overlay sheet instead of docked */
  breakpoint?: number;
  /** Which side it docks on */
  side?: "left" | "right";
  /** A floating "Ask AI" button while the pane is closed – false if your page has its own */
  launcher?: boolean;
};

export function AiSidePane(props: AiSidePaneProps) {
  return <AiSidePaneElement {...props} />;
}
