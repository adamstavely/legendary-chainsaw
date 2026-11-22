import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcWebhooks,
  type WebhookDeliveryRetry,
  type WebhookEndpoint,
  type WebhookEndpointCreate,
  type WebhookEndpointDelete,
  type WebhookEndpointTest,
  type WebhookEndpointToggle,
  type WebhookEndpointUpdate,
} from "../webhooks";
import { h, useControlled } from "./internal";

export type {
  WebhookDelivery,
  WebhookDeliveryRetry,
  WebhookEndpoint,
  WebhookEndpointCreate,
  WebhookEndpointDelete,
  WebhookEndpointTest,
  WebhookEndpointToggle,
  WebhookEndpointUpdate,
  WebhookEventType,
  WebhooksLabels,
} from "../webhooks";
export { defaultWebhooksLabels, webhookHealth, webhookUrlOk } from "../webhooks";

const RawWebhooks = createComponent({
  tagName: "tc-webhooks",
  elementClass: TcWebhooks,
  react: React,
  events: {
    onTcEndpointToggle: "tc-endpoint-toggle" as EventName<CustomEvent<WebhookEndpointToggle>>,
    onTcEndpointCreate: "tc-endpoint-create" as EventName<CustomEvent<WebhookEndpointCreate>>,
    onTcEndpointUpdate: "tc-endpoint-update" as EventName<CustomEvent<WebhookEndpointUpdate>>,
    onTcEndpointDelete: "tc-endpoint-delete" as EventName<CustomEvent<WebhookEndpointDelete>>,
    onTcEndpointTest: "tc-endpoint-test" as EventName<CustomEvent<WebhookEndpointTest>>,
    onTcDeliveryRetry: "tc-delivery-retry" as EventName<CustomEvent<WebhookDeliveryRetry>>,
  },
});
type RawProps = React.ComponentProps<typeof RawWebhooks>;
type Owned =
  | "heading"
  | "endpoints"
  | "onTcEndpointToggle"
  | "onTcEndpointCreate"
  | "onTcEndpointUpdate"
  | "onTcEndpointDelete"
  | "onTcEndpointTest"
  | "onTcDeliveryRetry"
  | "children";
/** What changed in tc-endpoints-change terms: the toggle, update or delete that made it */
export type WebhookEndpointsChange = { kind: "toggle"; detail: WebhookEndpointToggle } | { kind: "update"; detail: WebhookEndpointUpdate } | { kind: "delete"; detail: WebhookEndpointDelete };
export type WebhooksProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Webhooks" */
  title?: string;
  /** The endpoints – controlled when given */
  endpoints?: WebhookEndpoint[];
  /** The endpoints on mount when `endpoints` isn't controlled */
  defaultEndpoints?: WebhookEndpoint[];
  /** An endpoint was switched, edited or deleted: the endpoints as they are now, and what changed */
  onEndpointsChange?: (endpoints: WebhookEndpoint[], change: WebhookEndpointsChange) => void;
  /** Add endpoint was submitted; add it to `endpoints`. Call event.preventDefault() to keep the form open */
  onEndpointCreate?: (detail: WebhookEndpointCreate, event: CustomEvent<WebhookEndpointCreate>) => void;
  /** Send test event was pressed */
  onEndpointTest?: (id: string) => void;
  /** Retry was pressed on a failed delivery */
  onDeliveryRetry?: (detail: WebhookDeliveryRetry) => void;
};

export function Webhooks({ title, endpoints, defaultEndpoints = [], onEndpointsChange, onEndpointCreate, onEndpointTest, onDeliveryRetry, ...props }: WebhooksProps) {
  const ep = useControlled<WebhookEndpoint[]>(endpoints, defaultEndpoints, undefined);
  return h(RawWebhooks, {
    ...props,
    heading: title ?? "",
    endpoints: ep.value,
    onTcEndpointToggle: (e: CustomEvent<WebhookEndpointToggle>) => {
      ep.handler(e.detail.endpoints, e);
      onEndpointsChange?.(e.detail.endpoints, { kind: "toggle", detail: e.detail });
    },
    onTcEndpointUpdate: (e: CustomEvent<WebhookEndpointUpdate>) => {
      ep.handler(e.detail.endpoints, e);
      onEndpointsChange?.(e.detail.endpoints, { kind: "update", detail: e.detail });
    },
    onTcEndpointDelete: (e: CustomEvent<WebhookEndpointDelete>) => {
      ep.handler(e.detail.endpoints, e);
      onEndpointsChange?.(e.detail.endpoints, { kind: "delete", detail: e.detail });
    },
    onTcEndpointCreate: (e: CustomEvent<WebhookEndpointCreate>) => onEndpointCreate?.(e.detail, e),
    onTcEndpointTest: (e: CustomEvent<WebhookEndpointTest>) => onEndpointTest?.(e.detail.id),
    onTcDeliveryRetry: (e: CustomEvent<WebhookDeliveryRetry>) => onDeliveryRetry?.(e.detail),
  });
}
