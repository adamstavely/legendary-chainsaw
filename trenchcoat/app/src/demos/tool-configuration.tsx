import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ToolConfigurationValue } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/* A support team's agent tools. Order search reads only, so it runs on its own; one parameter still needs a
   description. Issue refund changes money, so it asks a person every time – and it has a problem to fix: two
   parameters share a name, and an amount that isn't a number. A new tool starts with the name open. */

const EXAMPLES: { label: string; value: ToolConfigurationValue }[] = [
  {
    label: "Order search",
    value: {
      name: "search_orders",
      description: "Find a customer's orders by email, order number or product. Use it before answering any question about an order's status.",
      parameters: [
        { name: "query", type: "string", required: true, description: "An email address, order number (#10423) or product name" },
        { name: "status", type: "string", required: false, description: "Only orders in this state", enum: ["open", "shipped", "delivered", "refunded"] },
        { name: "placed_after", type: "string", required: false, description: "" },
        { name: "limit", type: "integer", required: false, description: "How many orders to return, newest first", enum: ["5", "10", "25"] },
      ],
      approval: "auto",
    },
  },
  {
    label: "Issue refund",
    value: {
      name: "issue_refund",
      description: "Refund all or part of an order to the original payment method.",
      parameters: [
        { name: "order_id", type: "string", required: true, description: "The order to refund" },
        { name: "amount", type: "number", required: true, description: "In the order's currency", enum: ["full"] },
        { name: "order_id", type: "string", required: false, description: "Why the customer asked" },
      ],
      approval: "ask",
    },
  },
  { label: "New tool", value: { name: "", description: "", parameters: [], approval: "inherit" } },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ToolConfiguration } = ui;
  const [pick, setPick] = useState(0);
  const [value, setValue] = useState<ToolConfigurationValue>(EXAMPLES[0].value);
  return (
    <div style={{ width: "100%", maxWidth: 920, display: "grid", gap: 12 }}>
      <ToolConfiguration key={pick} description="Support agent · Orders" value={value} onChange={setValue} name="tool" />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {EXAMPLES.map((x, i) => (
          <button
            key={x.label}
            type="button"
            style={buttonSm}
            aria-pressed={i === pick}
            onClick={() => {
              setPick(i);
              setValue(x.value);
            }}
          >
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}
