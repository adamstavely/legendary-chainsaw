import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentCreate, type AgentCreateCreate, type AgentCreateDraftChange, type AgentCreateGenerate, type AgentCreatePromptChange, type AgentDraft } from "../agent-create";
import { h, useControlled } from "./internal";

export type {
  AgentCreateCreate,
  AgentCreateDraftChange,
  AgentCreateGenerate,
  AgentCreateLabels,
  AgentCreateModel,
  AgentCreatePromptChange,
  AgentDraft,
  AgentDraftField,
  AgentDraftQuestion,
  AgentDraftTool,
  AgentDraftTrigger,
} from "../agent-create";
export { defaultAgentCreateLabels } from "../agent-create";

const RawAgentCreate = createComponent({
  tagName: "tc-agent-create",
  elementClass: TcAgentCreate,
  react: React,
  events: {
    onTcPromptChange: "tc-prompt-change" as EventName<CustomEvent<AgentCreatePromptChange>>,
    onTcGenerate: "tc-generate" as EventName<CustomEvent<AgentCreateGenerate>>,
    onTcDraftChange: "tc-draft-change" as EventName<CustomEvent<AgentCreateDraftChange>>,
    onTcCreate: "tc-create" as EventName<CustomEvent<AgentCreateCreate>>,
    onTcReset: "tc-reset" as EventName<CustomEvent<Record<string, never>>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentCreate>;
type Owned = "heading" | "prompt" | "draft" | "onTcPromptChange" | "onTcDraftChange" | "onTcGenerate" | "onTcCreate" | "children";
export type AgentCreateProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The description – controlled when given */
  prompt?: string;
  /** The description on mount when `prompt` isn't controlled */
  defaultPrompt?: string;
  /** The description changed */
  onPromptChange?: (prompt: string) => void;
  /** The draft – controlled when given (null before Generate) */
  draft?: AgentDraft | null;
  /** The draft on mount when `draft` isn't controlled */
  defaultDraft?: AgentDraft | null;
  /** The draft was edited or cleared */
  onDraftChange?: (draft: AgentDraft | null) => void;
  /** Generate was pressed; return false to keep `streaming` off */
  onGenerate?: (description: string) => boolean | void;
  /** Create was pressed with a named, finished draft */
  onCreate?: (draft: AgentDraft) => void;
};

export function AgentCreate({ title, prompt, defaultPrompt = "", onPromptChange, draft, defaultDraft = null, onDraftChange, onGenerate, onCreate, ...props }: AgentCreateProps) {
  const p = useControlled<string>(prompt, defaultPrompt, onPromptChange);
  const d = useControlled<AgentDraft | null>(draft, defaultDraft, onDraftChange);
  return h(RawAgentCreate, {
    ...props,
    heading: title ?? "New agent",
    prompt: p.value,
    draft: d.value,
    onTcPromptChange: (e: CustomEvent<AgentCreatePromptChange>) => p.handler(e.detail.prompt, e),
    onTcDraftChange: (e: CustomEvent<AgentCreateDraftChange>) => d.handler(e.detail.draft, e),
    onTcGenerate: (e: CustomEvent<AgentCreateGenerate>) => {
      if (onGenerate?.(e.detail.description) === false) e.preventDefault();
    },
    onTcCreate: (e: CustomEvent<AgentCreateCreate>) => onCreate?.(e.detail.draft),
  });
}
