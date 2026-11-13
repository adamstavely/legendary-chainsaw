import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEmbedConfigurator, defaultEmbedConfig, type EmbedConfig, type EmbedConfigChange, type EmbedConfigField } from "../embed-configurator";
import { h, useControlled } from "./internal";

export type { EmbedConfig, EmbedConfigChange, EmbedConfigField, EmbedConfiguratorLabels } from "../embed-configurator";
export { MAX_EMBED_STARTERS, checkEmbedDomain, defaultEmbedConfig, defaultEmbedConfiguratorLabels, describeEmbedAccent, embedSnippet } from "../embed-configurator";

const RawEmbedConfigurator = createComponent({
  tagName: "tc-embed-configurator",
  elementClass: TcEmbedConfigurator,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<EmbedConfigChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<{ text: string }>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEmbedConfigurator>;
type Owned = "heading" | "value" | "defaultValue" | "onTcValueChange" | "onTcCopy" | "children";
export type EmbedConfiguratorProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Site widget" */
  title?: string;
  /** The settings – controlled when given */
  value?: EmbedConfig;
  /** The settings on mount when `value` isn't controlled */
  defaultValue?: EmbedConfig;
  /** A setting changed: the whole next value, and which one */
  onValueChange?: (value: EmbedConfig, field: EmbedConfigField) => void;
  /** The install snippet was copied */
  onCopySnippet?: (text: string) => void;
};

export function EmbedConfigurator({ title, value, defaultValue = defaultEmbedConfig, onValueChange, onCopySnippet, ...props }: EmbedConfiguratorProps) {
  const field = React.useRef<EmbedConfigField>("title");
  const v = useControlled<EmbedConfig>(value, defaultValue, onValueChange ? (next) => onValueChange(next, field.current) : undefined, { ownEvents: true });
  return h(RawEmbedConfigurator, {
    ...props,
    heading: title ?? "Site widget",
    value: v.value,
    onTcValueChange: (e: CustomEvent<EmbedConfigChange>) => {
      field.current = e.detail.field;
      v.handler(e.detail.value, e);
    },
    onTcCopy: (e: CustomEvent<{ text: string }>) => onCopySnippet?.(e.detail.text),
  });
}
