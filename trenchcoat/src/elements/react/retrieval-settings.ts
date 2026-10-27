import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { RETRIEVAL_SETTINGS_DEFAULT, TcRetrievalSettings, type RetrievalSettingsChange, type RetrievalSettingsValue, type RetrievalStage, type RetrievalStageChange } from "../retrieval-settings";
import { h, useControlled } from "./internal";

export type { RetrievalEstimate, RetrievalFilter, RetrievalFilterField, RetrievalFilterOperator, RetrievalRerankModel, RetrievalSettingsValue, RetrievalStage } from "../retrieval-settings";
export { RETRIEVAL_SETTINGS_DEFAULT, retrievalSettingsProblem } from "../retrieval-settings";

const RawRetrievalSettings = createComponent({
  tagName: "tc-retrieval-settings",
  elementClass: TcRetrievalSettings,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<RetrievalSettingsChange>>,
    onTcStageChange: "tc-stage-change" as EventName<CustomEvent<RetrievalStageChange>>,
  },
});

type RawProps = React.ComponentProps<typeof RawRetrievalSettings>;
export type RetrievalSettingsProps = Omit<RawProps, "value" | "defaultValue" | "heading" | "stage" | "onTcValueChange" | "onTcStageChange" | "onChange"> & {
  /** Shown at the top; names the group */
  title?: string;
  /** The config (controlled) */
  value?: RetrievalSettingsValue;
  /** The config to start with when uncontrolled */
  defaultValue?: RetrievalSettingsValue;
  /** Called with the whole config after every change */
  onChange?: (value: RetrievalSettingsValue) => void;
  /** The stage whose settings show – controlled when given */
  stage?: RetrievalStage;
  /** A stage was opened for editing */
  onStageChange?: (stage: RetrievalStage) => void;
};

export function RetrievalSettings({ title, value, defaultValue = RETRIEVAL_SETTINGS_DEFAULT, onChange, stage, onStageChange, ...props }: RetrievalSettingsProps) {
  const v = useControlled(value, defaultValue, onChange);
  const st = useControlled<RetrievalStage>(stage, "retrieve", onStageChange);
  return h(RawRetrievalSettings, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    stage: st.value,
    onTcValueChange: (e: CustomEvent<RetrievalSettingsChange>) => v.handler(e.detail.value, e),
    onTcStageChange: (e: CustomEvent<RetrievalStageChange>) => st.handler(e.detail.stage, e),
  });
}
