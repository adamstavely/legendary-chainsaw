import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcAiSidePane,
  type SidePaneCollapsedChange,
  type SidePaneConversationChange,
  type SidePaneConversationsChange,
  type SidePaneFeedback,
  type SidePaneMessage as ElementMessage,
  type SidePaneMessageRef,
  type SidePaneModelChange,
  type SidePaneOpenChange,
  type SidePanePageContextChange,
  type SidePaneReflect,
  type SidePaneSettingsChange,
  type SidePaneVerify,
  type SidePaneWidthChange,
} from "../ai-side-pane";
import type { AnswerSource as ElementSource } from "../ai-answer";
import type { AnswerClaim, ClaimSource } from "../claim-answer";
import type { ChatModel as ElementModel, ChatPageContext, ChatPromptPick } from "../chat-composer";
import type { ChatConversation } from "../chat-history";
import type { FeedbackKind } from "../message-actions";
import type { ModelSettingsModel, ModelSettingsValue } from "../model-settings";
import type { PromptTemplate } from "../prompt-library";
import type { PromptStarter as ElementStarter, PromptStarterIconName } from "../prompt-starters";
import type { ReflectionGateSubmission } from "../reflection-gate";
import type { AnswerSource } from "./ai-answer";
import { defaultModels, type ChatModel } from "./chat-composer";
import { h, isNode, useControlled, useStaged } from "./internal";
import type { PromptStarter } from "./prompt-starters";

export { describeShortcut, matchesShortcut, parseShortcut } from "../ai-side-pane";
export type { PaneShortcut } from "../ai-side-pane";

/** A message: its sources' icons may be React nodes (or elements) */
export type SidePaneMessage = Omit<ElementMessage, "sources"> & { sources?: (Omit<AnswerSource, "icon"> & { icon?: React.ReactNode | Element })[] };

