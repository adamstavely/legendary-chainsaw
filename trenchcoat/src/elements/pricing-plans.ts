import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import "./button";
import { TcElement } from "./internal/base";
import "./segmented-control";
import type { SegmentOption } from "./segmented-control";

/*
 * <tc-pricing-plans> – a pricing section (the Lit port of blocks/pricing-plans): a heading, a Monthly / Yearly switch
 * (the library's segmented control) and a card per plan with its price, its limits, a call to action and collapsible
 * details – the integrations it syncs and what's included. The price's digits roll when the period changes (not on
 * first render; assistive tech reads the whole price once). The details open and close for every card together, so
 * the rows stay aligned. Three columns on wide containers, one under 860 px.
 * Changing the period fires the cancelable tc-billing-change – prevented, `billing` stays (controlled use); the call
 * to action fires tc-plan-select with the plan and the period.
 *
 *   <tc-pricing-plans .plans=${[{ id: "starter", name: "Starter", price: { monthly: 29, yearly: 24 }, … }]}></tc-pricing-plans>
 */

export type PricingBilling = "monthly" | "yearly";
/** The built-in limit icons */
export type PricingIconName = "visitors" | "seats" | "workspaces";

export type PricingLimit = {
  /** A built-in icon's name, or an icon element (cloned) */
  icon?: PricingIconName | Element;
  label: string;
  value: string;
};
export type PricingFeature = { label: string; included: boolean };

export type PricingPlan = {
  id: string;
  name: string;
  /** Price per month, billed monthly and billed yearly */
  price: { monthly: number; yearly: number };
  limits: PricingLimit[];
  /** How often data syncs, shown as a chip next to the integrations heading */
  sync: string;
  /** Number of integrations people can pick */
  pick: number;
  features: PricingFeature[];
  /** The call to action – "Start free trial" by default */
  cta?: string;
  /** Small pill next to the name, e.g. "Popular" – the card gets a soft accent */
  badge?: string;
};

export type PricingBillingChange = { billing: PricingBilling };
export type PricingDetailsChange = { details: boolean };
export type PricingPlanSelect = { plan: PricingPlan; billing: PricingBilling };

const ICONS: Record<PricingIconName, ReturnType<typeof svg>> = {
  visitors: svg`<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>`,
  seats: svg`<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.9 2.6 2.6 3 5.2"></path>`,
  workspaces: svg`<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z"></path>`,
};

/* Integration tiles: real brand marks (Simple Icons, CC0). Marks that come on their own colour fill the tile, the rest
   sit on white with a thin gray edge. `{ID}` in a mark is replaced with an id unique to the element. */
