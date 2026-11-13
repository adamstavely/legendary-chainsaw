import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDeployChannels, type DeployChannel, type DeployChannelActionDetail, type DeployChannelsChange } from "../deploy-channels";
import { h, useControlled } from "./internal";

export type {
  DeployChannel,
  DeployChannelAction,
  DeployChannelActionDetail,
  DeployChannelKind,
  DeployChannelStatus,
  DeployChannelsChange,
  DeployChannelsLabels,
  DeployChannelsLabelsInput,
} from "../deploy-channels";

const RawDeployChannels = createComponent({
  tagName: "tc-deploy-channels",
  elementClass: TcDeployChannels,
  react: React,
  events: {
    onTcChannelAction: "tc-channel-action" as EventName<CustomEvent<DeployChannelActionDetail>>,
    onTcChannelsChange: "tc-channels-change" as EventName<CustomEvent<DeployChannelsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDeployChannels>;
type Owned = "heading" | "channels" | "onTcChannelAction" | "onTcChannelsChange" | "children";
export type DeployChannelsProps = Omit<RawProps, Owned> & {
  /** The heading; "Channels" by default */
  title?: string;
  /** The channels – controlled when given */
  channels?: DeployChannel[];
  /** On mount, when `channels` isn't controlled */
  defaultChannels?: DeployChannel[];
  /** Pause or Resume changed a row's status */
  onChannelsChange?: (channels: DeployChannel[]) => void;
  /** A row's action was pressed; return false to stop Pause or Resume changing the status */
  onChannelAction?: (detail: DeployChannelActionDetail) => boolean | void;
};

const NONE: DeployChannel[] = [];

export function DeployChannels({ title, channels, defaultChannels = NONE, onChannelsChange, onChannelAction, ...props }: DeployChannelsProps) {
  const c = useControlled<DeployChannel[]>(channels, defaultChannels, onChannelsChange);
  return h(RawDeployChannels, {
    ...props,
    heading: title ?? "Channels",
    channels: c.value,
    onTcChannelAction: (e: CustomEvent<DeployChannelActionDetail>) => {
      if (onChannelAction?.(e.detail) === false) e.preventDefault();
    },
    onTcChannelsChange: (e: CustomEvent<DeployChannelsChange>) => c.handler(e.detail.channels, e),
  });
}
