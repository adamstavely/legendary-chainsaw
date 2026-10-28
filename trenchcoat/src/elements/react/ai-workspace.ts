import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcAiWorkspace,
  defaultAiWorkspaceConversations,
  defaultAiWorkspaceProjects,
  type AiWorkspaceConversationsChange,
  type AiWorkspaceProjectsChange,
  type AiWorkspaceShare,
  type AiWorkspaceConversation,
  type AiWorkspaceProject,
} from "../ai-workspace";
import { h, useControlled } from "./internal";

export type { AiWorkspaceRespond, AiWorkspaceMessage, AiWorkspaceConversation, AiWorkspaceProject } from "../ai-workspace";
export { defaultAiWorkspaceConversations, defaultAiWorkspaceProjects } from "../ai-workspace";

const RawAiWorkspace = createComponent({
  tagName: "tc-ai-workspace",
  elementClass: TcAiWorkspace,
  react: React,
  events: {
    onTcConversationsChange: "tc-conversations-change" as EventName<CustomEvent<AiWorkspaceConversationsChange>>,
    onTcProjectsChange: "tc-projects-change" as EventName<CustomEvent<AiWorkspaceProjectsChange>>,
    onTcShareChat: "tc-share-chat" as EventName<CustomEvent<AiWorkspaceShare>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAiWorkspace>;
type Owned = "conversations" | "projects" | "onTcConversationsChange" | "onTcProjectsChange" | "onTcShareChat" | "children";
export type AiWorkspaceProps = Omit<RawProps, Owned> & {
  /** The conversations (controlled) – pass `onConversationsChange` with it. Leave undefined to start from `defaultConversations` */
  conversations?: AiWorkspaceConversation[];
  /** The conversations on mount when `conversations` isn't controlled */
  defaultConversations?: AiWorkspaceConversation[];
  /** Called with the whole list after a message is sent or answered, or a chat is deleted */
  onConversationsChange?: (conversations: AiWorkspaceConversation[]) => void;
  /** The projects (controlled) – pass `onProjectsChange` with it. Leave undefined to start from `defaultProjects` */
  projects?: AiWorkspaceProject[];
  /** The projects on mount when `projects` isn't controlled */
  defaultProjects?: AiWorkspaceProject[];
  /** Called with the whole list after a project is created, renamed, pinned or unpinned */
  onProjectsChange?: (projects: AiWorkspaceProject[]) => void;
  /** Share chat was picked in the More menu */
  onShareChat?: (conversation: AiWorkspaceConversation | null) => void;
};

export function AiWorkspace({
  conversations,
  defaultConversations: startConversations = defaultAiWorkspaceConversations,
  onConversationsChange,
  projects,
  defaultProjects: startProjects = defaultAiWorkspaceProjects,
  onProjectsChange,
  onShareChat,
  ...props
}: AiWorkspaceProps) {
  const chats = useControlled<AiWorkspaceConversation[]>(conversations, startConversations, onConversationsChange);
  const list = useControlled<AiWorkspaceProject[]>(projects, startProjects, onProjectsChange);
  return h(RawAiWorkspace, {
    ...props,
    conversations: chats.value,
    projects: list.value,
    onTcConversationsChange: (e: CustomEvent<AiWorkspaceConversationsChange>) => chats.handler(e.detail.conversations, e),
    onTcProjectsChange: (e: CustomEvent<AiWorkspaceProjectsChange>) => list.handler(e.detail.projects, e),
    onTcShareChat: (e: CustomEvent<AiWorkspaceShare>) => onShareChat?.(e.detail.conversation),
  });
}
