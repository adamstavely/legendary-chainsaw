import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCommentThread, type ThreadAuthor as ElementAuthor, type ThreadMessage as ElementMessage } from "../comment-thread";
import { h, isNode, useStaged } from "./internal";

/** Avatars may be React nodes or image URLs */
export type ThreadAuthor = { name: string; avatar?: React.ReactNode | string; assistant?: boolean };
export type ThreadMessage = Omit<ElementMessage, "author"> & { author: ThreadAuthor };

const RawCommentThread = createComponent({
  tagName: "tc-comment-thread",
  elementClass: TcCommentThread,
  react: React,
  events: {
    onTcMessagesChange: "tc-messages-change" as EventName<CustomEvent<{ messages: ElementMessage[] }>>,
    onTcClose: "tc-close" as EventName<CustomEvent<null>>,
  },
});
type RawCommentThreadProps = React.ComponentProps<typeof RawCommentThread>;
export type CommentThreadProps = Omit<RawCommentThreadProps, "heading" | "messages" | "currentUser" | "assistant" | "onReply" | "closable" | "onTcMessagesChange" | "onTcClose"> & {
  /** The heading, and the region's name (default "Comment") */
  title?: string;
  /** The comment and its replies, oldest first – the source of truth, followed by id */
  messages: ThreadMessage[];
  /** Who is replying here: the author of replies posted from the field */
  currentUser: ThreadAuthor;
  /** The assistant that answers – used for the thinking state */
  assistant?: ThreadAuthor;
  /**
   * Called with every new reply. Return a message (or a promise of one) to let the assistant answer;
   * return nothing to just post the reply.
   */
  onReply?: (text: string) => ThreadMessage | Promise<ThreadMessage | void> | void;
  /** The whole thread after a reply was posted here, or the assistant answered – store it and pass it back */
  onMessagesChange?: (messages: ThreadMessage[]) => void;
  /** Shows a close button and runs when it's pressed */
  onClose?: () => void;
};

export function CommentThread({ title = "Comment", messages, currentUser, assistant, onReply, onMessagesChange, onClose, ...props }: CommentThreadProps) {
  // Every author's avatar node renders once in the staging box, keyed by name; the element clones it
  const authors = new Map<string, ThreadAuthor>();
  for (const a of [currentUser, assistant, ...messages.map((m) => m.author)]) if (a && !authors.has(a.name)) authors.set(a.name, a);
  const { stage, els } = useStaged([...authors.values()].filter((a) => isNode(a.avatar)).map((a) => [`a:${a.name}`, a.avatar]));
  const toElementAuthor = (a: ThreadAuthor): ElementAuthor => (isNode(a.avatar) ? { ...a, avatar: els[`a:${a.name}`] } : (a as ElementAuthor));
  const toElement = (m: ThreadMessage): ElementMessage => ({ ...m, author: toElementAuthor(m.author) });
  // …and come back as the nodes the app gave
  const fromElement = (m: ElementMessage): ThreadMessage => {
    const known = authors.get(m.author.name);
    return { ...m, author: known && isNode(known.avatar) ? { ...m.author, avatar: known.avatar } : (m.author as ThreadAuthor) };
  };
  const given = new Map(messages.map((m) => [m.id, m]));
  const latest = React.useRef({ onReply, toElement });
  latest.current = { onReply, toElement };
  const reply = React.useCallback((text: string) => {
    const result = latest.current.onReply?.(text);
    if (!result) return result;
    if (typeof (result as Promise<ThreadMessage | void>).then === "function") return (result as Promise<ThreadMessage | void>).then((m) => (m ? latest.current.toElement(m) : m));
    return latest.current.toElement(result as ThreadMessage);
  }, []);
  return h(React.Fragment, null, stage, h(RawCommentThread, {
    ...props,
    heading: title,
    messages: messages.map(toElement),
    currentUser: toElementAuthor(currentUser),
    assistant: assistant && toElementAuthor(assistant),
    onReply: onReply ? reply : undefined,
    closable: !!onClose,
    onTcMessagesChange: (e: CustomEvent<{ messages: ElementMessage[] }>) => onMessagesChange?.(e.detail.messages.map((m) => given.get(m.id) ?? fromElement(m))),
    onTcClose: () => onClose?.(),
  }));
}

/** A simple assistant mark: a full circle with a blue-to-violet gradient – pass your own logo as `avatar` instead */
export function AssistantMark() {
  const id = React.useId();
  return h(
    "svg",
    { viewBox: "0 0 24 24", width: "24", height: "24", "aria-hidden": "true" },
    h(
      "defs",
      null,
      h(
        "linearGradient",
        { id: `${id}-fill`, x1: "3", y1: "3", x2: "21", y2: "21", gradientUnits: "userSpaceOnUse" },
        h("stop", { offset: "0", stopColor: "#5b9dff" }),
        h("stop", { offset: "0.5", stopColor: "#2f6bff" }),
        h("stop", { offset: "1", stopColor: "#8b5cf6" }),
      ),
    ),
    h("circle", { cx: "12", cy: "12", r: "12", fill: `url(#${id}-fill)` }),
  );
}
