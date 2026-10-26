import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAnswerArena, type ArenaAnswer as ArenaAnswerData, type ArenaVote } from "../answer-arena";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ArenaVote, ArenaWinner } from "../answer-arena";
/** One side of the arena: the glyph may be a React node */
export type ArenaAnswer = Omit<ArenaAnswerData, "icon"> & { icon?: React.ReactNode };

const RawAnswerArena = createComponent({
  tagName: "tc-answer-arena",
  elementClass: TcAnswerArena,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<{ value: ArenaVote | null }>>,
  },
});
type RawAnswerArenaProps = React.ComponentProps<typeof RawAnswerArena>;
type Own = "answers" | "value" | "defaultValue" | "onChange" | "onTcValueChange";
export type AnswerArenaProps = Omit<RawAnswerArenaProps, Own> & {
  /** The two answers: A first, then B */
  answers: ArenaAnswer[];
  /** The vote – controlled when defined (null: none yet) */
  value?: ArenaVote | null;
  /** The vote at first when uncontrolled – null by default */
  defaultValue?: ArenaVote | null;
  /** Every change of the vote: a side or a tie, then a reason */
  onChange?: (vote: ArenaVote | null) => void;
};

/** Answer Arena – two models' answers side by side, streamed together, then A is better, B is better or a tie, with a reason */
export function AnswerArena({ answers, value, defaultValue = null, onChange, ...props }: AnswerArenaProps) {
  const { stage, els } = useStaged(answers.map((a, i) => [String(i), a.icon] as [string, React.ReactNode]).filter(([, icon]) => isNode(icon)));
  const list = React.useMemo(() => answers.map((a, i) => (isNode(a.icon) ? { ...a, icon: els[String(i)] } : a)) as ArenaAnswerData[], [answers, els]);
  const v = useControlled(value, defaultValue, onChange);
  return h(React.Fragment, null, stage, h(RawAnswerArena, {
    ...props,
    answers: list,
    value: v.value,
    onTcValueChange: (e: CustomEvent<{ value: ArenaVote | null }>) => v.handler(e.detail.value, e),
  }));
}
