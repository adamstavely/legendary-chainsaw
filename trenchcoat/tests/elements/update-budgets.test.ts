/*
 * Lit update-count budgets (remediation step 2.7), in place of the React render budgets: every element, mounted with
 * no props, settles, then sits idle for 3 s. An element that keeps updating on its own – a timer or a frame loop
 * driving state instead of the DOM – shows up here. Budgets are the recorded idle counts plus 30 % (at least 5).
 *   VITE_UPDATE_BUDGETS=1 npx vitest run --project elements tests/elements/update-budgets.test.ts --browser.name=chromium
 * rewrites tests/elements/update-budgets.json after an intended change.
 */
import { commands } from "vitest/browser";
import { afterEach, describe, expect, test } from "vitest";
import { TcElement } from "../../src/elements/internal/base";
import budgets from "./update-budgets.json";
import { cleanup, settle } from "./helpers";

afterEach(cleanup);

const IDLE_MS = 3000;
// Every tag the package defines, captured as the modules register them (some modules define several)
const tags: string[] = [];
const define = customElements.define.bind(customElements);
customElements.define = (name, ctor, options) => {
  if (name.startsWith("tc-") && name !== "tc-look-provider") tags.push(name);
  define(name, ctor, options);
};
await import("../../src/elements/index");
customElements.define = define;

describe("update budgets", () => {
  test("every element stays within its idle update budget", async () => {
    const counts: Record<string, number> = {};
    let counting = false;
    const proto = TcElement.prototype as unknown as { update: (c: unknown) => void };
    const original = proto.update;
    proto.update = function (this: HTMLElement, changed: unknown) {
      if (counting) counts[this.localName] = (counts[this.localName] ?? 0) + 1;
      original.call(this, changed);
    };
    try {
      // Mounted in batches, each settled before the next: all at once is the peak a two-core CI runner struggles with
      for (let i = 0; i < tags.length; i += 40) {
        for (const tag of tags.slice(i, i + 40)) {
          counts[tag] = 0;
          document.body.append(document.createElement(tag));
        }
        await settle();
      }
      await new Promise((r) => setTimeout(r, 300));
      counting = true;
      await new Promise((r) => setTimeout(r, IDLE_MS));
      counting = false;
    } finally {
      proto.update = original;
    }

    if (import.meta.env.VITE_UPDATE_BUDGETS) {
      await commands.writeFile("tests/elements/update-budgets.json", JSON.stringify(Object.fromEntries(Object.entries(counts).sort()), null, 2) + "\n");
      return;
    }
    const known = budgets as Record<string, number>;
    const over = Object.entries(counts)
      .map(([tag, n]) => ({ tag, n, budget: known[tag] ?? 0 }))
      .filter(({ n, budget }) => n > Math.max(Math.ceil(budget * 1.3), budget + 5))
      .map(({ tag, n, budget }) => `${tag}: ${n} idle updates in ${IDLE_MS} ms (budget ${budget})`);
    expect(over).toEqual([]);
    expect(Object.keys(counts).length, "every element was mounted").toBeGreaterThan(100);
    // Every element on one page: slow on a two-core CI runner, in WebKit above all
  }, 240_000);
});