type App = { name: string; viewBox: string; size: number; mark: string; fill?: string; background?: string };
const simple = (name: string, d: string, fill: string, background?: string): App => ({ name, viewBox: "0 0 24 24", size: 15, mark: `<path d="${d}"></path>`, fill, background });
const APPS: App[] = [
  simple("Google Analytics", "M22.84 2.9982v17.9987c.0086 1.6473-1.3197 2.9897-2.967 2.9984a2.9808 2.9808 0 01-.3677-.0208c-1.528-.226-2.6477-1.5558-2.6105-3.1V3.1204c-.0369-1.5458 1.0856-2.8762 2.6157-3.1 1.6361-.1915 3.1178.9796 3.3093 2.6158.014.1201.0208.241.0202.3619zM4.1326 18.0548c-1.6417 0-2.9726 1.331-2.9726 2.9726C1.16 22.6691 2.4909 24 4.1326 24s2.9726-1.3309 2.9726-2.9726-1.331-2.9726-2.9726-2.9726zm7.8728-9.0098c-.0171 0-.0342 0-.0513.0003-1.6495.0904-2.9293 1.474-2.891 3.1256v7.9846c0 2.167.9535 3.4825 2.3505 3.763 1.6118.3266 3.1832-.7152 3.5098-2.327.04-.1974.06-.3983.0593-.5998v-8.9585c.003-1.6474-1.33-2.9852-2.9773-2.9882z", "#E37400"),
  simple("Stripe", "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z", "#ffffff", "#635BFF"),
  {
    name: "Gmail",
    viewBox: "0 -5.77 56.4108 56.4108",
    size: 16,
    mark: `<path d="M44.2255 5.76727H56.4051V41.0239C56.4051 43.148 54.683 44.8701 52.5589 44.8701H46.1486C45.8961 44.8701 45.646 44.8204 45.4127 44.7237C45.1794 44.6271 44.9674 44.4854 44.7888 44.3069C44.6102 44.1283 44.4686 43.9163 44.3719 43.683C44.2753 43.4497 44.2255 43.1996 44.2255 42.947V5.76727Z" fill="url(#{ID}-0)"></path><path d="M12.1796 5.76727H0V41.0239C0 43.148 1.72213 44.8701 3.84618 44.8701H10.2565C10.509 44.8701 10.7591 44.8204 10.9924 44.7237C11.2257 44.6271 11.4377 44.4854 11.6163 44.3069C11.7949 44.1283 11.9365 43.9163 12.0332 43.683C12.1298 43.4497 12.1796 43.1996 12.1796 42.947V5.76727Z" fill="#FC413D"></path><path d="M10.0085 1.42778C7.43377 -0.736342 3.5924 -0.403647 1.42828 2.17105C-0.735843 4.74543 -0.403148 8.58681 2.17155 10.7512L26.5557 31.2479C27.0178 31.6362 27.602 31.8492 28.2056 31.8492C28.8091 31.8492 29.3934 31.6362 29.8554 31.2479L54.2396 10.7509C56.814 8.58681 57.1467 4.74543 54.9825 2.17073C52.8184 -0.403648 48.977 -0.736342 46.4027 1.42778L28.2054 16.724L10.0085 1.42778Z" fill="url(#{ID}-1)"></path><defs><linearGradient id="{ID}-0" x1="50.3153" y1="5.76727" x2="50.3153" y2="44.8701" gradientUnits="userSpaceOnUse"><stop stop-color="#60D673"></stop><stop offset="0.17" stop-color="#42C868"></stop><stop offset="0.39" stop-color="#0EBC5F"></stop><stop offset="0.62" stop-color="#00A9BB"></stop><stop offset="0.86" stop-color="#3C90FF"></stop><stop offset="1" stop-color="#3186FF"></stop></linearGradient><linearGradient id="{ID}-1" x1="6.04194e-05" y1="6.45153" x2="56.4107" y2="6.45153" gradientUnits="userSpaceOnUse"><stop offset="0.08" stop-color="#FF63A0"></stop><stop offset="0.3" stop-color="#FC413D"></stop><stop offset="0.5" stop-color="#FC413D"></stop><stop offset="0.65" stop-color="#FC413D"></stop><stop offset="0.72" stop-color="#FC5C30"></stop><stop offset="0.86" stop-color="#FEB10C"></stop><stop offset="0.91" stop-color="#FEC700"></stop><stop offset="0.96" stop-color="#FFDB0F"></stop></linearGradient></defs>`,
  },
  {
    name: "Slack",
    viewBox: "0 0 49.883 49.877",
    size: 15,
    mark: `<path d="M18.3549 10.4784C15.4713 10.4784 13.1157 8.12279 13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V10.4784H18.3549Z" fill="#36C5F0"></path><path d="M18.3575 13.12C21.2411 13.12 23.5967 15.4756 23.5967 18.3592C23.5967 21.2428 21.2411 23.5984 18.3575 23.5984H5.2392C2.35561 23.5984 0 21.2428 0 18.3592C0 15.4756 2.35561 13.12 5.2392 13.12H18.3575Z" fill="#36C5F0"></path><g transform="translate(26.28 0)"><path d="M13.1244 18.3592C13.1244 15.4756 15.48 13.12 18.3636 13.12C21.2472 13.12 23.6028 15.4756 23.6028 18.3592C23.6028 21.2428 21.2472 23.5984 18.3636 23.5984H13.1244V18.3592Z" fill="#2EB67D"></path><path d="M10.4785 18.3575C10.4785 21.2411 8.12286 23.5967 5.23927 23.5967C2.35568 23.5967 7.4362e-05 21.2411 7.4362e-05 18.3575V5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0C8.12286 0 10.4785 2.35561 10.4785 5.2392V18.3575Z" fill="#2EB67D"></path></g><g transform="translate(0 26.28)"><path d="M10.4784 5.2392C10.4784 8.12279 8.12279 10.4784 5.2392 10.4784C2.35561 10.4784 0 8.12279 0 5.2392C0 2.35561 2.35561 0 5.2392 0H10.4784V5.2392Z" fill="#E01E5A"></path><path d="M13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V18.3575C23.5941 21.2411 21.2385 23.5967 18.3549 23.5967C15.4713 23.5967 13.1157 21.2411 13.1157 18.3575V5.2392Z" fill="#E01E5A"></path></g><g transform="translate(26.28 26.28)"><path d="M5.23927 13.1157C8.12286 13.1157 10.4785 15.4713 10.4785 18.3549C10.4785 21.2385 8.12286 23.5941 5.23927 23.5941C2.35568 23.5941 7.4362e-05 21.2385 7.4362e-05 18.3549V13.1157H5.23927Z" fill="#ECB22E"></path><path d="M5.23927 10.4784C2.35568 10.4784 7.4362e-05 8.12279 7.4362e-05 5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0H18.3576C21.2412 0 23.5968 2.35561 23.5968 5.2392C23.5968 8.12279 21.2412 10.4784 18.3576 10.4784H5.23927Z" fill="#ECB22E"></path></g>`,
  },
  simple("Google Calendar", "M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z", "#4285F4"),
  simple("HubSpot", "M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z", "#FF7A59"),
  simple("Notion", "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z", "currentColor"),
];

