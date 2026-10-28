import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDigest, type DigestCiteOpen, type DigestDoneChange, type DigestSource } from "../digest";
import { h, useControlled } from "./internal";

export type { DigestItem, DigestSection, DigestSource, DigestStatus } from "../digest";

const RawDigest = createComponent({
  tagName: "tc-digest",
  elementClass: TcDigest,
  react: React,
  events: {
    onTcDoneChange: "tc-done-change" as EventName<CustomEvent<DigestDoneChange>>,
    onTcCiteOpen: "tc-cite-open" as EventName<CustomEvent<DigestCiteOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDigest>;
type Owned = "heading" | "done" | "onTcDoneChange" | "onTcCiteOpen" | "children";
export type DigestProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The ids of ticked items – controlled when given */
  done?: string[];
  /** The ticked ids on mount when `done` isn't controlled */
  defaultDone?: string[];
  /** An item was ticked or unticked */
  onDoneChange?: (done: string[]) => void;
  /** A source chip was pressed; return false to keep a link from opening */
  onCiteOpen?: (id: string, section: string, source: DigestSource) => boolean | void;
};

export function Digest({ title, done, defaultDone = [], onDoneChange, onCiteOpen, ...props }: DigestProps) {
  const d = useControlled<string[]>(done, defaultDone, onDoneChange);
  return h(RawDigest, {
    ...props,
    heading: title ?? "One-minute digest",
    done: d.value,
    onTcDoneChange: (e: CustomEvent<DigestDoneChange>) => d.handler(e.detail.done, e),
    onTcCiteOpen: (e: CustomEvent<DigestCiteOpen>) => {
      if (onCiteOpen?.(e.detail.id, e.detail.section, e.detail.source) === false) e.preventDefault();
    },
  });
}
