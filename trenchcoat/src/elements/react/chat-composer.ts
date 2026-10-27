import { createComponent, type EventName } from "@lit/react";
import { render as litRender } from "lit";
import * as React from "react";
import { flushSync } from "react-dom";
import {
  TcChatComposer,
  chatModelLogo,
  defaultChatModels,
  type ChatModel as ElementModel,
  type ChatPageContext,
  type ChatPageContextChange,
  type ChatPromptPick,
  type ChatSendDetails,
  type ChatSettingsChange,
  type ChatSkill as ElementSkill,
  type ChatSkillChange as ElementSkillChange,
} from "../chat-composer";
import type { ContextTrayChange, ContextTrayItem } from "../context-tray";
import type { MentionPickerPick } from "../mention-picker";
import type { ModelSettingsValue } from "../model-settings";
import { h, isNode, useControlled, useStaged } from "./internal";
export type { ChatPageContext, ChatPageContextChange, ChatPromptPick, ChatSend, ChatSendDetails, ChatSettingsChange, ChatSkillRef } from "../chat-composer";

/** A skill (slash command) in the composer; `icon` may be a React node */
export type ChatSkill = Omit<ElementSkill, "icon"> & { icon?: React.ReactNode | Element };
/** Why the skill changed – `pick`, `replace` and `remove` can be prevented through the event */
export type ChatSkillChangeReason = ElementSkillChange["reason"];
/** Finds skills on the app's side; the signal aborts when the query changes or the list closes */
export type ChatSkillSearch = (query: string, options: { signal: AbortSignal }) => ChatSkill[] | Promise<ChatSkill[]>;

/** A model in the picker; `Logo` is a React component, as before */
export type ChatModel = {
  id: string;
  name: string;
  description: string;
  Logo?: React.ComponentType;
  /** In the toolbar's model menu: strengths from 1 to 5 (cost 5 is the most expensive) */
  speed?: number;
  quality?: number;
  cost?: number;
  /** In the toolbar's model menu: typical time to the first token, in milliseconds */
  latencyMs?: number;
  /** In the toolbar's model menu: price per million output tokens, in dollars */
  pricePerM?: number;
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
    onTcSettingsChange: "tc-settings-change" as EventName<CustomEvent<ChatSettingsChange>>,
    onTcPromptPick: "tc-prompt-pick" as EventName<CustomEvent<ChatPromptPick>>,
    onTcPageContextChange: "tc-page-context-change" as EventName<CustomEvent<ChatPageContextChange>>,
    onTcSkillChange: "tc-skill-change" as EventName<CustomEvent<ElementSkillChange>>,
  },
});
type RawChatComposerProps = React.ComponentProps<typeof RawChatComposer>;
type Own =
  | "value"
  | "models"
  | "model"
  | "context"
  | "settings"
  | "pageContext"
  | "skills"
  | "searchSkills"
  | "skill"
  | "onSend"
  | "onTcSkillChange"
  | "onTcValueChange"
  | "onTcModelChange"
  | "onTcAttach"
  | "onTcSelectProject"
  | "onTcItemsChange"
  | "onTcPick"
  | "onTcSettingsChange"
  | "onTcPromptPick"
  | "onTcPageContextChange";
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
  /** "Select a project" was pressed – open your own project picker here */
  onSelectProject?: () => void;
  /** Opt-in: what's in context, as chips above the composer (controlled). Leave undefined to let it keep the list,
   *  starting at `defaultContext` – or leave both unset for no tray */
  context?: ContextTrayItem[];
  /** The context chips to start with when uncontrolled */
  defaultContext?: ContextTrayItem[];
  /** Every change to the context chips: removed, restored, pinned */
  onContextChange?: (items: ContextTrayItem[], change: ContextTrayChange) => void;
  /** A row picked in the / and @ picker (set `mentions` to turn it on); call event.preventDefault() to keep the text */
  onMentionPick?: (pick: MentionPickerPick, event: Event) => void;
  /** Opt-in: the model settings, edited in a popover from the toolbar (controlled). Leave undefined to let the composer
   *  keep them, starting at `defaultSettings` – or leave both unset for no settings button */
  settings?: ModelSettingsValue;
  /** The model settings to start with when uncontrolled */
  defaultSettings?: ModelSettingsValue;
  /** Every change in the settings popover: the next settings and the parameter ids that changed */
  onSettingsChange?: (settings: ModelSettingsValue, changed: string[]) => void;
  /** A prompt used in the prompt library (set `prompts` to turn it on); call event.preventDefault() to place it yourself */
  onPromptPick?: (pick: ChatPromptPick, event: Event) => void;
  /** Opt-in: what's on the page, as a chip that connects or disconnects it (controlled). Leave undefined to let the
   *  composer keep it, starting at `defaultPageContext` – or leave both unset for no chip */
  pageContext?: ChatPageContext;
  /** The page context to start with when uncontrolled */
  defaultPageContext?: ChatPageContext;
  /** The chip was toggled or an attached item removed: the next page context and what changed */
  onPageContextChange?: (pageContext: ChatPageContext, change: ChatPageContextChange["change"]) => void;
  /**
   * Sends the message – `details` has the model, and the skill and its arguments when the message starts with one.
   * Return a promise to keep the message until it settles
   */
  onSend?: (message: string, details: ChatSendDetails) => void | Promise<unknown>;
  /** Opt-in: the skills (slash commands) a message can start with – / at the start of a line opens them */
  skills?: ChatSkill[];
  /** Finds skills on the app's side in place of the built-in filter over `skills` */
  searchSkills?: ChatSkillSearch;
  /** Id of the message's skill (controlled; "" for none). Leave undefined to let the composer keep it */
  skill?: string;
  /** Id of the skill to start with when uncontrolled */
  defaultSkill?: string;
  /** The message's skill changed: the skill now (null: none) and why – picked, replaced, removed, edited away or sent */
  onSkillChange?: (skill: ChatSkill | null, reason: ChatSkillChangeReason) => void;
};