const feature = (labels: string[], included: boolean[]): PricingFeature[] => labels.map((label, i) => ({ label, included: included[i] }));
const FEATURES = ["Unlimited dashboards", "Custom domains", "API access", "Scheduled reports", "SSO", "Dedicated onboarding"];

/** The plans shown when `plans` is unset: Starter, Growth (Popular) and Scale */
export function pricingDefaultPlans(): PricingPlan[] {
  return [
    {
      id: "starter",
      name: "Starter",
      price: { monthly: 29, yearly: 24 },
      limits: [
        { icon: "visitors", label: "Monthly visitors", value: "10k" },
        { icon: "seats", label: "Seats", value: "2" },
        { icon: "workspaces", label: "Workspaces", value: "1" },
      ],
      sync: "Hourly",
      pick: 2,
      features: [...feature(FEATURES, [true, false, false, true, false, false]), { label: "Email support", included: true }],
    },
    {
      id: "growth",
      name: "Growth",
      badge: "Popular",
      price: { monthly: 99, yearly: 79 },
      limits: [
        { icon: "visitors", label: "Monthly visitors", value: "100k" },
        { icon: "seats", label: "Seats", value: "10" },
        { icon: "workspaces", label: "Workspaces", value: "3" },
      ],
      sync: "Every 15 min",
      pick: 4,
      features: [...feature(FEATURES, [true, true, true, true, false, false]), { label: "Chat + Email support", included: true }],
    },
    {
      id: "scale",
      name: "Scale",
      price: { monthly: 249, yearly: 199 },
      limits: [
        { icon: "visitors", label: "Monthly visitors", value: "1M" },
        { icon: "seats", label: "Seats", value: "Unlimited" },
        { icon: "workspaces", label: "Workspaces", value: "10" },
      ],
      sync: "Real-time",
      pick: 7,
      features: [...feature(FEATURES, [true, true, true, true, false, true]), { label: "Priority support + Slack channel", included: true }],
    },
  ];
}

const DEFAULT_PLANS = pricingDefaultPlans();

let instances = 0;

/**
 * A pricing section: a Monthly / Yearly switch and a card per plan with limits, a call to action and collapsible details.
 * @tag tc-pricing-plans
 * @fires tc-billing-change - The billing period was switched ({ billing }: PricingBillingChange); cancelable – prevented, `billing` stays as it is (controlled use)
 * @fires tc-details-change - Show / Hide details was pressed ({ details }: PricingDetailsChange); cancelable – prevented, `details` stays as it is
 * @fires tc-plan-select - A plan's call to action was pressed ({ plan, billing }: PricingPlanSelect)
 */
export class TcPricingPlans extends TcElement {
  static override ui = "pp";

  /** The heading – "Choose your plan" by default */
  @property() accessor heading = "Choose your plan";
  /** The line under the heading */
  @property() accessor subtitle = "Find the right plan for your team. Start with a 14-day free trial.";
  /** The plans; unset shows three example plans */
  @property({ attribute: false }) accessor plans: PricingPlan[] | undefined = undefined;
  /** The billing period shown */
  @property() accessor billing: PricingBilling = "yearly";
  /** Whether every card's details are open */
  @property({ type: Boolean, converter: { fromAttribute: (v) => v !== "false" } }) accessor details = true;
  /** Put before the amount – "$" by default */
  @property() accessor currency = "$";
  /** The billing switch's accessible name */
  @property({ attribute: "billing-label" }) accessor billingLabel = "Billing period";

