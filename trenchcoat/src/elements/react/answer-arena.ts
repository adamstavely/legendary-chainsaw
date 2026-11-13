import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAnswerArena, type ArenaAnswer as ArenaAnswerData, type ArenaValueChange, type ArenaVote } from "../answer-arena";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ArenaValueChange, ArenaVote, ArenaWinner } from "../answer-arena";
/** One side of the arena: the glyph may be a React node */
export type ArenaAnswer = Omit<ArenaAnswerData, "icon"> & { icon?: React.ReactNode };

const RawAnswerArena = createComponent({
  tagName: "tc-answer-arena",
  elementClass: TcAnswerArena,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ArenaValueChange>>,
  },
});
type RawAnswerArenaProps = React.ComponentProps<typeof RawAnswerArena>;
type Own = "answers" | "value" | "defaultValue" | "onChange" | "onTcValueChange";
export type AnswerArenaProps = Omit<RawAnswerArenaProps, Own> & {
  /** The answers: A first, then B – two for a head-to-head, three or four to pick the best */
  answers: ArenaAnswer[];
  /** The vote – controlled when defined (null: none yet) */
  value?: ArenaVote | null;
  /** The vote at first when uncontrolled – null by default */
  defaultValue?: ArenaVote | null;
  /** Every change of the vote: a side, a tie or all bad, then a reason – with the winning answer's id (or model) */
  onChange?: (vote: ArenaVote | null, winnerId?: string) => void;
};

/** Answer Arena – two to four models' answers side by side, streamed together, then a vote for the better (or best) one, a tie or all bad, with a reason */
export function AnswerArena({ answers, value, defaultValue = null, onChange, ...props }: AnswerArenaProps) {
  const { stage, els } = useStaged(answers.map((a, i) => [String(i), a.icon] as [string, React.ReactNode]).filter(([, icon]) => isNode(icon)));
  const list = React.useMemo(() => answers.map((a, i) => (isNode(a.icon) ? { ...a, icon: els[String(i)] } : a)) as ArenaAnswerData[], [answers, els]);
  const winner = React.useRef<string | undefined>(undefined);
  const v = useControlled(value, defaultValue, onChange ? (next: ArenaVote | null) => onChange(next, winner.current) : undefined);
  return h(React.Fragment, null, stage, h(RawAnswerArena, {
    ...props,
    answers: list,
    value: v.value,
    onTcValueChange: (e: CustomEvent<ArenaValueChange>) => {
      winner.current = e.detail.winnerId;
      v.handler(e.detail.value, e);
    },
  }));
}
