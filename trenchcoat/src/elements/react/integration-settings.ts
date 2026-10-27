import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcIntegrationSettings, type IntegrationValues } from "../integration-settings";
import { h, isNode, useStaged } from "./internal";

export type { IntegrationValues } from "../integration-settings";

const RawIntegrationSettings = createComponent({
  tagName: "tc-integration-settings",
  elementClass: TcIntegrationSettings,
  react: React,
  events: {
    onTcValuesChange: "tc-values-change" as EventName<CustomEvent<{ values: IntegrationValues }>>,
  },
});
type RawProps = React.ComponentProps<typeof RawIntegrationSettings>;
export type IntegrationSettingsOwnProps = {
  /** The service's name, e.g. "Shopify" */
  name: string;
  /** The service's logo, shown beside its name */
  logo: React.ReactNode;
  /** Small number next to the name, e.g. synced orders */
  count?: number;
  /** Line under the name, e.g. when it was connected */
  meta?: string;
  /** The saved values. Controlled when defined: the card shows them, edits collect in the save bar, and saved changes
   *  (Save, the switch) are reported through onValuesChange. Fields that weren't edited follow new values right away */
  values?: Partial<IntegrationValues>;
  /** Saved values when uncontrolled. Read again when they change (e.g. once they've loaded) – fields that weren't
   *  edited follow */
  defaultValues?: Partial<IntegrationValues>;
  /** Called with all values whenever the saved values change: after a save, or when the switch flips */
  onValuesChange?: (values: IntegrationValues) => void;
  /** Helper text under the address field */
  siteHint?: string;
  /** The time zones the picker offers, as labels like "(GMT +01:00) Berlin" – the first is the default */
  timeZones?: string[];
  /**
   * Creates a key – return it, or a promise of it; a rejection shows an error and keeps the old key. Without it a
   * random `sk_demo_…` key is made up (and warns once, unless `demo` is set)
   */
  onGenerateKey?: (options: { signal: AbortSignal }) => string | Promise<string>;
  /** Called with all values when Save is pressed. A rejection keeps the changes unsaved and shows an error.
   *  The signal aborts when the card unmounts */
  onSave?: (values: IntegrationValues, options: { signal: AbortSignal }) => void | Promise<void>;
  /** Demo mode: keys are made up silently when onGenerateKey is missing. For galleries and prototypes */
  demo?: boolean;
  /** Called when the switch flips. May return a promise: the switch shows that it's working and flips when it
   *  resolves; a rejection leaves it as it was and shows an error */
  onToggle?: (enabled: boolean, options: { signal: AbortSignal }) => void | Promise<unknown>;
};
export type IntegrationSettingsProps = Omit<RawProps, keyof IntegrationSettingsOwnProps | "generateKey" | "saveValues" | "toggleEnabled" | "onTcValuesChange"> & IntegrationSettingsOwnProps;

const sig = (v: Partial<IntegrationValues> | undefined) => JSON.stringify([v?.enabled, v?.siteUrl, v?.timeZone, v?.apiKey]);

export function IntegrationSettings({ logo, values, defaultValues, onValuesChange, onGenerateKey, onSave, onToggle, ...props }: IntegrationSettingsProps) {
  const { stage, els } = useStaged(isNode(logo) ? [["logo", logo]] : []);
  // The saved values: `values` when passed, else kept here from defaultValues – which are read again whenever they
  // change (data that arrives after the first render); following them isn't reported as a change
  const [own, setOwn] = React.useState<Partial<IntegrationValues>>(defaultValues ?? {});
  const [lastDefaults, setLastDefaults] = React.useState(sig(defaultValues));
  if (sig(defaultValues) !== lastDefaults) {
    setLastDefaults(sig(defaultValues));
    setOwn(defaultValues ?? {});
  }
  const controlled = values !== undefined;
  return h(React.Fragment, null, stage, h(RawIntegrationSettings, {
    ...props,
    logo: isNode(logo) ? els.logo : (logo as Element | undefined),
    values: controlled ? values : own,
    generateKey: onGenerateKey,
    saveValues: onSave,
    toggleEnabled: onToggle,
    onTcValuesChange: (e: CustomEvent<{ values: IntegrationValues }>) => {
      if (controlled) e.preventDefault();
      else setOwn(e.detail.values);
      onValuesChange?.(e.detail.values);
    },
  }));
}
