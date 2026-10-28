import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcClientContext,
  defaultContextClients,
  type ClientContextAdd,
  type ClientContextClientChange,
  type ClientContextCreate,
  type ClientContextTabChange,
  type ContextClient,
  type ContextFile,
  type ContextTab,
} from "../client-context";
import { h, useControlled } from "./internal";

export type {
  ContextClient,
  ContextEntry,
  ContextFile,
  ClientContextKind,
  ContextKpi,
  ContextPerson,
  ContextReport,
  ContextTab,
} from "../client-context";
export { defaultContextClients } from "../client-context";

const RawClientContext = createComponent({
  tagName: "tc-client-context",
  elementClass: TcClientContext,
  react: React,
  events: {
    onTcClientChange: "tc-client-change" as EventName<CustomEvent<ClientContextClientChange>>,
    onTcAddContext: "tc-add-context" as EventName<CustomEvent<ClientContextAdd>>,
    onTcCreateClient: "tc-create-client" as EventName<CustomEvent<ClientContextCreate>>,
    onTcTabChange: "tc-tab-change" as EventName<CustomEvent<ClientContextTabChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawClientContext>;
type Owned = "client" | "clients" | "tab" | "onTcClientChange" | "onTcAddContext" | "onTcCreateClient" | "onTcTabChange" | "children";
export type ClientContextProps = Omit<RawProps, Owned> & {
  /**
   * The clients and their context. Context added or removed in the block is kept per client until you pass a
   * different context for that client – then your data wins
   */
  clients?: ContextClient[];
  /** Id of the open client (controlled) – pass `onClientChange` with it. Leave undefined to start at `defaultClient` (the first) */
  client?: string;
  /** The client open on mount when `client` isn't controlled – the first by default */
  defaultClient?: string;
  /** A client was picked or created */
  onClientChange?: (id: string) => void;
  /** The section shown (controlled) – pass `onTabChange` with it */
  tab?: ContextTab;
  /** The section on mount when `tab` isn't controlled */
  defaultTab?: ContextTab;
  /** The section changed */
  onTabChange?: (tab: ContextTab) => void;
  /** Called when context is added, with the client, the text and any attached files */
  onAddContext?: (clientId: string, text: string, files: ContextFile[]) => void;
  /** Called when a client is created from the switcher */
  onCreateClient?: (name: string) => void;
};

export function ClientContext({
  clients = defaultContextClients,
  client,
  defaultClient,
  onClientChange,
  tab,
  defaultTab = "context",
  onTabChange,
  onAddContext,
  onCreateClient,
  ...props
}: ClientContextProps) {
  const c = useControlled<string>(client, defaultClient ?? clients[0]?.id ?? "", onClientChange);
  const t = useControlled<ContextTab>(tab, defaultTab, onTabChange);
  return h(RawClientContext, {
    ...props,
    clients,
    client: c.value,
    tab: t.value,
    onTcClientChange: (e: CustomEvent<ClientContextClientChange>) => c.handler(e.detail.client, e),
    onTcTabChange: (e: CustomEvent<ClientContextTabChange>) => t.handler(e.detail.tab, e),
    onTcAddContext: (e: CustomEvent<ClientContextAdd>) => onAddContext?.(e.detail.client, e.detail.text, e.detail.files),
    onTcCreateClient: (e: CustomEvent<ClientContextCreate>) => onCreateClient?.(e.detail.name),
  });
}
