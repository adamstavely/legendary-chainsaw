import type { ContractSpec } from "../contract.test";

// IntegrationSettings' root is a <section> (after its <style>); the saved values are controllable
// (values / defaultValues / onValuesChange) – fields that weren't edited follow a new `values` prop
export const spec: ContractSpec = {
  component: "IntegrationSettings",
  props: { name: "Shopify", logo: null },
  ref: "root",
  controlled: [
    {
      prop: "values",
      values: [
        { enabled: true, siteUrl: "a.example.com" },
        { enabled: false, siteUrl: "b.example.com" },
      ],
      read: (root) => ({
        enabled: root.querySelector('[role="switch"]')!.getAttribute("aria-checked") === "true",
        siteUrl: root.querySelector<HTMLInputElement>("input[inputmode=url]")!.value,
      }),
    },
  ],
};
