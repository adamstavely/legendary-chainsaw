import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcAiSearch,
  type AiSearchContentsChange,
  type AiSearchMode,
  type AiSearchModeChange,
  type AiSearchQueryChange,
  type AiSearchScopeRemove,
  type AiSearchSubmit,
} from "../ai-search";
import { h, useControlled } from "./internal";

export type { AiSearchMode, AiSearchScope, AiSearchSuggestion } from "../ai-search";
import type { AiSearchScope } from "../ai-search";

const RawAiSearch = createComponent({
  tagName: "tc-ai-search",
  elementClass: TcAiSearch,
  react: React,
  events: {
    onTcSubmit: "tc-submit" as EventName<CustomEvent<AiSearchSubmit>>,
    onTcModeChange: "tc-mode-change" as EventName<CustomEvent<AiSearchModeChange>>,
    onTcContentsChange: "tc-contents-change" as EventName<CustomEvent<AiSearchContentsChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<AiSearchQueryChange>>,
    onTcScopeRemove: "tc-scope-remove" as EventName<CustomEvent<AiSearchScopeRemove>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAiSearch>;
type Owned = "mode" | "contents" | "value" | "defaultValue" | "scopes" | "onTcSubmit" | "onTcModeChange" | "onTcContentsChange" | "onTcQueryChange" | "onTcScopeRemove" | "children";
export type AiSearchProps = Omit<RawProps, Owned> & {
  /** Search or AI mode – controlled when given */
  mode?: AiSearchMode;
  /** The mode on mount when `mode` isn't controlled */
  defaultMode?: AiSearchMode;
  /** AI mode was switched */
  onModeChange?: (mode: AiSearchMode) => void;
  /** Search within file contents – controlled when given */
  contents?: boolean;
  /** The switch on mount when `contents` isn't controlled */
  defaultContents?: boolean;
  /** "Search within file contents" was switched */
  onContentsChange?: (contents: boolean) => void;
  /** The text in the field on mount */
  defaultValue?: string;
  /** The text changed */
  onQueryChange?: (query: string) => void;
  /** A search or a question was sent */
  onSearch?: (detail: AiSearchSubmit) => void;
  /** Where the search looks, as removable chips – controlled when given */
  scopes?: AiSearchScope[];
  /** The scopes on mount when `scopes` isn't controlled */
  defaultScopes?: AiSearchScope[];
  /** A scope chip was removed; `next` is the list without it */
  onScopesChange?: (next: AiSearchScope[]) => void;
};

const NO_SCOPES: AiSearchScope[] = [];

export function AiSearch({ mode, defaultMode = "search", onModeChange, contents, defaultContents = false, onContentsChange, defaultValue = "", onQueryChange, onSearch, scopes, defaultScopes = NO_SCOPES, onScopesChange, ...props }: AiSearchProps) {
  const m = useControlled<AiSearchMode>(mode, defaultMode, onModeChange);
  const c = useControlled<boolean>(contents, defaultContents, onContentsChange);
  const sc = useControlled<AiSearchScope[]>(scopes, defaultScopes, onScopesChange);
  const [text, setText] = React.useState(defaultValue);
  return h(RawAiSearch, {
    ...props,
    mode: m.value,
    contents: c.value,
    value: text,
    scopes: sc.value,
    onTcModeChange: (e: CustomEvent<AiSearchModeChange>) => m.handler(e.detail.mode, e),
    onTcContentsChange: (e: CustomEvent<AiSearchContentsChange>) => c.handler(e.detail.contents, e),
    onTcQueryChange: (e: CustomEvent<AiSearchQueryChange>) => {
      setText(e.detail.query);
      onQueryChange?.(e.detail.query);
    },
    onTcSubmit: (e: CustomEvent<AiSearchSubmit>) => onSearch?.(e.detail),
    onTcScopeRemove: (e: CustomEvent<AiSearchScopeRemove>) =>
      sc.handler(
        sc.value.filter((s) => s.id !== e.detail.id),
        e,
      ),
  });
}
