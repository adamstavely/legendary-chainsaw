import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRecipeCard, type RecipeServingsChange, type RecipeStepChange, type RecipeTimerDone, type RecipeUnits, type RecipeUnitsChange } from "../recipe-card";
import { h, useControlled } from "./internal";

export type { RecipeIngredient, RecipeLabels, RecipeStep, RecipeTimerDone, RecipeUnit, RecipeUnits } from "../recipe-card";

const RawRecipeCard = createComponent({
  tagName: "tc-recipe-card",
  elementClass: TcRecipeCard,
  react: React,
  events: {
    onTcServingsChange: "tc-servings-change" as EventName<CustomEvent<RecipeServingsChange>>,
    onTcUnitsChange: "tc-units-change" as EventName<CustomEvent<RecipeUnitsChange>>,
    onTcStepChange: "tc-step-change" as EventName<CustomEvent<RecipeStepChange>>,
    onTcTimerDone: "tc-timer-done" as EventName<CustomEvent<RecipeTimerDone>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRecipeCard>;
type Owned = "heading" | "servings" | "units" | "step" | "onTcServingsChange" | "onTcUnitsChange" | "onTcStepChange" | "onTcTimerDone" | "children";
export type RecipeCardProps = Omit<RawProps, Owned> & {
  /** The recipe's name */
  title?: string;
  /** How many to cook for – controlled when given */
  servings?: number;
  /** The servings on mount when `servings` isn't controlled; defaults to `baseServings` */
  defaultServings?: number;
  /** The servings changed */
  onServingsChange?: (servings: number) => void;
  /** Metric or imperial – controlled when given */
  units?: RecipeUnits;
  /** The units on mount when `units` isn't controlled */
  defaultUnits?: RecipeUnits;
  /** The units changed */
  onUnitsChange?: (units: RecipeUnits) => void;
  /** The current step's index – controlled when given */
  step?: number;
  /** The step on mount when `step` isn't controlled */
  defaultStep?: number;
  /** The current step changed */
  onStepChange?: (step: number) => void;
  /** A step's timer reached zero */
  onTimerDone?: (step: number, text: string) => void;
};

export function RecipeCard({ title, servings, defaultServings, onServingsChange, units, defaultUnits = "metric", onUnitsChange, step, defaultStep = 0, onStepChange, onTimerDone, ...props }: RecipeCardProps) {
  const s = useControlled<number | undefined>(servings, defaultServings, onServingsChange as ((n: number | undefined) => void) | undefined);
  const u = useControlled<RecipeUnits>(units, defaultUnits, onUnitsChange);
  const st = useControlled<number>(step, defaultStep, onStepChange);
  return h(RawRecipeCard, {
    ...props,
    heading: title ?? "Recipe",
    servings: s.value,
    units: u.value,
    step: st.value,
    onTcServingsChange: (e: CustomEvent<RecipeServingsChange>) => s.handler(e.detail.servings, e),
    onTcUnitsChange: (e: CustomEvent<RecipeUnitsChange>) => u.handler(e.detail.units, e),
    onTcStepChange: (e: CustomEvent<RecipeStepChange>) => st.handler(e.detail.step, e),
    onTcTimerDone: (e: CustomEvent<RecipeTimerDone>) => onTimerDone?.(e.detail.step, e.detail.text),
  });
}
