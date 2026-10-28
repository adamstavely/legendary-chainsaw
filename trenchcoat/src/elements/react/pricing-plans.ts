import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPricingPlans, type PricingBilling, type PricingBillingChange, type PricingDetailsChange, type PricingIconName, type PricingLimit as ElementLimit, type PricingPlan as ElementPlan, type PricingPlanSelect } from "../pricing-plans";
import { h, isNode, useControlled, useStaged } from "./internal";

export { pricingDefaultPlans } from "../pricing-plans";
export type { PricingBilling, PricingFeature, PricingIconName } from "../pricing-plans";

const RawPricingPlans = createComponent({
  tagName: "tc-pricing-plans",
  elementClass: TcPricingPlans,
  react: React,
  events: {
    onTcBillingChange: "tc-billing-change" as EventName<CustomEvent<PricingBillingChange>>,
    onTcDetailsChange: "tc-details-change" as EventName<CustomEvent<PricingDetailsChange>>,
    onTcPlanSelect: "tc-plan-select" as EventName<CustomEvent<PricingPlanSelect>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPricingPlans>;

/** A limit row; its icon may be a built-in's name, an element or a React node */
export type PricingLimit = Omit<ElementLimit, "icon"> & { icon?: PricingIconName | Element | React.ReactNode };
/** A plan; `onSelect` is called with the period when its call to action is pressed */
export type PricingPlan = Omit<ElementPlan, "limits"> & { limits: PricingLimit[]; onSelect?: (billing: PricingBilling) => void };

export type PricingPlansOwnProps = {
  /** The heading – "Choose your plan" by default */
  title?: string;
  /** The plans; unset shows three example plans */
  plans?: PricingPlan[];
  /** The billing period (controlled) – pass `onBillingChange` with it. Leave undefined to start at `defaultBilling` */
  billing?: PricingBilling;
  /** The period shown first when uncontrolled – "yearly" by default */
  defaultBilling?: PricingBilling;
  /** The period was switched */
  onBillingChange?: (billing: PricingBilling) => void;
  /** Whether the details are open (controlled) */
  details?: boolean;
  /** Whether the details start open when uncontrolled – true by default */
  defaultDetails?: boolean;
  /** Show / Hide details was pressed */
  onDetailsChange?: (details: boolean) => void;
  /** A plan's call to action was pressed (after the plan's own `onSelect`) */
  onPlanSelect?: (plan: PricingPlan, billing: PricingBilling) => void;
};
export type PricingPlansProps = Omit<RawProps, keyof PricingPlansOwnProps | "heading" | "onTcBillingChange" | "onTcDetailsChange" | "onTcPlanSelect" | "children"> & PricingPlansOwnProps;

/* The built-in limit icons, as React components – passed in `icon`, they become the element's own icons */
const Svg = ({ children }: { children: React.ReactNode }) =>
  h("svg", { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, children);
export const VisitorsIcon = () => h(Svg, null, h("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }), h("circle", { cx: "12", cy: "12", r: "3" }));
export const SeatsIcon = () => h(Svg, null, h("circle", { cx: "9", cy: "8", r: "3.5" }), h("path", { d: "M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.9 2.6 2.6 3 5.2" }));
export const WorkspacesIcon = () => h(Svg, null, h("path", { d: "M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z" }));
const NAMED = new Map<unknown, PricingIconName>([
  [VisitorsIcon, "visitors"],
  [SeatsIcon, "seats"],
  [WorkspacesIcon, "workspaces"],
]);
/** A built-in icon's name for one of the components above, else undefined */
const named = (icon: unknown) => (React.isValidElement(icon) ? NAMED.get(icon.type) : undefined);
const staged = (icon: unknown) => isNode(icon) && !named(icon);

export function PricingPlans({ title, plans, billing, defaultBilling = "yearly", onBillingChange, details, defaultDetails = true, onDetailsChange, onPlanSelect, ...props }: PricingPlansProps) {
  const b = useControlled(billing, defaultBilling, onBillingChange);
  const d = useControlled(details, defaultDetails, onDetailsChange);
  const nodes: [string, React.ReactNode][] = [];
  plans?.forEach((plan) => plan.limits?.forEach((limit, i) => staged(limit.icon) && nodes.push([`${plan.id}:${i}`, limit.icon as React.ReactNode])));
  const { stage, els } = useStaged(nodes);
  const elementPlans = React.useMemo(
    () =>
      plans?.map(({ onSelect: _onSelect, ...plan }) => ({
        ...plan,
        limits: plan.limits?.map((limit, i) => ({
          ...limit,
          icon: named(limit.icon) ?? (staged(limit.icon) ? els[`${plan.id}:${i}`] : (limit.icon as ElementLimit["icon"])),
        })),
      })) as ElementPlan[] | undefined,
    [plans, els],
  );
  return h(
    React.Fragment,
    null,
    stage,
    h(RawPricingPlans, {
      ...props,
      heading: title ?? "Choose your plan",
      plans: elementPlans,
      billing: b.value,
      details: d.value,
      onTcBillingChange: (e: CustomEvent<PricingBillingChange>) => b.handler(e.detail.billing, e),
      onTcDetailsChange: (e: CustomEvent<PricingDetailsChange>) => d.handler(e.detail.details, e),
      onTcPlanSelect: (e: CustomEvent<PricingPlanSelect>) => {
        const plan = plans?.find((p) => p.id === e.detail.plan.id);
        plan?.onSelect?.(e.detail.billing);
        onPlanSelect?.(plan ?? (e.detail.plan as PricingPlan), e.detail.billing);
      },
    }),
  );
}
