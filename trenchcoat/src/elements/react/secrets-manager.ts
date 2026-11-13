import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSecretsManager, type Secret, type SecretDelete, type SecretSet, type SecretsChange } from "../secrets-manager";
import { h, useControlled } from "./internal";

export type { Secret, SecretDelete, SecretSet, SecretStatus, SecretsChange, SecretsManagerLabels } from "../secrets-manager";
export { defaultSecretsManagerLabels, isSecretName } from "../secrets-manager";

const RawSecretsManager = createComponent({
  tagName: "tc-secrets-manager",
  elementClass: TcSecretsManager,
  react: React,
  events: {
    onTcSecretSet: "tc-secret-set" as EventName<CustomEvent<SecretSet>>,
    onTcSecretDelete: "tc-secret-delete" as EventName<CustomEvent<SecretDelete>>,
    onTcSecretsChange: "tc-secrets-change" as EventName<CustomEvent<SecretsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSecretsManager>;
type Owned = "heading" | "secrets" | "onTcSecretSet" | "onTcSecretDelete" | "onTcSecretsChange" | "children";
export type SecretsManagerProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Secrets" */
  title?: string;
  /** The secrets – controlled when given */
  secrets?: Secret[];
  /** The secrets on mount when `secrets` isn't controlled */
  defaultSecrets?: Secret[];
  /** The list changed after a set, an add or a delete */
  onSecretsChange?: (secrets: Secret[], detail: SecretsChange) => void;
  /** Save or Add with a value: store it. The value isn't kept anywhere else. Return false to refuse it */
  onSecretSet?: (detail: SecretSet) => void | boolean;
  /** Delete was confirmed. Return false to keep the secret */
  onSecretDelete?: (name: string, secret: Secret) => void | boolean;
};

const NONE: Secret[] = [];

export function SecretsManager({ title, secrets, defaultSecrets = NONE, onSecretsChange, onSecretSet, onSecretDelete, ...props }: SecretsManagerProps) {
  const s = useControlled<Secret[]>(secrets, defaultSecrets, undefined);
  return h(RawSecretsManager, {
    ...props,
    heading: title ?? "",
    secrets: s.value,
    onTcSecretSet: (e: CustomEvent<SecretSet>) => {
      if (onSecretSet?.(e.detail) === false) e.preventDefault();
    },
    onTcSecretDelete: (e: CustomEvent<SecretDelete>) => {
      if (onSecretDelete?.(e.detail.name, e.detail.secret) === false) e.preventDefault();
    },
    onTcSecretsChange: (e: CustomEvent<SecretsChange>) => {
      s.handler(e.detail.secrets, e);
      onSecretsChange?.(e.detail.secrets, e.detail);
    },
  });
}
