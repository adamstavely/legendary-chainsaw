import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { WatchFilter, WatchItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A payments fraud team's watchlist of merchant and customer accounts. Filters narrow it by risk; opening a row names
   it below; "Raise Lumen Freight" moves an account up to Critical, and the list re-sorts. */

const ITEMS: WatchItem[] = [
  { id: "m-4471", name: "Northwind Traders", ref: "MER-4471-K", group: "Case 22-1187", risk: "critical", shape: "square" },
  { id: "c-0098", name: "Dana Okafor", ref: "CUS-0098-S", group: "Chargebacks", risk: "critical" },
  { id: "m-9011", name: "Lumen Freight", ref: "MER-9011-P", group: "Case 23-0461", risk: "elevated", shape: "square" },
  { id: "c-2210", name: "Ravi Menon", ref: "CUS-2210-V", group: "Case 22-1187", risk: "elevated" },
  { id: "m-6603", name: "Copperleaf Market", ref: "MER-6603-K", group: "New merchants", risk: "guarded", shape: "square" },
  { id: "c-1144", name: "Mia Lindqvist", ref: "CUS-1144-R", group: "Chargebacks", risk: "guarded" },
  { id: "c-5560", name: "Tomás Herrera", ref: "CUS-5560-B", group: "Account review", risk: "low" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Watchlist } = ui;
  const [items, setItems] = useState(ITEMS);
  const [filter, setFilter] = useState<WatchFilter>("all");
  const [opened, setOpened] = useState("");
  const raised = items.find((i) => i.id === "m-9011")?.risk === "critical";
  return (
    <div style={{ width: "100%", maxWidth: 460, display: "grid", gap: 8 }}>
      <Watchlist
        title="Watchlist"
        description="Accounts the fraud team is watching"
        items={items}
        filters
        filter={filter}
        onFilterChange={setFilter}
        onOpen={(_, item) => setOpened(item.name)}
        onViewAll={() => setOpened("the full watchlist")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {opened ? `Opened ${opened}. ` : "Open a row with Enter or a click. "}
        <button type="button" style={textButton} onClick={() => setItems(raised ? ITEMS : items.map((i) => (i.id === "m-9011" ? { ...i, risk: "critical" } : i)))}>
          {raised ? "Reset" : "Raise Lumen Freight"}
        </button>
      </div>
    </div>
  );
}
