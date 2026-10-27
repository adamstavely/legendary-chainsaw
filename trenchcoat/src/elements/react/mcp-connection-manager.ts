import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMcpConnectionManager, type McpConnectEvent, type McpDisconnectEvent, type McpServer, type McpTestEvent, type McpValueChange } from "../mcp-connection-manager";
import { h, useControlled } from "./internal";

export type { McpAuthOption, McpCapability, McpConnection, McpCredential, McpServer, McpStatus, McpTransportOption } from "../mcp-connection-manager";
export { MCP_AUTH, MCP_STATUS_LABELS, MCP_TRANSPORTS } from "../mcp-connection-manager";

const RawMcpConnectionManager = createComponent({
  tagName: "tc-mcp-connection-manager",
  elementClass: TcMcpConnectionManager,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<McpValueChange>>,
    onTcConnect: "tc-connect" as EventName<CustomEvent<McpConnectEvent>>,
    onTcDisconnect: "tc-disconnect" as EventName<CustomEvent<McpDisconnectEvent>>,
    onTcTest: "tc-test" as EventName<CustomEvent<McpTestEvent>>,
  },
});

type RawProps = React.ComponentProps<typeof RawMcpConnectionManager>;
type Owned = "value" | "defaultValue" | "heading" | "onTcValueChange" | "onTcConnect" | "onTcDisconnect" | "onTcTest" | "onChange";
export type McpConnectionManagerProps = Omit<RawProps, Owned> & {
  /** Shown at the top; names the group */
  title?: string;
  /** The servers (controlled) */
  value?: McpServer[];
  /** The servers to start with when uncontrolled */
  defaultValue?: McpServer[];
  /** Called with the whole list after a server is added or removed, and what changed */
  onChange?: (value: McpServer[], change: McpValueChange["change"]) => void;
  /** Connect or Retry was pressed: connect, stop when `signal` aborts, then update `connections` */
  onConnect?: (server: McpServer, signal: AbortSignal, retry: boolean) => void;
  /** Disconnect was pressed, or a tested server was never added: disconnect it, then update `connections` */
  onDisconnect?: (server: McpServer) => void;
  /** Test was pressed in the add form: try the server and report on `connections[server.id]` */
  onTest?: (server: McpServer, signal: AbortSignal) => void;
};
const NONE: McpServer[] = [];

export function McpConnectionManager({ title, value, defaultValue = NONE, onChange, onConnect, onDisconnect, onTest, ...props }: McpConnectionManagerProps) {
  const last = React.useRef<McpValueChange["change"] | null>(null);
  const v = useControlled(value, defaultValue, onChange ? (next: McpServer[]) => onChange(next, last.current!) : undefined);
  return h(RawMcpConnectionManager, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    onTcValueChange: (e: CustomEvent<McpValueChange>) => {
      last.current = e.detail.change;
      v.handler(e.detail.value, e);
    },
    onTcConnect: (e: CustomEvent<McpConnectEvent>) => onConnect?.(e.detail.server, e.detail.signal, e.detail.retry),
    onTcDisconnect: (e: CustomEvent<McpDisconnectEvent>) => onDisconnect?.(e.detail.server),
    onTcTest: (e: CustomEvent<McpTestEvent>) => onTest?.(e.detail.server, e.detail.signal),
  });
}
