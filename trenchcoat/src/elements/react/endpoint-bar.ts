import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEndpointBar, type EndpointCopy, type EndpointEnvironmentChange, type EndpointTry } from "../endpoint-bar";
import { h, useControlled } from "./internal";

export type {
  EndpointBarLabels,
  EndpointCopy,
  EndpointEnvironment,
  EndpointEnvironmentChange,
  EndpointMethod,
  EndpointParam,
  EndpointTry,
} from "../endpoint-bar";
export { defaultEndpointBarLabels, endpointPathParts } from "../endpoint-bar";

const RawEndpointBar = createComponent({
  tagName: "tc-endpoint-bar",
  elementClass: TcEndpointBar,
  react: React,
  events: {
    onTcEnvironmentChange: "tc-environment-change" as EventName<CustomEvent<EndpointEnvironmentChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<EndpointCopy>>,
    onTcTry: "tc-try" as EventName<CustomEvent<EndpointTry>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEndpointBar>;
export type EndpointBarProps = Omit<RawProps, "environment" | "onTcEnvironmentChange" | "onTcCopy" | "onTcTry" | "children"> & {
  /** The picked environment's id – controlled when given */
  environment?: string;
  /** The environment on mount, when `environment` isn't controlled; by default the first */
  defaultEnvironment?: string;
  /** Called with the environment the user picked */
  onEnvironmentChange?: (environment: string) => void;
  /** Copy URL was pressed; return false to stop the copy */
  onCopyUrl?: (url: string) => boolean | void;
  /** Try it was pressed */
  onTry?: (request: EndpointTry) => void;
};

export function EndpointBar({ environment, defaultEnvironment = "", onEnvironmentChange, onCopyUrl, onTry, ...props }: EndpointBarProps) {
  const env = useControlled<string>(environment, defaultEnvironment, onEnvironmentChange);
  return h(RawEndpointBar, {
    ...props,
    environment: env.value,
    onTcEnvironmentChange: (e: CustomEvent<EndpointEnvironmentChange>) => env.handler(e.detail.environment, e),
    onTcCopy: (e: CustomEvent<EndpointCopy>) => {
      if (onCopyUrl?.(e.detail.text) === false) e.preventDefault();
    },
    onTcTry: (e: CustomEvent<EndpointTry>) => onTry?.(e.detail),
  });
}
