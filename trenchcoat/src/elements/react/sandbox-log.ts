import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSandboxLog, type SandboxLogCopy, type SandboxLogOpenChange, type SandboxLogQueryChange } from "../sandbox-log";
import { h, useControlled } from "./internal";

export type { SandboxLogStatus, SandboxLogStep, SandboxLogLine } from "../sandbox-log";

const RawSandboxLog = createComponent({
  tagName: "tc-sandbox-log",
  elementClass: TcSandboxLog,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<SandboxLogOpenChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<SandboxLogQueryChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<SandboxLogCopy>>,
  },
});

type RawProps = React.ComponentProps<typeof RawSandboxLog>;
export type SandboxLogProps = Omit<RawProps, "open" | "query" | "heading" | "onTcOpenChange" | "onTcQueryChange" | "onTcCopy" | "steps"> & {
  steps: TcSandboxLog["steps"];
  /** Shown at the top; names the region */
  title?: string;
  /** Ids of the open steps (controlled) – unset opens the running and failed ones */
  open?: string[];
  defaultOpen?: string[];
  onOpenChange?: (open: string[]) => void;
  /** The search text (controlled) */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** After a copy: the step's id (null for the whole log) and the text */
  onCopy?: (stepId: string | null, text: string) => void;
};

export function SandboxLog({ title, open, defaultOpen, onOpenChange, query, defaultQuery = "", onQueryChange, onCopy, ...props }: SandboxLogProps) {
  // Uncontrolled and no defaultOpen: the element picks the open steps itself until the first toggle
  const o = useControlled<string[] | undefined>(open, defaultOpen, onOpenChange as ((next: string[] | undefined) => void) | undefined);
  const q = useControlled(query, defaultQuery, onQueryChange);
  return h(RawSandboxLog, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    open: o.value,
    query: q.value,
    onTcOpenChange: (e: CustomEvent<SandboxLogOpenChange>) => o.handler(e.detail.open, e),
    onTcQueryChange: (e: CustomEvent<SandboxLogQueryChange>) => q.handler(e.detail.query, e),
    onTcCopy: onCopy ? (e: CustomEvent<SandboxLogCopy>) => onCopy(e.detail.stepId, e.detail.text) : undefined,
  });
}
