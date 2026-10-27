import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcModelRouting, type ModelRoutingChange, type ModelRoutingValue, type RouteTestRequest } from "../model-routing";
import { h, useControlled } from "./internal";

export type { ModelRoutingValue, RouteBreakerState, RouteHealthStatus, RouteRule, RouteTarget, RouteTargetHealth, RouteTestResult } from "../model-routing";

const RawModelRouting = createComponent({
  tagName: "tc-model-routing",
  elementClass: TcModelRouting,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ModelRoutingChange>>,
    onTcRouteTest: "tc-route-test" as EventName<CustomEvent<RouteTestRequest>>,
  },
});

type RawProps = React.ComponentProps<typeof RawModelRouting>;
export type ModelRoutingProps = Omit<RawProps, "value" | "defaultValue" | "heading" | "onTcValueChange" | "onTcRouteTest" | "onChange"> & {
  /** Shown at the top; names the group */
  title?: string;
  /** The rules and the fallback chain (controlled) */
  value?: ModelRoutingValue;
  /** The rules and the chain to start with when uncontrolled */
  defaultValue?: ModelRoutingValue;
  /** Called with the whole routing after a reorder, removal or added fallback */
  onChange?: (value: ModelRoutingValue) => void;
  /** Test a route was submitted: work out where `input` goes and pass the answer back as `testResult` */
  onTest?: (input: string, value: ModelRoutingValue) => void;
};

const EMPTY: ModelRoutingValue = { rules: [], fallbacks: [] };

export function ModelRouting({ title, value, defaultValue = EMPTY, onChange, onTest, ...props }: ModelRoutingProps) {
  const v = useControlled(value, defaultValue, onChange);
  return h(RawModelRouting, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    onTcValueChange: (e: CustomEvent<ModelRoutingChange>) => v.handler(e.detail.value, e),
    onTcRouteTest: (e: CustomEvent<RouteTestRequest>) => {
      // Nobody to answer: don't show the test as pending
      if (!onTest) e.preventDefault();
      else onTest(e.detail.input, e.detail.value);
    },
  });
}
