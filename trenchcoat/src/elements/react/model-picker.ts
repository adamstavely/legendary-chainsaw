import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcModelPicker, type ModelEffort, type PickerModel as ElementModel } from "../model-picker";
import { h, isNode, useControlled, useStaged } from "./internal";

/** A glyph may be a React node, as before */
export type PickerModel = Omit<ElementModel, "icon"> & { icon?: React.ReactNode };
export type { ModelEffort } from "../model-picker";

const RawModelPicker = createComponent({
  tagName: "tc-model-picker",
  elementClass: TcModelPicker,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<{ value: string }>>,
    onTcThinkingChange: "tc-thinking-change" as EventName<CustomEvent<{ thinking: boolean }>>,
    onTcWebSearchChange: "tc-web-search-change" as EventName<CustomEvent<{ webSearch: boolean }>>,
    onTcEffortChange: "tc-effort-change" as EventName<CustomEvent<{ effort: ModelEffort }>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
  },
});
type RawModelPickerProps = React.ComponentProps<typeof RawModelPicker>;
type Own = "models" | "value" | "onChange" | "thinking" | "webSearch" | "effort" | "open" | "onTcValueChange" | "onTcThinkingChange" | "onTcWebSearchChange" | "onTcEffortChange" | "onTcOpenChange";
export type ModelPickerProps = Omit<RawModelPickerProps, Own> & {
  /** The models to choose from, in menu order; `icon` may be a React node */
  models: PickerModel[];
  /** Id of the chosen model (controlled when defined) */
  value?: string;
  /** The model chosen at first when uncontrolled – defaults to the first one */
  defaultValue?: string;
  /** Called with the id of the model that was picked */
  onChange?: (id: string) => void;
  /** Extended thinking switch */
  thinking?: boolean;
  /** Extended thinking at first when uncontrolled – off by default */
  defaultThinking?: boolean;
  /** Called when extended thinking is switched on or off */
  onThinkingChange?: (on: boolean) => void;
  /** Web search switch */
  webSearch?: boolean;
  /** Web search at first when uncontrolled – off by default */
  defaultWebSearch?: boolean;
  /** Called when web search is switched on or off */
  onWebSearchChange?: (on: boolean) => void;
  /** How hard the model thinks – only shown while extended thinking is on */
  effort?: ModelEffort;
  /** Effort at first when uncontrolled – "medium" by default */
  defaultEffort?: ModelEffort;
  /** Called with the new effort level */
  onEffortChange?: (effort: ModelEffort) => void;
  /** Controlled open state of the menu */
  open?: boolean;
  /** Whether the menu starts open when uncontrolled */
  defaultOpen?: boolean;
  /** Called when the menu opens or closes */
  onOpenChange?: (open: boolean) => void;
};

export function ModelPicker({
  models,
  value,
  defaultValue,
  onChange,
  thinking,
  defaultThinking = false,
  onThinkingChange,
  webSearch,
  defaultWebSearch = false,
  onWebSearchChange,
  effort,
  defaultEffort = "medium",
  onEffortChange,
  open,
  defaultOpen = false,
  onOpenChange,
  onKeyDown,
  ref,
  ...props
}: ModelPickerProps) {
  const { stage, els } = useStaged(models.filter((m) => isNode(m.icon)).map((m) => [m.id, m.icon]));
  const list = React.useMemo(() => models.map((m) => (isNode(m.icon) ? { ...m, icon: els[m.id] } : m)) as ElementModel[], [models, els]);
  const v = useControlled(value, defaultValue ?? models[0]?.id ?? "", onChange);
  const t = useControlled(thinking, defaultThinking, onThinkingChange);
  const w = useControlled(webSearch, defaultWebSearch, onWebSearchChange);
  const e = useControlled(effort, defaultEffort, onEffortChange);
  const o = useControlled(open, defaultOpen, onOpenChange);
  // Escape that closes the menu stops at the element (so a dialog around it stays open); the page's onKeyDown still
  // hears every key, through a listener on the element itself
  const host = React.useRef<TcModelPicker | null>(null);
  const keyDown = React.useRef(onKeyDown);
  keyDown.current = onKeyDown;
  React.useEffect(() => {
    const el = host.current;
    if (!el) return;
    const listener = (ev: KeyboardEvent) => keyDown.current?.(ev as unknown as React.KeyboardEvent<TcModelPicker>);
    el.addEventListener("keydown", listener);
    return () => el.removeEventListener("keydown", listener);
  }, []);
  const setRef = React.useCallback(
    (el: TcModelPicker | null) => {
      host.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.RefObject<TcModelPicker | null>).current = el;
    },
    [ref],
  );
  return h(React.Fragment, null, stage, h(RawModelPicker, {
    ...props,
    ref: setRef,
    models: list,
    value: v.value,
    thinking: t.value,
    webSearch: w.value,
    effort: e.value,
    open: o.value,
    onTcValueChange: (ev: CustomEvent<{ value: string }>) => v.handler(ev.detail.value, ev),
    onTcThinkingChange: (ev: CustomEvent<{ thinking: boolean }>) => t.handler(ev.detail.thinking, ev),
    onTcWebSearchChange: (ev: CustomEvent<{ webSearch: boolean }>) => w.handler(ev.detail.webSearch, ev),
    onTcEffortChange: (ev: CustomEvent<{ effort: ModelEffort }>) => e.handler(ev.detail.effort, ev),
    onTcOpenChange: (ev: CustomEvent<{ open: boolean }>) => o.handler(ev.detail.open, ev),
  }));
}
