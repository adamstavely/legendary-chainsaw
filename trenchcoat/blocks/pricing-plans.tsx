"use client";

import {
  PricingPlans as Base,
  SeatsIcon,
  VisitorsIcon,
  WorkspacesIcon,
  type PricingBilling,
  type PricingFeature,
  type PricingLimit,
  type PricingPlan,
  type PricingPlansProps as BaseProps,
} from "trenchcoat/react";

/*
 * Pricing Plans – a pricing section with a monthly / yearly switch and three plan cards. Each card shows its limits,
 * a call to action and collapsible details. It is the <tc-pricing-plans> element through `trenchcoat/react` (install
 * `trenchcoat` instead of copying files); every framework gets the same element. Limit icons may be React nodes.
 */

export type Billing = PricingBilling;
export type PlanLimit = PricingLimit;
export type PlanFeature = PricingFeature;
export type Plan = PricingPlan;
export type PricingPlansProps = BaseProps;
export { SeatsIcon, VisitorsIcon, WorkspacesIcon };

export function PricingPlans(props: PricingPlansProps) {
  return <Base {...props} />;
}
