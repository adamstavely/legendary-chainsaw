import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcMultiplayerThread,
  type MultiplayerMode,
  type MultiplayerModeChange,
  type MultiplayerModel as ElementModel,
  type MultiplayerPerson as ElementPerson,
  type MultiplayerSend,
} from "../multiplayer-thread";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { MultiplayerItem, MultiplayerMessage, MultiplayerMode, MultiplayerModeChange, MultiplayerPresence, MultiplayerSend, MultiplayerThreadLabels } from "../multiplayer-thread";
export { MULTIPLAYER_MODEL_ID, defaultMultiplayerThreadLabels, mentionsIn } from "../multiplayer-thread";

/** Avatars may be React nodes or image URLs */
export type MultiplayerPerson = Omit<ElementPerson, "avatar"> & { avatar?: React.ReactNode | string };
export type MultiplayerModel = { name: string; avatar?: React.ReactNode };

const RawMultiplayerThread = createComponent({
  tagName: "tc-multiplayer-thread",
  elementClass: TcMultiplayerThread,
  react: React,
  events: {
    onTcSend: "tc-send" as EventName<CustomEvent<MultiplayerSend>>,
    onTcModeChange: "tc-mode-change" as EventName<CustomEvent<MultiplayerModeChange>>,
  },
});
type RawMultiplayerThreadProps = React.ComponentProps<typeof RawMultiplayerThread>;

export type MultiplayerThreadOwnProps = {
  /** The heading, and the region's name (default "Thread") */
  title?: string;
  /** Everyone who can be in the thread */
  people: MultiplayerPerson[];
  /** The model in the thread */
  model?: MultiplayerModel;
  /** When the model answers. Controlled when defined */
  mode?: MultiplayerMode;
  /** The starting mode when uncontrolled (default "mentions") */
  defaultMode?: MultiplayerMode;
  /** When the model answers changed */
  onModeChange?: (mode: MultiplayerMode) => void;
  /** A message was sent: add it to `items`. Call event.preventDefault() to keep the text in the field */
  onSend?: (text: string, mentions: string[], modelAnswers: boolean, event: Event) => void;
};
export type MultiplayerThreadProps = Omit<RawMultiplayerThreadProps, keyof MultiplayerThreadOwnProps | "heading" | "onTcSend" | "onTcModeChange" | "children"> & MultiplayerThreadOwnProps;

/** One chat thread with several people and one model – presence, typing, grouped messages and @-mentions */
export function MultiplayerThread({ title = "Thread", people, model = { name: "Assistant" }, mode, defaultMode = "mentions", onModeChange, onSend, ...props }: MultiplayerThreadProps) {
  const m = useControlled(mode, defaultMode, onModeChange);
  // Avatar nodes render once in the staging box; the element clones them
  const { stage, els } = useStaged([
    ...(isNode(model.avatar) ? ([["model", model.avatar]] as [string, React.ReactNode][]) : []),
    ...people.filter((p) => isNode(p.avatar)).map((p) => [`p:${p.id}`, p.avatar] as [string, React.ReactNode]),
  ]);
  const toPerson = (p: MultiplayerPerson): ElementPerson => ({ ...p, avatar: isNode(p.avatar) ? els[`p:${p.id}`] : (p.avatar as string | undefined) });
  const elementModel: ElementModel = { name: model.name, avatar: isNode(model.avatar) ? els.model : undefined };
  return h(
    React.Fragment,
    null,
    stage,
    h(RawMultiplayerThread, {
      ...props,
      heading: title,
      people: people.map(toPerson),
      model: elementModel,
      mode: m.value,
      onTcModeChange: (e: CustomEvent<MultiplayerModeChange>) => m.handler(e.detail.mode, e),
      onTcSend: (e: CustomEvent<MultiplayerSend>) => onSend?.(e.detail.text, e.detail.mentions, e.detail.modelAnswers, e),
    }),
  );
}
