import type * as UI from "@blocks/pricing-plans";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.PricingPlans />;
}
