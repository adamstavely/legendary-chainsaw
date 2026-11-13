import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRequestLog, type ProviderRequest, type RequestLogClassesChange, type RequestLogCopy, type RequestLogModelsChange, type RequestLogOpen, type RequestLogSelectedChange, type RequestStatusClass } from "../request-log";
import { h, useControlled } from "./internal";

export type { ProviderRequest, RequestLogClassesChange, RequestLogCopy, RequestLogLabels, RequestLogModelsChange, RequestLogOpen, RequestLogSelectedChange, RequestStatusClass } from "../request-log";
export { curlCommand, defaultRedactKeys, defaultRequestLogLabels, redact, REDACTED, requestStatusClasses, statusClass, statusWords } from "../request-log";

const RawRequestLog = createComponent({
  tagName: "tc-request-log",
  elementClass: TcRequestLog,
  react: React,
  events: {
    onTcClassesChange: "tc-classes-change" as EventName<CustomEvent<RequestLogClassesChange>>,
    onTcModelsChange: "tc-models-change" as EventName<CustomEvent<RequestLogModelsChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RequestLogSelectedChange>>,
    onTcRequestOpen: "tc-request-open" as EventName<CustomEvent<RequestLogOpen>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<RequestLogCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRequestLog>;
type Owned = "heading" | "classes" | "models" | "selected" | "onTcClassesChange" | "onTcModelsChange" | "onTcSelectedChange" | "onTcRequestOpen" | "onTcCopy" | "children";
export type RequestLogProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The status classes that show, empty for all – controlled when given */
  classes?: RequestStatusClass[];
  /** The classes that show at first, when `classes` isn't controlled */
  defaultClasses?: RequestStatusClass[];
  /** A status class chip was toggled */
  onClassesChange?: (classes: RequestStatusClass[]) => void;
  /** The models that show, empty for all – controlled when given */
  models?: string[];
  /** The models that show at first, when `models` isn't controlled */
  defaultModels?: string[];
  /** A model chip was toggled */
  onModelsChange?: (models: string[]) => void;
  /** The open request's id – controlled when given */
  selected?: string | null;
  /** The open request at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A request was opened or its details closed */
  onSelectedChange?: (selected: string | null, request?: ProviderRequest) => void;
  /** A request was opened */
  onRequestOpen?: (id: string, request: ProviderRequest) => void;
  /** Copy as cURL was pressed; return false to write the clipboard yourself */
  onCopyCurl?: (text: string, id: string) => void | boolean;
};

const NO_CLASSES: RequestStatusClass[] = [];
const NO_MODELS: string[] = [];

export function RequestLog({ title = "Requests", classes, defaultClasses = NO_CLASSES, onClassesChange, models, defaultModels = NO_MODELS, onModelsChange, selected, defaultSelected = null, onSelectedChange, onRequestOpen, onCopyCurl, ...props }: RequestLogProps) {
  const c = useControlled<RequestStatusClass[]>(classes, defaultClasses, onClassesChange);
  const m = useControlled<string[]>(models, defaultModels, onModelsChange);
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  return h(RawRequestLog, {
    ...props,
    heading: title,
    classes: c.value,
    models: m.value,
    selected: s.value,
    // Only the log's own events: the JSON Viewer inside it fires its own tc-copy, which bubbles through here
    onTcClassesChange: (e: CustomEvent<RequestLogClassesChange>) => {
      if (e.target === e.currentTarget) c.handler(e.detail.classes, e);
    },
    onTcModelsChange: (e: CustomEvent<RequestLogModelsChange>) => {
      if (e.target === e.currentTarget) m.handler(e.detail.models, e);
    },
    onTcSelectedChange: (e: CustomEvent<RequestLogSelectedChange>) => {
      if (e.target !== e.currentTarget) return;
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.request);
    },
    onTcRequestOpen: (e: CustomEvent<RequestLogOpen>) => onRequestOpen?.(e.detail.id, e.detail.request),
    onTcCopy: (e: CustomEvent<RequestLogCopy>) => {
      if (e.target !== e.currentTarget || e.detail.field !== "curl") return;
      if (onCopyCurl?.(e.detail.text, e.detail.id) === false) e.preventDefault();
    },
  });
}
