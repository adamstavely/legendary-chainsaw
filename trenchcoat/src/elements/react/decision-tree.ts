import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDecisionTree, type DecisionTreeChange, type DecisionRisk, type DecisionText, type TreeDecision, type TreeDecisionChoice, type TreeDecisionOption } from "../decision-tree";
import { h, useStaged } from "./internal";

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the element's own change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const own = React.useRef(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else own.current = next;
    onChange?.(next);
  };
  return { value: controlled ? value : own.current, handler, controlled };
}

export type { DecisionFlag, DecisionRisk, DecisionText } from "../decision-tree";

/** An option, its logos React nodes */
export type DecisionOption = {
  /** What to do, in a few words – e.g. "Roll back to #481" */
  label: string;
  /** The tool it runs with – a small logo before the label, e.g. the Vercel mark */
  icon?: React.ReactNode;
  /** What it leads to, one line each – e.g. "Refunds $147 · not reversible" */
  effects?: DecisionText[];
  /** The systems it touches – small logos beside its consequences */
  apps?: React.ReactNode[];
  /** The agent's own preference – marked "Agent's pick" */
  pick?: boolean;
  /** A follow-up question this branch leads to – picked right after it. One level deep: its options end the path */
  next?: DecisionStep;
};
/** A follow-up question with two to four options */
export type DecisionStep = { question: string; options: DecisionOption[] };
export type Decision = {
  id: string;
  /** The question, in one sentence */
  question: string;
  /** A line of context under it */
  context?: string;
  /** Who asks, e.g. "Billing agent" */
  agent: string;
  /** The model behind the agent – shown under its name */
  model?: string;
  /** A small mark, e.g. the model maker's logo – defaults to the agent's initial */
  icon?: React.ReactNode;
  /** High and medium show as a small tag next to the agent */
  risk?: DecisionRisk;
  /** Two to four options */
  options: DecisionOption[];
};
/** What you chose: one of the options, or your own instruction */
export type DecisionChoice = { index: number; option: DecisionOption; then?: { index: number; option: DecisionOption } } | { other: string };
/** Drive it from outside – e.g. your own shortcuts, or a demo */
export type DecisionTreeHandle = Pick<TcDecisionTree, "hover" | "choose" | "setOther" | "send" | "next" | "previous" | "peek">;

const RawDecisionTree = createComponent({
  tagName: "tc-decision-tree",
  elementClass: TcDecisionTree,
  react: React,
  events: { onTcDecisionChange: "tc-decision-change" as EventName<CustomEvent<DecisionTreeChange>> },
});
type RawDecisionTreeProps = React.ComponentProps<typeof RawDecisionTree>;
export type DecisionTreeProps = Omit<RawDecisionTreeProps, "ref" | "decisions" | "decision" | "onChoose" | "heading" | "onTcDecisionChange"> & {
  /** Everything waiting for a call – decided ones leave on their own, new ids join at the end */
  decisions: Decision[];
  /** The id of the decision on show. Controlled when defined – pair it with `onDecisionChange` */
  decision?: string;
  /** The decision shown first when `decision` isn't controlled – defaults to the first one */
  defaultDecision?: string;
  /** Called with the id of the decision on show whenever it changes (paging, or the shown one was decided) */
  onDecisionChange?: (id: string) => void;
  /**
   * A branch was picked or an instruction written – return the agent's short answer to an instruction (or a promise
   * of it). A promise holds the picked path until it settles; a rejection lets go of the pick and says so, to try again
   */
  onChoose?: (decision: Decision, choice: DecisionChoice) => string | void | Promise<string | void>;
  title?: string;
  /** The imperative handle (the root element isn't exposed) */
  ref?: React.Ref<DecisionTreeHandle>;
};

const has = (v: React.ReactNode) => v !== undefined && v !== null && v !== false && !(v instanceof Element);
/** Text and numbers get an element to stand in, so the element has something to clone */
const node = (v: React.ReactNode) => (typeof v === "string" || typeof v === "number" ? h("span", null, v) : v);

export function DecisionTree({ decisions, decision, defaultDecision, onDecisionChange, onChoose, title = "Decisions", ref, ...props }: DecisionTreeProps) {
  // Icons and logos given as React nodes render in the staging box; the element gets their DOM nodes
  const nodes: [string, React.ReactNode][] = [];
  const stageOption = (o: DecisionOption, key: string) => {
    if (has(o.icon)) nodes.push([`o:${key}`, node(o.icon)]);
    o.apps?.forEach((a, k) => has(a) && nodes.push([`a:${key}:${k}`, node(a)]));
    o.next?.options.forEach((s, j) => stageOption(s, `${key}:${j}`));
  };
  for (const d of decisions) {
    if (has(d.icon)) nodes.push([`d:${d.id}`, node(d.icon)]);
    d.options.forEach((o, i) => stageOption(o, `${d.id}:${i}`));
  }
  const { stage, els } = useStaged(nodes);
  const toElement = React.useMemo(() => {
    const option = (o: DecisionOption, key: string): TreeDecisionOption => ({
      ...o,
      icon: has(o.icon) ? els[`o:${key}`] : (o.icon as Element | undefined),
      apps: o.apps?.map((a, k) => (has(a) ? els[`a:${key}:${k}`] : (a as Element | undefined))).filter((a): a is Element => !!a),
      next: o.next && { ...o.next, options: o.next.options.map((s, j) => option(s, `${key}:${j}`)) },
    });
    return decisions.map((d) => ({ ...d, icon: has(d.icon) ? els[`d:${d.id}`] : (d.icon as Element | undefined), options: d.options.map((o, i) => option(o, `${d.id}:${i}`)) }));
  }, [decisions, els]);
  const c = useOwned(decision, defaultDecision, onDecisionChange as ((id: string | undefined) => void) | undefined);
  const el = React.useRef<TcDecisionTree>(null);
  React.useImperativeHandle(ref, () => ({
    hover: (i) => el.current?.hover(i),
    choose: (i) => el.current?.choose(i),
    setOther: (text) => el.current?.setOther(text),
    send: () => el.current?.send(),
    next: () => el.current?.next(),
    previous: () => el.current?.previous(),
    peek: (i) => el.current?.peek(i),
  }));
  // The element hands back its own copies: the app gets the decision and options it passed in
  const choose = React.useCallback(
    (d: TreeDecision, choice: TreeDecisionChoice) => {
      if (!onChoose) return;
      const mine = decisions.find((x) => x.id === d.id);
      if (!mine) return;
      if ("other" in choice) return onChoose(mine, choice);
      const option = mine.options[choice.index];
      return onChoose(mine, { index: choice.index, option, ...(choice.then ? { then: { index: choice.then.index, option: option.next!.options[choice.then.index] } } : {}) });
    },
    [onChoose, decisions],
  );
  return h(React.Fragment, null, stage, h(RawDecisionTree, {
    ...props,
    ref: el,
    heading: title,
    decisions: toElement,
    decision: c.value,
    onChoose: onChoose ? choose : undefined,
    onTcDecisionChange: (e: CustomEvent<DecisionTreeChange>) => c.handler(e.detail.decision, e),
  }));
}
