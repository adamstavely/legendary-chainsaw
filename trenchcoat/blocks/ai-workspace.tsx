"use client";

import type { ReactNode, Ref } from "react";
import {
  AiWorkspace as AiWorkspaceElement,
  type AiWorkspaceConversation,
  type AiWorkspaceMessage,
  type AiWorkspaceProject,
  type AiWorkspaceProps as ElementProps,
} from "trenchcoat/react";

/*
 * AI Workspace – a complete assistant app: sidebar, new-chat welcome, conversations that stream in, and a projects
 * overview. Search chats, pin and rename projects, create new ones, collapse the sidebar. Replace `respond` with your
 * model call.
 * Built on the Trenchcoat element <tc-ai-workspace> (and its Chat Composer) through `trenchcoat/react` – install
 * `trenchcoat` instead of copying components; it follows the nearest <LookProvider>, or takes a `look` prop. This file
 * keeps the block's props and types, so code written against the React version keeps working.
 *
 * Keyboard: menus follow the menu pattern (focus moves in, arrows / Home / End, Esc and choosing return to the trigger,
 * Tab closes); the dialog keeps focus inside and gives it back to the button that opened it. When a control goes
 * away (sidebar toggles, the welcome screen, a closing menu) focus moves to its stable counterpart, never <body>.
 */

export type ChatMessage = AiWorkspaceMessage;
export type Conversation = AiWorkspaceConversation;
export type Project = AiWorkspaceProject;

export type AiWorkspaceProps = Omit<ElementProps, "ref" | "workspace" | "userName" | "userAvatar"> & {
  userName?: string;
  userAvatar?: string;
  /** Workspace initial in the top-left tile – text only (a string or number) */
  workspace?: ReactNode;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export function AiWorkspace({ ref, workspace = "N", ...props }: AiWorkspaceProps) {
  const tile = typeof workspace === "string" || typeof workspace === "number" ? String(workspace) : "";
  return <AiWorkspaceElement {...props} workspace={tile} ref={ref as ElementProps["ref"]} />;
}
