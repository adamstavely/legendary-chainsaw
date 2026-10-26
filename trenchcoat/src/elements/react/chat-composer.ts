import { createComponent, type EventName } from "@lit/react";
import { render as litRender } from "lit";
import * as React from "react";
import { TcChatComposer, chatModelLogo, defaultChatModels, type ChatModel as ElementModel } from "../chat-composer";
import type { ContextTrayChange, ContextTrayItem } from "../context-tray";
import type { MentionPickerPick } from "../mention-picker";
import { h, useControlled, useStaged } from "./internal";

/** A model in the picker; `Logo` is a React component, as before */
export type ChatModel = {
  id: string;
  name: string;
  description: string;
  Logo?: React.ComponentType;
};

/** The element model behind each of `defaultModels` – the element draws their logos in its own look */
const builtIn = new WeakMap<ChatModel, ElementModel>();
/** A default model's logo as a React component (outside a composer it draws in the Standard look) */
const logoComponent = (model: ElementModel) =>
  function Logo() {
    const box = React.useRef<HTMLSpanElement>(null);
    React.useLayoutEffect(() => {
      if (box.current) litRender(chatModelLogo(model, "standard"), box.current);
    }, []);
    return h("span", { ref: box, style: { display: "contents" } });
  };
export const defaultModels: ChatModel[] = defaultChatModels.map((m) => {
  const model: ChatModel = { id: m.id, name: m.name, description: m.description, Logo: logoComponent(m) };
  builtIn.set(model, m);
  return model;
});

const RawChatComposer = createComponent({
  tagName: "tc-chat-composer",
  elementClass: TcChatComposer,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<{ value: string }>>,
    onTcModelChange: "tc-model-change" as EventName<CustomEvent<{ model: string; choice: ElementModel }>>,
    onTcAttach: "tc-attach" as EventName<CustomEvent<null>>,
    onTcSelectProject: "tc-select-project" as EventName<CustomEvent<null>>,
    onTcItemsChange: "tc-items-change" as EventName<CustomEvent<{ items: ContextTrayItem[]; change: ContextTrayChange }>>,
    onTcPick: "tc-pick" as EventName<CustomEvent<MentionPickerPick>>,
  },
});
type RawChatComposerProps = React.ComponentProps<typeof RawChatComposer>;
type Own = "value" | "models" | "model" | "context" | "onTcValueChange" | "onTcModelChange" | "onTcAttach" | "onTcSelectProject" | "onTcItemsChange" | "onTcPick";
export type ChatComposerProps = Omit<RawChatComposerProps, Own> & {
  /** The message (controlled). Leave undefined to let the composer keep it, starting at `defaultValue` */
  value?: string;
  /** The message to start with when uncontrolled */
  defaultValue?: string;
  /** Every change to the message – typing, dictation, clearing after a send */
  onValueChange?: (value: string) => void;
  /** Models in the picker; the first one is selected by default. An empty list disables the picker */
  models?: ChatModel[];
  /** Id of the selected model (controlled). Leave undefined to let the composer keep it */
  model?: string;
  /** Id of the model selected at first when uncontrolled – defaults to the first model */
  defaultModel?: string;
  /** Reports the model picked in the menu – with `model` set, also the only way the selection changes */
  onModelChange?: (model: ChatModel) => void;
  /** The plus button only reports the click – open your own file or folder picker here */
  onAttach?: () => void;
  onSelectProject?: () => void;
  /** Opt-in: what's in context, as chips above the composer (controlled). Leave undefined to let it keep the list,
   *  starting at `defaultContext` – or leave both unset for no tray */
  context?: ContextTrayItem[];
  defaultContext?: ContextTrayItem[];
  /** Every change to the context chips: removed, restored, pinned */
  onContextChange?: (items: ContextTrayItem[], change: ContextTrayChange) => void;
  /** A row picked in the / and @ picker (set `mentions` to turn it on); call event.preventDefault() to keep the text */
  onMentionPick?: (pick: MentionPickerPick, event: Event) => void;
};

export function ChatComposer({ value, defaultValue = "", onValueChange, models = defaultModels, model, defaultModel, onModelChange, onAttach, onSelectProject, context, defaultContext, onContextChange, onMentionPick, ...props }: ChatComposerProps) {
  // Logos given as React components render in the staging box; the element gets their DOM nodes
  const { stage, els } = useStaged(models.filter((m) => !builtIn.has(m) && m.Logo).map((m) => [m.id, h(m.Logo!)]));
  const list = React.useMemo(() => models.map((m) => builtIn.get(m) ?? { id: m.id, name: m.name, description: m.description, logo: m.Logo ? els[m.id] : undefined }), [models, els]);
  const v = useControlled(value, defaultValue, onValueChange);
  const m = useControlled<string>(model, defaultModel ?? models[0]?.id ?? "", undefined);
  const lastChange = React.useRef<ContextTrayChange | null>(null);
  const c = useControlled<ContextTrayItem[] | undefined>(context, defaultContext, (items) => items && lastChange.current && onContextChange?.(items, lastChange.current));
  return h(React.Fragment, null, stage, h(RawChatComposer, {
    ...props,
    value: v.value,
    models: list,
    model: m.value,
    onTcValueChange: (e: CustomEvent<{ value: string }>) => v.handler(e.detail.value, e),
    onTcModelChange: (e: CustomEvent<{ model: string; choice: ElementModel }>) => {
      m.handler(e.detail.model, e);
      const picked = models.find((x) => x.id === e.detail.model);
      if (picked) onModelChange?.(picked);
    },
    onTcAttach: () => onAttach?.(),
    onTcSelectProject: () => onSelectProject?.(),
    context: c.value,
    onTcItemsChange: (e: CustomEvent<{ items: ContextTrayItem[]; change: ContextTrayChange }>) => {
      lastChange.current = e.detail.change;
      c.handler(e.detail.items, e);
    },
    onTcPick: (e: CustomEvent<MentionPickerPick>) => onMentionPick?.(e.detail, e),
  }));
}