const RawAiSidePane = createComponent({
  tagName: "tc-ai-side-pane",
  elementClass: TcAiSidePane,
  react: React,
  events: {
    onTcStop: "tc-stop" as EventName<CustomEvent<SidePaneMessageRef>>,
    onTcFeedback: "tc-feedback" as EventName<CustomEvent<SidePaneFeedback>>,
    onTcVerify: "tc-verify" as EventName<CustomEvent<SidePaneVerify>>,
    onTcReflect: "tc-reflect" as EventName<CustomEvent<SidePaneReflect>>,
    onTcNewChat: "tc-new-chat" as EventName<CustomEvent<null>>,
    onTcConversationChange: "tc-conversation-change" as EventName<CustomEvent<SidePaneConversationChange>>,
    onTcConversationsChange: "tc-conversations-change" as EventName<CustomEvent<SidePaneConversationsChange>>,
    onTcModelChange: "tc-model-change" as EventName<CustomEvent<SidePaneModelChange>>,
    onTcSettingsChange: "tc-settings-change" as EventName<CustomEvent<SidePaneSettingsChange>>,
    onTcPageContextChange: "tc-page-context-change" as EventName<CustomEvent<SidePanePageContextChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<SidePaneOpenChange>>,
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<SidePaneCollapsedChange>>,
    onTcWidthChange: "tc-width-change" as EventName<CustomEvent<SidePaneWidthChange>>,
    onTcPromptPick: "tc-prompt-pick" as EventName<CustomEvent<ChatPromptPick>>,
    onTcAttach: "tc-attach" as EventName<CustomEvent<null>>,
    onTcSelectProject: "tc-select-project" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAiSidePane>;
type Own =
  | "heading"
  | "title"
  | "messages"
  | "starters"
  | "conversations"
  | "conversation"
  | "pageContext"
  | "models"
  | "model"
  | "settings"
  | "open"
  | "collapsed"
  | "width"
  | "defaultWidth"
  | "shortcut"
  | "selectProject"
  | "onSend"
  | "onRegenerate"
  | `onTc${string}`;

export type AiSidePaneProps = Omit<RawProps, Own> & {
  /** The host page – the pane docks beside it */
  children?: React.ReactNode;
  /** The pane's title, its landmark's and dialog's name */
  title?: string;
  /** The conversation, oldest first. The app owns it */
  messages?: SidePaneMessage[];
  /** Send a message: append it (and the answer) to `messages`. Return a promise to keep the text in the composer
   *  until it settles. `pageContext` is set only while the page is connected – send it with the message */
  onSend?: (text: string, details: { model: string; pageContext?: ChatPageContext }) => void | Promise<unknown>;
  /** Stop was pressed while an answer was streaming */
  onStop?: (messageId: string) => void;
  /** Regenerate, or Try again after an error */
  onRegenerate?: (messageId: string) => void | Promise<unknown>;
  /** A thumb up or down on an answer (null: cleared) */
  onFeedback?: (messageId: string, value: FeedbackKind | null, reason?: string) => void;
  /** A claim was sent to verification */
  onVerify?: (messageId: string, claim: AnswerClaim, sources: ClaimSource[]) => void;
  /** The reflection gate on a high-stakes answer was submitted (return false to keep it open) or, with
   *  `reflectionSkippable`, skipped (null) */
  onReflect?: (messageId: string, submission: ReflectionGateSubmission | null) => boolean | void;
  /** Suggestions before the first message – icons may be built-in names or React nodes */
  starters?: PromptStarter[];
  /** New chat was pressed – start an empty conversation */
  onNewChat?: () => void;
  /** Past conversations for the History panel – leave undefined to hide History */
  conversations?: ChatConversation[];
  /** Called with the whole list after a rename, pin, move or delete in History */
  onConversationsChange?: (conversations: ChatConversation[]) => void;
  /** The open conversation's id */
  conversation?: string | null;
  /** A conversation was picked in History – load its messages */
  onConversationChange?: (id: string | null) => void;
  /** The models in the toolbar's menu – `Logo` is a React component */
  models?: ChatModel[];
  /** The picked model (controlled) */
  model?: string;
  /** The model picked at first (uncontrolled) */
  defaultModel?: string;
  /** Called with the model picked in the toolbar */
  onModelChange?: (model: ChatModel) => void;
  /** The model settings (controlled) */
  settings?: ModelSettingsValue;
  /** The model settings at first (uncontrolled) */
  defaultSettings?: ModelSettingsValue;
  /** The model settings changed, with the names of the settings that did */
  onSettingsChange?: (settings: ModelSettingsValue, changed: string[]) => void;
  /** Which settings the model supports */
  settingsModel?: ModelSettingsModel;
  /** Templates for the prompt library */
  prompts?: PromptTemplate[];
  /** A prompt was picked in the library */
  onPromptPick?: (pick: ChatPromptPick, event: Event) => void;
  /** The plus button was pressed – open your own file picker */
  onAttach?: () => void;
  /** Shows "Select a project" and is called when it's pressed */
  onSelectProject?: () => void;
  /** What's on the page (controlled) – shown as the composer's page-context chip. Leave undefined to let the pane keep
   *  it, starting at `defaultPageContext` – or leave both unset for no chip */
  pageContext?: ChatPageContext;
  /** The page-context chip at first (uncontrolled) */
  defaultPageContext?: ChatPageContext;
  /** The chip was toggled, or an attached item removed */
  onPageContextChange?: (pageContext: ChatPageContext, change: "connect" | "disconnect" | "items") => void;
  /** Open (controlled) – leave undefined to start at `defaultOpen` */
  open?: boolean;
  /** Open at first (uncontrolled) */
  defaultOpen?: boolean;
  /** The pane opened or closed */
  onOpenChange?: (open: boolean) => void;
  /** Collapsed to the rail (controlled) – leave undefined to start at `defaultCollapsed` */
  collapsed?: boolean;
  /** Collapsed to the rail at first (uncontrolled) */
  defaultCollapsed?: boolean;
  /** The pane collapsed to the rail or expanded */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** The docked width in px (controlled) – pass it with `onWidthChange` to remember it */
  width?: number;
  /** The width to start at, and the one Enter or a double-click on the edge goes back to */
  defaultWidth?: number;
  /** Reported once a drag ends, and on every arrow-key step */
  onWidthChange?: (width: number) => void;
  /** Opens the pane – "mod+.", "mod+shift+k", "alt+a"; null turns it off */
  shortcut?: string | null;
};

const NO_MESSAGES: SidePaneMessage[] = [];
const NO_STARTERS: PromptStarter[] = [];

/** The element model for each React model: built-in ones as they are, others with their Logo rendered */
function useModels(models: ChatModel[] | undefined) {
  const custom = (models ?? []).filter((m) => m.Logo && !defaultModels.includes(m));
  const { stage, els } = useStaged(custom.map((m) => [m.id, h(m.Logo!)] as [string, React.ReactNode]));
  const list = React.useMemo(
    () =>
      models?.map(
        (m): ElementModel => ({
          id: m.id,
          name: m.name,
          description: m.description,
          logo: m.Logo && !defaultModels.includes(m) ? els[m.id] : undefined,
          speed: m.speed,
          quality: m.quality,
          cost: m.cost,
          latencyMs: m.latencyMs,
          pricePerM: m.pricePerM,
        }),
      ),
    [models, els],
  );
  // The built-in models keep their own logos: hand the element its defaults for them
  return { stage, list: models && models.every((m) => defaultModels.includes(m)) ? undefined : list };
}

export function AiSidePane({
  title = "Assistant",
  messages = NO_MESSAGES,
  onSend,
  onStop,
  onRegenerate,
  onFeedback,
  onVerify,
  onReflect,
  starters = NO_STARTERS,
  onNewChat,
  conversations,
  onConversationsChange,
  conversation,
  onConversationChange,
  models,
  model,
  defaultModel,
  onModelChange,
  settings,
  defaultSettings,
  onSettingsChange,
  onPromptPick,
  onAttach,
  onSelectProject,
  pageContext,
  defaultPageContext,
  onPageContextChange,
  open,
  defaultOpen = true,
  onOpenChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  width,
  defaultWidth = 400,
  onWidthChange,
  shortcut = "mod+.",
  ...props
}: AiSidePaneProps) {
  const o = useControlled(open, defaultOpen, onOpenChange);
  const c = useControlled(collapsed, defaultCollapsed, onCollapsedChange);
  const w = useControlled(width, defaultWidth, onWidthChange);
  const lastPage = React.useRef<"connect" | "disconnect" | "items">("connect");
  const p = useControlled<ChatPageContext | undefined>(pageContext, defaultPageContext, (next) => next && onPageContextChange?.(next, lastPage.current));
  const lastChanged = React.useRef<string[]>([]);
  const s = useControlled<ModelSettingsValue | undefined>(settings, defaultSettings, (next) => next && onSettingsChange?.(next, lastChanged.current));
  const m = useControlled(model, defaultModel ?? "", undefined);
  const { stage: modelStage, list: modelList } = useModels(models);

  // React icons of sources and starters render in a staging box; the element gets their DOM nodes
  const nodes: [string, React.ReactNode][] = [];
  for (const msg of messages) msg.sources?.forEach((src, i) => isNode(src.icon) && nodes.push([`s:${msg.id}:${i}`, src.icon as React.ReactNode]));
  for (const st of starters) if (isNode(st.icon)) nodes.push([`p:${st.id}`, st.icon]);
  const { stage, els } = useStaged(nodes);
  const data = React.useMemo(
    () => messages.map((msg) => (msg.sources ? { ...msg, sources: msg.sources.map((src, i) => (isNode(src.icon) ? { ...src, icon: els[`s:${msg.id}:${i}`] } : src)) as ElementSource[] } : msg)) as ElementMessage[],
    [messages, els],
  );
  const starterData = React.useMemo(
    () => starters.map((st) => ({ ...st, icon: isNode(st.icon) ? els[`p:${st.id}`] : (st.icon as PromptStarterIconName | undefined) })) as ElementStarter[],
    [starters, els],
  );
  const listCtrl = conversations !== undefined;
  const pickCtrl = conversation !== undefined;

  return h(
    React.Fragment,
    null,
    modelStage,
    stage,
    h(RawAiSidePane, {
      ...props,
      heading: title,
      messages: data,
      starters: starterData,
      conversations,
      conversation: conversation ?? null,
      models: modelList,
      model: m.value,
      settings: s.value,
      pageContext: p.value,
      open: o.value,
      collapsed: c.value,
      width: w.value,
      defaultWidth,
      shortcut: shortcut ?? "",
      selectProject: !!onSelectProject,
      onSend,
      onRegenerate,
      onTcStop: (e: CustomEvent<SidePaneMessageRef>) => onStop?.(e.detail.id),
      onTcFeedback: (e: CustomEvent<SidePaneFeedback>) => onFeedback?.(e.detail.id, e.detail.value, e.detail.reason),
      onTcVerify: (e: CustomEvent<SidePaneVerify>) => onVerify?.(e.detail.id, e.detail.claim, e.detail.sources),
      onTcReflect: (e: CustomEvent<SidePaneReflect>) => {
        if (onReflect?.(e.detail.id, e.detail.submission) === false) e.preventDefault();
      },
      onTcNewChat: () => onNewChat?.(),
      onTcConversationChange: (e: CustomEvent<SidePaneConversationChange>) => {
        if (pickCtrl) e.preventDefault();
        onConversationChange?.(e.detail.conversation);
      },
      onTcConversationsChange: (e: CustomEvent<SidePaneConversationsChange>) => {
        if (listCtrl) e.preventDefault();
        onConversationsChange?.(e.detail.conversations);
      },
      onTcModelChange: (e: CustomEvent<SidePaneModelChange>) => {
        m.handler(e.detail.model, e);
        const picked = (models ?? defaultModels).find((x) => x.id === e.detail.model);
        if (picked) onModelChange?.(picked);
      },
      onTcSettingsChange: (e: CustomEvent<SidePaneSettingsChange>) => {
        lastChanged.current = e.detail.changed;
        s.handler(e.detail.settings, e);
      },
      onTcPageContextChange: (e: CustomEvent<SidePanePageContextChange>) => {
        lastPage.current = e.detail.change;
        p.handler(e.detail.pageContext, e);
      },
      onTcOpenChange: (e: CustomEvent<SidePaneOpenChange>) => o.handler(e.detail.open, e),
      onTcCollapsedChange: (e: CustomEvent<SidePaneCollapsedChange>) => c.handler(e.detail.collapsed, e),
      onTcWidthChange: (e: CustomEvent<SidePaneWidthChange>) => w.handler(e.detail.width, e),
      onTcPromptPick: (e: CustomEvent<ChatPromptPick>) => onPromptPick?.(e.detail, e),
      onTcAttach: () => onAttach?.(),
      onTcSelectProject: () => onSelectProject?.(),
    }),
  );
}