  /** The period changed since the first render: the digits roll from now on */
  @state() private accessor switched = false;
  private first?: PricingBilling;
  private readonly uid = `tc-pp${++instances}`;

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.first === undefined) this.first = this.billing;
    else if (!this.switched && this.billing !== this.first) this.switched = true;
  }

  private onBilling = (e: CustomEvent<{ value: string }>) => {
    e.stopPropagation();
    const next = e.detail.value as PricingBilling;
    if (next === this.billing) return;
    if (this.emit<PricingBillingChange>("tc-billing-change", { billing: next }, { cancelable: true })) this.billing = next;
    else e.preventDefault();
  };

  private toggleDetails() {
    const next = !this.details;
    if (this.emit<PricingDetailsChange>("tc-details-change", { details: next }, { cancelable: true })) this.details = next;
  }

  private renderAmount(value: number) {
    const text = `${this.currency}${value.toLocaleString("en-US")}`;
    if (!this.switched) return html`<span class="ui-pp__amount">${text}</span>`;
    // The digits roll for the eye; assistive tech reads the whole price once. Keyed by place and digit, so only the
    // digits that change roll
    const digits = text.split("").map((d, i) => ({ key: `${text.length - i}-${d}`, d }));
    return html`<span class="ui-pp__amount"
      ><span class="ui-pp__sr">${text}</span>${repeat(
        digits,
        (x) => x.key,
        (x) => html`<span class="ui-pp__digit" aria-hidden="true">${x.d}</span>`,
      )}</span
    >`;
  }

  private renderIcon(icon: PricingLimit["icon"]) {
    if (icon instanceof Element) return icon.cloneNode(true);
    if (!icon || !ICONS[icon]) return nothing;
    return html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[icon]}</svg>`;
  }

  private renderApp(app: App, p: number) {
    const id = `${this.uid}-${p}-${app.name.replace(/\W/g, "")}`;
    return html`<li class="ui-pp__app" ?data-filled=${!!app.background} style=${app.background ? `background: ${app.background}` : ""} title=${app.name}>
      <svg viewBox=${app.viewBox} width=${app.size} height=${app.size} fill=${app.fill ?? "none"} aria-hidden="true">${unsafeSVG(app.mark.replaceAll("{ID}", id))}</svg>
      <span class="ui-pp__sr">${app.name}</span>
    </li>`;
  }

  private renderPlan(plan: PricingPlan, p: number) {
    const billing = this.billing;
    const details = this.details;
    const detailsId = `${this.uid}-details-${p}`;
    const price = plan.price?.[billing];
    return html`<article class="ui-pp__card" ?data-featured=${!!plan.badge}>
      <p class="ui-pp__name">${plan.name}${plan.badge ? html`<span class="ui-pp__badge">${plan.badge}</span>` : nothing}</p>
      <p class="ui-pp__price">${this.renderAmount(Number.isFinite(price) ? price : 0)}<span class="ui-pp__per">/per month</span></p>
      <hr class="ui-pp__rule" />
      <ul class="ui-pp__limits">
        ${(plan.limits ?? []).map(
          (limit) => html`<li>
            <span class="ui-pp__limit-label"><span class="ui-pp__icon">${this.renderIcon(limit.icon)}</span>${limit.label}</span>
            <span class="ui-pp__limit-value">${limit.value}</span>
          </li>`,
        )}
      </ul>
      <tc-button class="ui-pp__cta" .label=${plan.cta ?? "Start free trial"} @click=${() => this.emit<PricingPlanSelect>("tc-plan-select", { plan, billing })}></tc-button>
      <tc-button
        class="ui-pp__toggle"
        variant="ghost"
        size="sm"
        .label=${details ? "Hide details" : "Show details"}
        aria-expanded=${details ? "true" : "false"}
        aria-controls=${detailsId}
        @click=${() => this.toggleDetails()}
        ><svg slot="icon-right" class="ui-pp__chevron" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 9.75 3.5-3.5 3.5 3.5"></path></svg
      ></tc-button>
      <div id=${detailsId} class="ui-pp__details" ?data-open=${details} .inert=${!details}>
        <div class="ui-pp__details-inner">
          <hr class="ui-pp__rule" />
          <div class="ui-pp__section-head"><span class="ui-pp__eyebrow">Integrations</span><span class="ui-pp__chip">${plan.sync}</span></div>
          <div class="ui-pp__section-sub"><span class="ui-pp__tag">Native sync</span><span>Choose ${plan.pick} of ${APPS.length}</span></div>
          <ul class="ui-pp__apps" aria-label="Integrations">
            ${APPS.map((app) => this.renderApp(app, p))}
          </ul>
          <ul class="ui-pp__features">
            ${(plan.features ?? []).map(
              (f) => html`<li ?data-included=${f.included}>
                ${f.included
                  ? html`<svg class="ui-pp__mark" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"></path></svg>`
                  : html`<svg class="ui-pp__mark" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3.5 8h9"></path></svg>`}
                <span>${f.label}</span>
                <span class="ui-pp__sr">${f.included ? "(included)" : "(not included)"}</span>
              </li>`,
            )}
          </ul>
        </div>
      </div>
    </article>`;
  }

  override render() {
    const options: SegmentOption[] = [
      { value: "monthly", label: "Monthly" },
      { value: "yearly", label: "Yearly" },
    ];
    const plans = this.plans ?? DEFAULT_PLANS;
    return html`<header class="ui-pp__head">
        <h2 class="ui-pp__title">${this.heading}</h2>
        ${this.subtitle ? html`<p class="ui-pp__subtitle">${this.subtitle}</p>` : nothing}
      </header>
      <div class="ui-pp__switch" data-billing=${this.billing}>
        <tc-segmented-control aria-label=${this.billingLabel} .options=${options} .value=${this.billing} @tc-value-change=${this.onBilling}></tc-segmented-control>
      </div>
      <div class="ui-pp__plans">${repeat(plans, (plan) => plan.id, (plan, p) => this.renderPlan(plan, p))}</div>`;
  }

  static override css = /* css */ `
[data-ui="pp"] {
  --tc-pp-featured-border: light-dark(rgba(47, 107, 255, 0.28), rgba(107, 149, 255, 0.42));
  --tc-pp-featured-glow: light-dark(rgba(47, 107, 255, 0.06), rgba(47, 107, 255, 0.14));
  --tc-pp-tile-filled-ring: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.1));
  --tc-pp-pad-top: 48px;
  --tc-pp-pad-bottom: 56px;
  --tc-pp-max: 1152px;
  --tc-pp-tile: 28px;
  container-type: inline-size;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-pp-pad-top) var(--tc-space-4) var(--tc-pp-pad-bottom);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
[data-ui="pp"] *, [data-ui="pp"] *::before, [data-ui="pp"] *::after { box-sizing: border-box; }

.ui-pp__head { text-align: center; }
.ui-pp__title {
  margin: 0;
  font-size: var(--tc-font-size-2xl);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-display-sm);
  letter-spacing: var(--tc-tracking-tight);
}
.ui-pp__subtitle {
  margin: var(--tc-space-1-5) 0 0;
  font-size: var(--tc-font-size-xl);
  line-height: var(--tc-line-height-loose);
  color: var(--tc-text-muted);
}

/* Monthly / yearly: the library's segmented control, centred */
.ui-pp__switch { display: flex; justify-content: center; margin: var(--tc-space-5) auto 0; }

.ui-pp__plans {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--tc-space-4);
  align-items: start;
  max-width: var(--tc-pp-max);
  margin: var(--tc-space-6) auto 0;
}
@container (max-width: 860px) {
  .ui-pp__plans { grid-template-columns: minmax(0, 1fr); max-width: 420px; }
}

.ui-pp__card {
  padding: var(--tc-space-4);
  background: var(--tc-surface-raised);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
.ui-pp__card[data-featured] { box-shadow: 0 0 0 1px var(--tc-pp-featured-border), 0 0 0 4px var(--tc-pp-featured-glow); }
.ui-pp__badge {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  color: var(--tc-accent-text);
}
.ui-pp__name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  margin: 0 0 var(--tc-space-2);
  font-size: var(--tc-font-size-xl);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-loose);
  letter-spacing: var(--tc-tracking-snug);
  color: var(--tc-text-secondary);
}
.ui-pp__price { display: flex; align-items: baseline; gap: var(--tc-space-1); margin: 0 0 var(--tc-space-2-5); line-height: var(--tc-line-height-normal); }
.ui-pp__amount {
  display: inline-flex;
  font-size: var(--tc-font-size-2xl);
  font-weight: var(--tc-font-weight-semibold);
  letter-spacing: var(--tc-tracking-tight);
}
.ui-pp__digit { display: inline-block; animation: ui-pp-roll var(--tc-duration-slowest) var(--tc-ease-move) both; }
.ui-pp__per { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-pp__rule { height: 0; margin: 0 0 var(--tc-space-4); border: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }

.ui-pp__limits { display: grid; gap: var(--tc-space-3); margin: 0 0 var(--tc-space-4); padding: 0; list-style: none; }
.ui-pp__limits li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
}
.ui-pp__limit-label { display: flex; align-items: center; gap: var(--tc-space-2); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-pp__icon { display: grid; color: var(--tc-text-secondary); }
.ui-pp__icon > svg { width: var(--tc-space-4); height: var(--tc-space-4); }
.ui-pp__limit-value { font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-tracking-snug); }

/* The call to action is the library's primary button (flat ink), full width; the toggle is centred under it */
.ui-pp__card > tc-button.ui-pp__cta { display: flex; width: 100%; }
.ui-pp__card > tc-button.ui-pp__toggle { display: flex; width: fit-content; margin: var(--tc-space-2) auto 0; }
.ui-pp__chevron { transition: transform var(--tc-duration-slow) var(--tc-ease-move); }
.ui-pp__toggle:has([aria-expanded="false"]) .ui-pp__chevron { transform: rotate(180deg); }

/* Collapsible details */
.ui-pp__details {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
  opacity: 0;
}
.ui-pp__details[data-open] { grid-template-rows: 1fr; opacity: 1; }
.ui-pp__details-inner { min-height: 0; overflow: hidden; padding-top: var(--tc-space-4); }

.ui-pp__section-head, .ui-pp__section-sub { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-pp__eyebrow {
  font-size: var(--tc-eyebrow-font-size);
  font-weight: var(--tc-eyebrow-font-weight);
  line-height: var(--tc-eyebrow-line-height);
  letter-spacing: var(--tc-eyebrow-tracking);
  text-transform: var(--tc-eyebrow-transform);
  color: var(--tc-eyebrow-color);
}
/* Sync chip and "Native sync" tag: the library pill */
.ui-pp__chip, .ui-pp__tag {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  white-space: nowrap;
}
.ui-pp__chip { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-pp__section-sub {
  margin-top: var(--tc-space-2-5);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-secondary);
}
.ui-pp__tag { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }

/* Seven tiles in one row – they shrink a little on narrow cards instead of wrapping */
.ui-pp__apps {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, var(--tc-pp-tile)));
  gap: var(--tc-space-2);
  margin: var(--tc-space-2) 0 0;
  padding: 0;
  list-style: none;
}
.ui-pp__app {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-overlay);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  color: var(--tc-text-primary);
}
.ui-pp__app[data-filled] { box-shadow: inset 0 0 0 1px var(--tc-pp-tile-filled-ring); }
.ui-pp__app svg { max-width: 58%; height: auto; }

.ui-pp__features { display: grid; gap: var(--tc-space-2); margin: var(--tc-space-5) 0 0; padding: 0; list-style: none; }
.ui-pp__features li {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
}
.ui-pp__features li[data-included] { color: var(--tc-text-primary); }
.ui-pp__mark { flex: none; color: var(--tc-text-muted); }
.ui-pp__features li[data-included] .ui-pp__mark { color: var(--tc-text-secondary); }
.ui-pp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@keyframes ui-pp-roll { from { opacity: 0; transform: translateY(40%); filter: blur(2px); } }

@media (prefers-reduced-motion: reduce) {
  .ui-pp__details, .ui-pp__chevron { transition: none; }
  .ui-pp__digit { animation: none; }
}
@media (forced-colors: active) {
  .ui-pp__card, .ui-pp__app { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-pricing-plans")) customElements.define("tc-pricing-plans", TcPricingPlans);
declare global {
  interface HTMLElementTagNameMap {
    "tc-pricing-plans": TcPricingPlans;
  }
}
