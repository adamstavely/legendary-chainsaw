/*
 * Lit update-count budgets (remediation step 2.7), in place of the React render budgets: every element, mounted with
 * no props in batches of 40, settles, plays its entrance, then sits idle for 3 s. An element that keeps updating on its
 * own – a timer or a frame loop driving state instead of the DOM – shows up here. Budgets are the recorded idle counts
 * plus 30 % (at least 5).
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
const ENTRANCE_MS = 2000;
// Every tag the package defines, captured as the modules register them (some modules define several)
const tags: string[] = [];
const define = customElements.define.bind(customElements);
customElements.define = (name, ctor, options) => {
  if (name.startsWith("tc-") && name !== "tc-look-provider") tags.push(name);
  define(name, ctor, options);
};
await import("../../src/elements/index");
customElements.define = define;

const counts: Record<string, number> = {};
const known = budgets as Record<string, number>;
const writing = !!import.meta.env.VITE_UPDATE_BUDGETS;

// Measured 40 at a time, each batch alone on the page and cleared before the next. With every element on one page,
// each settle() walked all of them and the test crept up on its time limit in WebKit on a two-core CI runner (184–226
// of 240 s); a batch is a test of its own, with its own limit.
const BATCH = 40;
const batches = Array.from({ length: Math.ceil(tags.length / BATCH) }, (_, i) => tags.slice(i * BATCH, (i + 1) * BATCH));

/** Mounts a batch with no props, lets it settle, then counts its updates while it sits idle */
async function measure(batch: string[]) {
  let counting = false;
  const proto = TcElement.prototype as unknown as { update: (c: unknown) => void };
  const original = proto.update;
  proto.update = function (this: HTMLElement, changed: unknown) {
    if (counting) counts[this.localName] = (counts[this.localName] ?? 0) + 1;
    original.call(this, changed);
  };
  try {
    for (const tag of batch) {
      counts[tag] = 0;
      document.body.append(document.createElement(tag));
    }
    await settle();
    // On screen now, charts play their entrance (a delay, then up to a second of easing): let it end before counting
    await new Promise((r) => setTimeout(r, ENTRANCE_MS));
    counting = true;
    await new Promise((r) => setTimeout(r, IDLE_MS));
    counting = false;
  } finally {
    proto.update = original;
  }
}

describe("update budgets", () => {
  for (const [i, batch] of batches.entries()) {
    test(`elements ${i * BATCH + 1}–${i * BATCH + batch.length} stay within their idle update budgets`, async () => {
      await measure(batch);
      if (writing) return;
      const over = batch
        .map((tag) => ({ tag, n: counts[tag], budget: known[tag] ?? 0 }))
        .filter(({ n, budget }) => n > Math.max(Math.ceil(budget * 1.3), budget + 5))
        .map(({ tag, n, budget }) => `${tag}: ${n} idle updates in ${IDLE_MS} ms (budget ${budget})`);
      expect(over).toEqual([]);
    }, 60_000);
  }

  test("every element was measured", async () => {
    expect(Object.keys(counts)).toEqual(tags);
    expect(tags.length).toBeGreaterThan(100);
    if (writing) await commands.writeFile("tests/elements/update-budgets.json", JSON.stringify(Object.fromEntries(Object.entries(counts).sort()), null, 2) + "\n");
  });
});
