import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcProviderConnection, type ProviderConnectionTestEvent, type ProviderConnectionValue, type ProviderConnectionValueChange } from "../provider-connection";
import { h, useControlled } from "./internal";

export type {
  ProviderConnectionCheck,
  ProviderConnectionCredential,
  ProviderConnectionHealth,
  ProviderConnectionModel,
  ProviderConnectionOption,
  ProviderConnectionState,
  ProviderConnectionValue,
} from "../provider-connection";
export { PROVIDER_CONNECTION_LABELS } from "../provider-connection";

const RawProviderConnection = createComponent({
  tagName: "tc-provider-connection",
  elementClass: TcProviderConnection,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ProviderConnectionValueChange>>,
    onTcTest: "tc-test" as EventName<CustomEvent<ProviderConnectionTestEvent>>,
  },
});

type RawProps = React.ComponentProps<typeof RawProviderConnection>;
export type ProviderConnectionProps = Omit<RawProps, "value" | "defaultValue" | "heading" | "onTcValueChange" | "onTcTest" | "onChange"> & {
  /** Shown at the top; names the group */
  title?: string;
  /** The connection (controlled) */
  value?: ProviderConnectionValue;
  /** The connection to start with when uncontrolled */
  defaultValue?: ProviderConnectionValue;
  /** Called with the whole connection after every change */
  onChange?: (value: ProviderConnectionValue) => void;
  /** Test connection was pressed: try `value`, stop when `signal` aborts, then set `check` */
  onTest?: (value: ProviderConnectionValue, signal: AbortSignal) => void;
};

const DEFAULT: ProviderConnectionValue = { provider: "", endpoint: "", deployment: "", credentialRef: "" };

export function ProviderConnection({ title, value, defaultValue = DEFAULT, onChange, onTest, ...props }: ProviderConnectionProps) {
  const v = useControlled(value, defaultValue, onChange);
  return h(RawProviderConnection, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    onTcValueChange: (e: CustomEvent<ProviderConnectionValueChange>) => v.handler(e.detail.value, e),
    onTcTest: (e: CustomEvent<ProviderConnectionTestEvent>) => onTest?.(e.detail.value, e.detail.signal),
  });
}
