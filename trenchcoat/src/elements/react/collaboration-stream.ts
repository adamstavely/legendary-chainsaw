import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcCollaborationStream,
  type CollabFile as ElementCollabFile,
  type CollabFilterChange,
  type CollabMessage as ElementCollabMessage,
  type CollabParticipant as ElementCollabParticipant,
  type CollabSend,
} from "../collaboration-stream";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { CollabDetails, CollabFilter, CollabLabels, CollabMessageKind, CollabSend, CollabTool, CollabToolResult } from "../collaboration-stream";
export { defaultCollabLabels } from "../collaboration-stream";

/** React nodes in place of elements: the avatar */
export type CollabParticipant = Omit<ElementCollabParticipant, "avatar"> & {
  /** A small picture or mark, as a React node or an element – defaults to the initials */
  avatar?: React.ReactNode | Element;
};
/** React nodes in place of elements: the preview */
export type CollabFile = Omit<ElementCollabFile, "preview"> & {
  /** What the preview shows: text (kept as written, in a monospace block), any React node, or an element */
  preview?: React.ReactNode | Element;
};
export type CollabMessage = Omit<ElementCollabMessage, "files"> & { files?: CollabFile[] };

const RawCollaborationStream = createComponent({
  tagName: "tc-collaboration-stream",
  elementClass: TcCollaborationStream,
  react: React,
  events: {
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<CollabFilterChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCollaborationStream>;
export type CollaborationStreamProps = Omit<RawProps, "heading" | "filter" | "participants" | "messages" | "onTcFilterChange" | "onSend"> & {
  /** Everyone in the run – people and agents */
  participants: CollabParticipant[];
  /** The messages, oldest first */
  messages: CollabMessage[];
  /** The heading (default "Collaboration") */
  title?: string;
  /** The tab on show: "everyone", "you", or an agent's id. Controlled when defined; otherwise the component keeps it */
  filter?: string;
  /** The tab at first when `filter` isn't controlled */
  defaultFilter?: string;
  /** Called with the tab the user picked */
  onFilterChange?: (filter: string) => void;
  /** Called with every message or answer sent. May return a promise: the box waits, and keeps the text if it rejects */
  onSend?: (message: CollabSend) => void | Promise<unknown>;
};

export function CollaborationStream({ participants, messages, title = "Collaboration", filter, defaultFilter = "everyone", onFilterChange, onSend, ...props }: CollaborationStreamProps) {
  // Avatars and previews given as React nodes render in a hidden staging box; the element clones their DOM
  const staged: [string, React.ReactNode][] = [];
  for (const p of participants) if (isNode(p.avatar)) staged.push([`avatar:${p.id}`, p.avatar as React.ReactNode]);
  for (const m of messages) for (const f of m.files ?? []) if (isNode(f.preview)) staged.push([`file:${m.id}:${f.id}`, f.preview as React.ReactNode]);
  const { stage, els } = useStaged(staged);
  const people = React.useMemo(
    () => participants.map(({ avatar, ...p }): ElementCollabParticipant => ({ ...p, avatar: isNode(avatar) ? els[`avatar:${p.id}`] : (avatar as Element | undefined) })),
    [participants, els],
  );
  const list = React.useMemo(
    () =>
      messages.map(({ files, ...m }): ElementCollabMessage => ({
        ...m,
        files: files?.map(({ preview, ...f }) => ({
          ...f,
          preview: typeof preview === "string" ? preview : isNode(preview) ? els[`file:${m.id}:${f.id}`] : (preview as Element | undefined),
        })),
      })),
    [messages, els],
  );
  const f = useControlled(filter, defaultFilter, onFilterChange);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawCollaborationStream, {
      ...props,
      heading: title,
      participants: people,
      messages: list,
      filter: f.value,
      onSend,
      onTcFilterChange: (e: CustomEvent<CollabFilterChange>) => f.handler(e.detail.filter, e),
    }),
  );
}
