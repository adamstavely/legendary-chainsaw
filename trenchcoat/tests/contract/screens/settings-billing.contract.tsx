import type { ContractSpec } from "../../contract.test";

export const spec: ContractSpec = {
  component: "SettingsBillingScreen",
  props: {},
  controlled: [
    {
      prop: "tab",
      values: ["Billing", "API keys"],
      // The tab's visible label (the tabs may also carry an aria-hidden copy that reserves the bold width)
      read: (root) => {
        const tab = root.querySelector('.ui-sb__bar [role="tab"][aria-selected="true"]');
        if (!tab) return undefined;
        const copy = tab.cloneNode(true) as Element;
        copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
        return copy.textContent;
      },
    },
  ],
};
