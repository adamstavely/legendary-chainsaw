import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcModelSettings, type ModelSettingsChange, type ModelSettingsValue } from "../model-settings";
import { h, useControlled } from "./internal";

export type { ModelParam, ModelParamValue, ModelSettingsConflict, ModelSettingsModel, ModelSettingsPreset, ModelSettingsValue } from "../model-settings";
export { defaultModelConflicts, defaultModelParams, defaultModelPresets, formatModelParam } from "../model-settings";

const RawModelSettings = createComponent({
  tagName: "tc-model-settings",
  elementClass: TcModelSettings,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<ModelSettingsChange>> },
});

type RawProps = React.ComponentProps<typeof RawModelSettings>;
export type ModelSettingsProps = Omit<RawProps, "value" | "defaultValue" | "heading" | "onTcValueChange" | "onChange"> & {
  /** Shown at the top; names the group */
  title?: string;
  /** The values the person set, by parameter id (controlled); missing ones are the model's defaults */
  value?: ModelSettingsValue;
  /** The values to start with when uncontrolled */
  defaultValue?: ModelSettingsValue;
  /** Called with the next values and the ids that changed */
  onChange?: (value: ModelSettingsValue, changed: string[]) => void;
};

const NONE: ModelSettingsValue = {};

export function ModelSettings({ title, value, defaultValue = NONE, onChange, ...props }: ModelSettingsProps) {
  const changed = React.useRef<string[]>([]);
  const report = React.useCallback((next: ModelSettingsValue) => onChange?.(next, changed.current), [onChange]);
  const v = useControlled(value, defaultValue, onChange ? report : undefined);
  return h(RawModelSettings, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    onTcValueChange: (e: CustomEvent<ModelSettingsChange>) => {
      changed.current = e.detail.changed;
      v.handler(e.detail.value, e);
    },
  });
}