export function ChatComposer({
  value,
  defaultValue = "",
  onValueChange,
  models = defaultModels,
  model,
  defaultModel,
  onModelChange,
  onAttach,
  onSelectProject,
  context,
  defaultContext,
  onContextChange,
  onMentionPick,
  settings,
  defaultSettings,
  onSettingsChange,
  onPromptPick,
  pageContext,
  defaultPageContext,
  onPageContextChange,
  onSend,
  skills,
  searchSkills,
  skill,
  defaultSkill = "",
  onSkillChange,
  ...props
}: ChatComposerProps) {
  // Logos given as React components render in the staging box; the element gets their DOM nodes
  const { stage, els } = useStaged(models.filter((m) => !builtIn.has(m) && m.Logo).map((m) => [m.id, h(m.Logo!)]));
  const list = React.useMemo(() => models.map((m) => builtIn.get(m) ?? { id: m.id, name: m.name, description: m.description, logo: m.Logo ? els[m.id] : undefined, speed: m.speed, quality: m.quality, cost: m.cost, latencyMs: m.latencyMs, pricePerM: m.pricePerM }), [models, els]);
  const v = useControlled(value, defaultValue, onValueChange);
  const m = useControlled<string>(model, defaultModel ?? models[0]?.id ?? "", undefined);
  const lastChange = React.useRef<ContextTrayChange | null>(null);
  const c = useControlled<ContextTrayItem[] | undefined>(context, defaultContext, (items) => items && lastChange.current && onContextChange?.(items, lastChange.current));
  const lastChanged = React.useRef<string[]>([]);
  const s = useControlled<ModelSettingsValue | undefined>(settings, defaultSettings, (next) => next && onSettingsChange?.(next, lastChanged.current));
  const lastPage = React.useRef<ChatPageContextChange["change"]>("connect");
  const p = useControlled<ChatPageContext | undefined>(pageContext, defaultPageContext, (next) => next && onPageContextChange?.(next, lastPage.current));
  // Skills: icons given as React nodes render in a second staging box; the element gets the skills with their DOM nodes
  const skillNodes: [string, React.ReactNode][] = (skills ?? []).filter((s) => isNode(s.icon)).map((s) => [s.id, s.icon as React.ReactNode]);
  const icons = useStaged(skillNodes);
  const bySkill = React.useRef(new WeakMap<ChatSkill, ElementSkill>());
  const toElement = React.useCallback(
    (s: ChatSkill): ElementSkill => {
      const icon = isNode(s.icon) ? icons.els[s.id] : (s.icon as Element | undefined);
      const made = bySkill.current.get(s);
      if (made && made.icon === icon) return made;
      const next = { ...s, icon };
      bySkill.current.set(s, next);
      return next;
    },
    [icons.els],
  );
  const skillList = React.useMemo(() => skills?.map(toElement), [skills, toElement]);
  const fromElement = React.useCallback((s: ElementSkill | null) => (s ? (skills?.find((x) => x.id === s.id) ?? (s as ChatSkill)) : null), [skills]);
  const search = React.useMemo(() => (searchSkills ? (query: string, options: { signal: AbortSignal }) => {
    const found = searchSkills(query, options);
    return found instanceof Promise ? found.then((list) => list.map(toElement)) : found.map(toElement);
  } : undefined), [searchSkills, toElement]);
  const lastReason = React.useRef<ChatSkillChangeReason>("pick");
  const lastSkill = React.useRef<ChatSkill | null>(null);
  const sk = useControlled<string>(skill, defaultSkill, () => onSkillChange?.(lastSkill.current, lastReason.current));
  return h(React.Fragment, null, stage, icons.stage, h(RawChatComposer, {
    ...props,
    onSend,
    skills: skillList,
    searchSkills: search,
    skill: sk.value,
    onTcSkillChange: (e: CustomEvent<ElementSkillChange>) => {
      lastReason.current = e.detail.reason;
      lastSkill.current = fromElement(e.detail.skill);
      sk.handler(e.detail.skill?.id ?? "", e);
    },
    value: v.value,
    models: list,
    model: m.value,
    // React gives a custom event's state updates default priority, so a controlling parent's next `value` would come
    // after the element had already put the old one back. Like a native input's change, it's applied before the event
    // returns
    onTcValueChange: (e: CustomEvent<{ value: string }>) => flushSync(() => v.handler(e.detail.value, e)),
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
    settings: s.value,
    onTcSettingsChange: (e: CustomEvent<ChatSettingsChange>) => {
      lastChanged.current = e.detail.changed;
      s.handler(e.detail.value, e);
    },
    onTcPromptPick: (e: CustomEvent<ChatPromptPick>) => onPromptPick?.(e.detail, e),
    pageContext: p.value,
    onTcPageContextChange: (e: CustomEvent<ChatPageContextChange>) => {
      lastPage.current = e.detail.change;
      p.handler(e.detail.pageContext, e);
    },
  }));
}
