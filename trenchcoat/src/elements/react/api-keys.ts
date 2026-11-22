import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcApiKeys, type ApiKey, type ApiKeyCopy, type ApiKeyCreate, type ApiKeyReveal, type ApiKeyRevealDismiss, type ApiKeyRevoke } from "../api-keys";
import { h, useControlled } from "./internal";

export type { ApiKey, ApiKeyCopy, ApiKeyCreate, ApiKeyExpiryOption, ApiKeyReveal, ApiKeyRevealDismiss, ApiKeyRevoke, ApiKeyScope, ApiKeysLabels, ApiKeyStatus } from "../api-keys";
export { apiKeyRelative, apiKeyStatus, defaultApiKeyExpiryOptions, defaultApiKeysLabels } from "../api-keys";

const RawApiKeys = createComponent({
  tagName: "tc-api-keys",
  elementClass: TcApiKeys,
  react: React,
  events: {
    onTcKeyCreate: "tc-key-create" as EventName<CustomEvent<ApiKeyCreate>>,
    onTcKeyRevoke: "tc-key-revoke" as EventName<CustomEvent<ApiKeyRevoke>>,
    onTcRevealDismiss: "tc-reveal-dismiss" as EventName<CustomEvent<ApiKeyRevealDismiss>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<ApiKeyCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawApiKeys>;
type Owned = "heading" | "keys" | "revealed" | "onTcKeyCreate" | "onTcKeyRevoke" | "onTcRevealDismiss" | "onTcCopy" | "children";
export type ApiKeysProps = Omit<RawProps, Owned> & {
  /** The heading; by default "API keys" */
  title?: string;
  /** The keys – controlled when given */
  keys?: ApiKey[];
  /** The keys on mount when `keys` isn't controlled */
  defaultKeys?: ApiKey[];
  /** A key was revoked: the keys as they are now, and which one */
  onKeysChange?: (keys: ApiKey[], detail: ApiKeyRevoke) => void;
  /** Create key was submitted; make the key and set `revealed`. Call event.preventDefault() to keep the form open */
  onKeyCreate?: (detail: ApiKeyCreate, event: CustomEvent<ApiKeyCreate>) => void;
  /** A new key's secret to show once – controlled when given */
  revealed?: ApiKeyReveal | null;
  /** Done was pressed on the secret: clear `revealed` */
  onRevealDismiss?: (id: string) => void;
  /** Copy was pressed on the secret */
  onCopySecret?: (id: string, event: CustomEvent<ApiKeyCopy>) => void;
};

export function ApiKeys({ title, keys, defaultKeys = [], onKeysChange, onKeyCreate, revealed, onRevealDismiss, onCopySecret, ...props }: ApiKeysProps) {
  const k = useControlled<ApiKey[]>(keys, defaultKeys, undefined);
  const r = useControlled<ApiKeyReveal | null>(revealed, null, undefined);
  return h(RawApiKeys, {
    ...props,
    heading: title ?? "",
    keys: k.value,
    revealed: r.value,
    onTcKeyCreate: (e: CustomEvent<ApiKeyCreate>) => onKeyCreate?.(e.detail, e),
    onTcKeyRevoke: (e: CustomEvent<ApiKeyRevoke>) => {
      k.handler(e.detail.keys, e);
      onKeysChange?.(e.detail.keys, e.detail);
    },
    onTcRevealDismiss: (e: CustomEvent<ApiKeyRevealDismiss>) => {
      r.handler(null, e);
      onRevealDismiss?.(e.detail.id);
    },
    onTcCopy: (e: CustomEvent<ApiKeyCopy>) => onCopySecret?.(e.detail.id, e),
  });
}
